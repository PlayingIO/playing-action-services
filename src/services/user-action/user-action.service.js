import assert from 'assert';
import makeDebug from 'debug';
import { idAction } from 'mostly-feathers';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import { helpers as metrics } from 'playing-metric-services';
import { helpers as rules } from 'playing-rule-services';

import UserActionModel from '../../models/user-action.model';
import defaultHooks from './user-action.hooks';
import { fulfillActionRequires, fulfillActionRewards } from '../../helpers';

const debug = makeDebug('playing:actions-services:user-actions');

const defaultOptions = {
  name: 'user-actions'
};

export class UserActionService extends Service {
  constructor (options) {
    options = fp.assign(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  /**
   * find user actions of current user
   */
  async find (params) {
    params = Object.assign({ query: {} }, params);
    assert(params.query.user, 'params.query.user not provided');
    return super.find(params);
  }

  /**
   * get user actions by action id
   */
  async get (id, params) {
    let action = null;
    [id, action] = idAction(id, params);
    if (action) {
      return super._action('get', action, id, null, params);
    }

    params = Object.assign({ query: {} }, params);
    assert(params.query.user, 'params.query.user not provided');
    params.query.action = params.query.action || id;
    return this.first(params);
  }

  /**
   * play a user action (count and reward)
   */
  async create (data, params) {
    const svcActions = this.app.service('actions');

    // get action with rewards to fulfill it
    const getAction = (id) => svcActions.get(id, {
      query: { $select: ['rules.rewards.metric', '*'] }
    });
    // upsert a user action
    const saveUserAction = (data) => super.upsert(null, data, {
      query: { action: data.action, user: params.user.id }
    });

    const action = await getAction(data.action);
    assert(action, 'data.action is not exists.');
    data.name = action.name; // for cache

    // save user's action
    let userAction = await saveUserAction(data);

    let actionLimit = { $inc: { count: 1 } };

    // rate limiting the action
    if (action.rate && action.rate.frequency) {
      let { count, firstRequest, lastRequest, expiredAt } = rules.checkRateLimit(action.rate, userAction.limit || {});
      actionLimit = {
        $inc: { count: 1, 'limit.count': count },
        $set: {
          'limit.firstRequest': firstRequest,
          'limit.lastRequest': lastRequest,
          'limit.expiredAt': expiredAt
        }
      };
    }
    userAction = await super.patch(userAction.id, actionLimit);
  
    // create the action rewards
    const rewards = fulfillActionRewards(action, params.user);
    if (rewards.length > 0) {
      userAction.rewards = await metrics.createUserMetrics(this.app, params.user.id, rewards, data.variables);
    } else {
      userAction.rewards = [];
    }

    // process the rules (TODO notify as an event)
    const events = await rules.processUserRules(this.app)(params.user);
    debug('process rules', events && events.length);

    params.locals = { userAction }; // for notifier

    return { action: userAction, events };
  }

  /**
   * Active actions for current player
   */
  async active (id, data, params) {
    params = fp.assign({ query: {} }, params);
    assert(params.user, 'params.user not provided');

    const svcActions = this.app.service('actions');

    // get available actions
    const getAllActions = async () => svcActions.find({
      query: { $select: ['rules.rewards.metric', '*'] },
      paginate: false
    });
    // get user-actions of provided actions
    const getUserActions = async (actions) => {
      return super.find({
        query: { action: { $in: fp.map(fp.prop('id'), actions) } },
        paginate: false
      });
    };

    // filter actions by requires
    const fulfillActions = (actions => {
      const activeActions = fp.reduce((arr, action) => {
        // filter by visibility requirements
        if (fulfillActionRequires(action, params.user)) {
          // filter by the rule requirements
          const rewards = fulfillActionRewards(action, params.user);
          action = fp.omit(['rules', 'requires', 'rate'], action);
          action.rewards = rewards;
          return arr.concat(action);
        }
        return arr;
      }, [], actions);
      return activeActions;
    });

    // assoc count from user-actions to active actions
    const assocActionsCount = (actions, userActions) => {
      return fp.map(action => {
        const userAction = fp.find(fp.propEq('action', action.id), userActions);
        return fp.assoc('count', userAction && userAction.count || 0, action);
      }, actions);
    };

    const allActions = await getAllActions();
    const activeActions = fulfillActions(allActions);
    const userActions = await getUserActions(activeActions);
    return assocActionsCount(activeActions, userActions);
  }
}

export default function init (app, options, hooks) {
  options = fp.assign({ ModelName: 'user-action' }, options);
  return createService(app, UserActionService, UserActionModel, options);
}

init.Service = UserActionService;

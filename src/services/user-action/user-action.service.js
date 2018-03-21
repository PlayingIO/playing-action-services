import assert from 'assert';
import dateFn from 'date-fns';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import { helpers as metrics } from 'playing-metric-services';
import { helpers as rules } from 'playing-rule-services';

import UserActionModel from '~/models/user-action.model';
import defaultHooks from './user-action.hooks';
import { fulfillActionRequires, fulfillActionRewards } from '../../helpers';

const debug = makeDebug('playing:user-actions-services:user-actions');

const defaultOptions = {
  name: 'user-actions'
};

class UserActionService extends Service {
  constructor (options) {
    options = Object.assign({}, defaultOptions, options);
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
    [id, action] = this._idOrAction(id, params);
    if (action) {
      return super._action('get', action, id, null, params);
    }

    params = Object.assign({ query: {} }, params);
    assert(params.query.user, 'params.query.user not provided');
    params.query.action = params.query.action || id;
    return this._first(null, null, params);
  }

  /**
   * play a user action (count and reward)
   */
  async create (data, params) {
    assert(data.action, 'data.action is not provided.');
    assert(data.user, 'data.user is not provided.');
    assert(params.user, 'params.user is not provided');
    data.variables = data.variables || {};
    delete data.count;

    const svcActions = this.app.service('actions');

    const getAction = async (id) => svcActions.get(id, {
      query: { $select: ['rules.rewards.metric', '*'] }
    });

    const saveUserAction = async (data) => super._upsert(null, data, {
      query: { action: data.action, user: data.user }
    });

    const action = await getAction(data.action);
    assert(action, 'data.action is not exists.');

    // save user's action
    const userAction = await saveUserAction(data);

    let actionCount = { count: 1 };

    // rate limiting the action
    if (action.rate && action.rate.frequency) {
      const now = new Date();
      let { count, lastRequest, firstRequest, expiredAt } = userAction.limit || {};
      if (expiredAt && expiredAt.getTime() >= now.getTime()) {
        // replenish the count for leady bucket
        if (action.rate.window === 'leaky') {
          count += Math.floor(rules.differenceInterval(lastRequest, now) / action.rate.frequency * count);
          count = Math.min(count, action.rate.count);
        }
      }

      // reset the limit
      if (!expiredAt || expiredAt.getTime() < now.getTime()) {
        count = action.rate.count;
        switch (action.rate.window) {
          case 'fixed':
            firstRequest = rules.startOfInterval(now, action.rate.frequency, action.rate.interval);
            break;
          case 'rolling':
            firstRequest = now;
            break;
          case 'leaky':
            firstRequest = now;
            break;
        }
        expiredAt = rules.addInterval(firstRequest, action.rate.frequency, action.rate.interval);
      }

      if (expiredAt.getTime() >= now.getTime() && count > 0) {
        count = count - 1;
        lastRequest = now;
      } else {
        throw new Error('Rate limit exceed, the action can only be triggered ' +
          `${action.rate.count} times every ${action.rate.frequency} ${action.rate.interval}s`);
      }

      actionCount['$set'] = {
        'limit.count': count,
        'limit.expiredAt': expiredAt,
        'limit.firstRequest': firstRequest,
        'limit.lastRequest': lastRequest
      };
    }
    await super.patch(userAction.id, actionCount);
  
    // create the action rewards
    const rewards = fulfillActionRewards(action, params.user);
    let results = { action: userAction };
    if (rewards.length > 0) {
      results.rewards = await metrics.createUserMetrics(this.app)(data.user, rewards, data.variables);
    } else {
      results.rewards = [];
    }

    // process the rules (TODO notify as an event)
    const events = await rules.processUserRules(this.app)(params.user);
    debug('process rules', events && events.length);

    return results;
  }

  /**
   * Active actions for current player
   */
  async _active (id, data, params) {
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
    const assocActions = (actions, userActions) => {
      return fp.map(action => {
        const userAction = fp.find(fp.propEq('action', action.id), userActions);
        return fp.assoc('count', userAction && userAction.count || 0, action);
      }, actions);
    };

    const allActions = await getAllActions();
    const activeActions = fulfillActions(allActions);
    const userActions = await getUserActions(activeActions);
    return assocActions(activeActions, userActions);
  }
}

export default function init (app, options, hooks) {
  options = Object.assign({ ModelName: 'user-action' }, options);
  return createService(app, UserActionService, UserActionModel, options);
}

init.Service = UserActionService;

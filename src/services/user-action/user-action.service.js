import assert from 'assert';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import UserActionModel from '~/models/user-action.model';
import defaultHooks from './user-action.hooks';
import { flattenActionRewards, fulfillActionRequires, fulfillActionRewards } from '../../helpers';

const debug = makeDebug('playing:user-actions-services:user-actions');

const defaultOptions = {
  name: 'user-actions'
};

class UserActionService extends Service {
  constructor(options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup(app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  /**
   * find user actions of current user
   */
  async find(params) {
    params = Object.assign({ query: {} }, params);
    assert(params.query.user, 'params.query.user not provided');
    return super.find(params);
  }

  /**
   * get user actions by action id
   */
  async get(id, params) {
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
  async create(data, params) {
    assert(data.action, 'data.action is not provided.');
    assert(data.user, 'data.user is not provided.');
    assert(params.user, 'params.user is not provided');
    delete data.count;

    const svcActions = this.app.service('actions');
    const svcUserRules = this.app.service('user-rules');
    const svcUserMetrics = this.app.service('user-metrics');

    const getAction = async (id) => svcActions.get(id, {
      query: { $select: ['rules.rewards.metric', '*'] }
    });

    const saveUserAction = async (data) => super._upsert(null, data, { query: {
      action: data.action,
      user: data.user
    }});

    const createUserMetrics = fp.reduce((arr, reward) => {
      if (reward.metric) {
        reward.metric = helpers.getId(reward.metric);
        reward.user = data.user;
        arr.push(svcUserMetrics.create(reward));
      }
      return arr;
    }, []);

    const action = await getAction(data.action)
    assert(action, 'data.action is not exists.');

    // TODO check the action requires and rate
    data['$inc'] = { count: 1 };
    data.rewards = flattenActionRewards(action);

    // save user's action
    const userAction = await saveUserAction(data);

    // create the action rewards
    const rewards = fulfillActionRewards(action, params.user);
    let results = { action: userAction };
    if (rewards.length > 0) {
      const metrics = await Promise.all(createUserMetrics(rewards));
      results.rewards = fp.flatten(metrics);
    } else {
      results.rewards = [];
    }

    // process the rules (TODO notify as an event)
    const events = await svcUserRules.create({ user: data.user }, { user: params.user });
    debug('process rules', events && events.length);

    return results;
  }

  /**
   * Active actions for current player
   */
  async _active(id, data, params) {
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

export default function init(app, options, hooks) {
  options = Object.assign({ ModelName: 'user-action' }, options);
  return createService(app, UserActionService, UserActionModel, options);
}

init.Service = UserActionService;

import assert from 'assert';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import metrics from 'playing-metric-common';
import rules from 'playing-rule-common';

import UserActionModel from '../../models/user-action.model';
import defaultHooks from './user-action.hooks';
import { fulfillActionRewards } from '../../helpers';

const debug = makeDebug('playing:actions-services:user-actions');

const defaultOptions = {
  name: 'user-actions'
};

export class UserActionService extends Service {
  constructor (options) {
    options = fp.assignAll(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  /**
   * Find user actions of current user
   */
  async find (params) {
    params = { query: {}, ...params };
    assert(params.query.user, 'params.query.user not provided');
    return super.find(params);
  }

  /**
   * Get user actions by action id
   */
  async get (id, params) {
    params = { query: {}, ...params };
    assert(params.query.user, 'params.query.user not provided');
    params.query.action = params.query.action || id;
    return this.first(params);
  }

  /**
   * Play a user action (count and reward)
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
}

export default function init (app, options, hooks) {
  options = { ModelName: 'user-action', ...options };
  return createService(app, UserActionService, UserActionModel, options);
}

init.Service = UserActionService;

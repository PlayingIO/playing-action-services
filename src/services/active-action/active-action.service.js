import assert from 'assert';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import defaultHooks from './active-action.hooks';
import { fulfillActionRequires, fulfillActionRewards } from '../../helpers';

const debug = makeDebug('playing:actions-services:active-actions');

const defaultOptions = {
  name: 'active-actions'
};

export class ActiveActionService {
  constructor (options) {
    this.options = fp.assignAll(defaultOptions, options);
    this.name = this.options.name;
  }

  setup (app) {
    this.app = app;
    this.hooks(defaultHooks(this.options));
  }

  /**
   * List of all available actions for current player
   */
  async find (params) {
    params = { query: {}, ...params };
    assert(params.user, 'user not provided');

    const svcActions = this.app.service('actions');
    const svcUserActions = this.app.service('user-actions');

    // get available actions
    const getAllActions = async (params) => {
      const actionParams = { query: {}, paginate: false, ...params };
      actionParams.query.$select = helpers.addToSelect(actionParams.query.$select || [], 'rules.rewards.metric', '*');
      return svcActions.find(actionParams);
    };
    // get user-actions of provided actions
    const getUserActions = async (actions) => {
      return svcUserActions.find({
        query: {
          action: { $in: fp.map(fp.prop('id'), actions) },
          user: params.user.id
        },
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
  return new ActiveActionService(options);
}

init.Service = ActiveActionService;

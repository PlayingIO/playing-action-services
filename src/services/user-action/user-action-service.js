import assert from 'assert';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import UserActionModel from '~/models/user-action-model';
import defaultHooks from './user-action-hooks';

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
   * find user-actions of current user
   * @param {*} params 
   */
  find(params) {
    params = Object.assign({ query: {} }, params);
    assert(params.query.user, 'params.query.user not provided');
    return super.find(params);
  }

  /**
   * get user-actions by action id
   */
  get(id, params) {
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
   * Active actions for current player
   */
  _active(id, data, params) {
    params = params || { query: {} };
    assert(params.user, 'params.user not provided');

    const srvActions = this.app.service('actions');
    // get available actions
    const getActions = srvActions.find({
      query: { $select: ['rules.rewards.metric', '*'] },
      paginate: false
    });
    // get user-actions of provided actions
    const getUserActions = (actions) => {
      return super.find({
        query: { action: { $in: fp.map(fp.prop('id'), actions) } },
        paginate: false
      });
    };

    // filter actions by requires
    const fulfillActions = (actions => {
      const scores = params.user.scores || [];
      const fulfillRequires = cond => { return true; }; // TODO
      const activeActions = fp.reduce((arr, action) => {
        // filter by visibility requirements
        if (fulfillRequires(action.requires)) {
          // filter by the rule requirements
          const activeRules = fp.filter(rule => {
            return fp.all(fulfillRequires, rule.requires);
          }, action.rules);
          const rewards = fp.flatten(fp.map(fp.prop('rewards'), activeRules));
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

    let activeActions = [];
    return getActions.then(results => {
      activeActions = fulfillActions(results && results.data || results);
      return getUserActions(activeActions);
    }).then(results => {
      return assocActions(activeActions, results && results.data || results);
    });
  }
}

export default function init(app, options, hooks) {
  options = Object.assign({ ModelName: 'user-action' }, options);
  return createService(app, UserActionService, UserActionModel, options);
}

init.Service = UserActionService;
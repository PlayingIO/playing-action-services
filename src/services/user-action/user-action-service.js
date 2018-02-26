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

  find(params) {
    params = params || { query: {} };
    const srvActions = this.app.service('actions');
    return srvActions.find(params).then(results => {
      // TODO filter by requirements
      return results;
    });
  }
}

export default function init(app, options, hooks) {
  options = Object.assign({ ModelName: 'user-action' }, options);
  return createService(app, UserActionService, UserActionModel, options);
}

init.Service = UserActionService;

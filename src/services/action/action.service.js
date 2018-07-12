const assert = require('assert');
const makeDebug = require('debug');
const { Service, createService } = require('mostly-feathers-mongoose');
const fp = require('mostly-func');

const ActionModel = require('../../models/action.model');
const defaultHooks = require('./action.hooks');

const debug = makeDebug('playing:actions-services:actions');

const defaultOptions = {
  name: 'actions'
};

class ActionService extends Service {
  constructor (options) {
    options = fp.assignAll(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }
}

module.exports = function init (app, options, hooks) {
  options = { ModelName: 'action', ...options };
  return createService(app, ActionService, ActionModel, options);
};
module.exports.Service = ActionService;

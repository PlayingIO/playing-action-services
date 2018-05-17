import assert from 'assert';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import { helpers as metrics } from 'playing-metric-services';
import { helpers as rules } from 'playing-rule-services';

import defaultHooks from './user-action.hooks';
import { fulfillActionRequires, fulfillActionRewards } from '../../helpers';

const debug = makeDebug('playing:actions-services:user-actions');

const defaultOptions = {
  name: 'user-actions'
};

export class ActiveActionService {
  constructor (options) {
    options = fp.assignAll(defaultOptions, options);
    this.name = this.options.name;
  }

  setup (app) {
    this.app = app;
    this.hooks(defaultHooks(this.options));
  }

}

export default function init (app, options, hooks) {
  return new ActiveActionService(options);
}

init.Service = ActiveActionService;

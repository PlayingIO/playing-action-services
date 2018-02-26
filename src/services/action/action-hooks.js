import { hooks as auth } from 'feathers-authentication';
import { hooks } from 'mostly-feathers-mongoose';
import ActionEntity from '~/entities/action-entity';

module.exports = function(options = {}) {
  return {
    before: {
      all: [
        auth.authenticate('jwt')
      ],
      get: [],
      find: [],
      create: [],
      update: [],
      patch: [],
      remove: [],
    },
    after: {
      all: [
        hooks.populate('rules.rewards.metric', { service: 'metrics' }),
        hooks.presentEntity(ActionEntity, options),
        hooks.responder()
      ]
    }
  };
};
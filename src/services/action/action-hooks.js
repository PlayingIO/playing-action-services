import { hooks } from 'mostly-feathers-mongoose';
import ActionEntity from '~/entities/action-entity';

module.exports = function(options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options)
      ],
      update: [
        hooks.discardFields('id', 'createdAt', 'updatedAt', 'destroyedAt')
      ],
      patch: [
        hooks.discardFields('id', 'createdAt', 'updatedAt', 'destroyedAt')
      ]
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
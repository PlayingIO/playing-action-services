import { iff, isProvider } from 'feathers-hooks-common';
import { associateCurrentUser, queryWithCurrentUser } from 'feathers-authentication-hooks';
import { hooks } from 'mostly-feathers-mongoose';
import UserActionEntity from '~/entities/action-entity';

module.exports = function(options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options.auth, 'scores,actions'),
        iff(isProvider('external'),
          queryWithCurrentUser({ idField: 'id', as: 'user' }))
      ],
      get: [],
      find: [],
      create: [
        iff(isProvider('external'),
          associateCurrentUser({ idField: 'id', as: 'user' }))
      ],
      update: [
        iff(isProvider('external'),
          associateCurrentUser({ idField: 'id', as: 'user' })),
        hooks.discardFields('id', 'createdAt', 'updatedAt', 'destroyedAt')
      ],
      patch: [
        iff(isProvider('external'),
          associateCurrentUser({ idField: 'id', as: 'user' })),
        hooks.discardFields('id', 'createdAt', 'updatedAt', 'destroyedAt')
      ]
    },
    after: {
      all: [
        hooks.populate('action', { service: 'actions' }),
        hooks.populate('user', { service: 'users' }),
        hooks.presentEntity(UserActionEntity, options),
        hooks.responder()
      ]
    }
  };
};
import { iff, isProvider } from 'feathers-hooks-common';
import { hooks as auth } from 'feathers-authentication';
import { associateCurrentUser, queryWithCurrentUser } from 'feathers-authentication-hooks';
import { hooks } from 'mostly-feathers-mongoose';
import UserActionEntity from '~/entities/action-entity';

module.exports = function(options = {}) {
  return {
    before: {
      all: [
        hooks.addParams({ $auth: { query: { $select: 'scores,*' } } }),
        auth.authenticate('jwt'),
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
          associateCurrentUser({ idField: 'id', as: 'user' }))
      ],
      patch: [
        iff(isProvider('external'),
          associateCurrentUser({ idField: 'id', as: 'user' }))
      ]
    },
    after: {
      all: [
        hooks.presentEntity(UserActionEntity, options),
        hooks.populate('user', { service: 'users' }),
        hooks.responder()
      ]
    }
  };
};
import { iff, isProvider, disallow } from 'feathers-hooks-common';
import { associateCurrentUser, queryWithCurrentUser } from 'feathers-authentication-hooks';
import { hooks } from 'mostly-feathers-mongoose';
import { cache } from 'mostly-feathers-cache';
import { sanitize, validate } from 'mostly-feathers-validate';
import { hooks as feeds } from 'playing-feed-services';

import UserActionEntity from '../../entities/action.entity';
import accepts from './user-action.accepts';
import notifiers from './user-action.notifiers';

export default function (options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options.auth, 'scores,actions'),
        iff(isProvider('external'),
          queryWithCurrentUser({ idField: 'id', as: 'user' })),
        cache(options.cache)
      ],
      create: [
        hooks.discardFields('count', 'limit'),
        sanitize(accepts),
        validate(accepts)
      ],
      update: disallow('external'),
      patch: disallow('external'),
      remove: disallow('external')
    },
    after: {
      all: [
        hooks.populate('action', { service: 'actions' }),
        hooks.populate('user', { service: 'users' }),
        cache(options.cache),
        hooks.presentEntity(UserActionEntity, options.entities),
        hooks.responder()
      ],
      create: [
        feeds.notify('action.play', notifiers),
      ]
    }
  };
}
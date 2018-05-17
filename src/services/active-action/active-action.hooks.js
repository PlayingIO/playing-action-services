import { iff, isProvider } from 'feathers-hooks-common';
import { queryWithCurrentUser } from 'feathers-authentication-hooks';
import { hooks } from 'mostly-feathers-mongoose';
import { cache } from 'mostly-feathers-cache';

import UserActionEntity from '../../entities/action.entity';

export default function (options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options.auth, 'scores,actions'),
        cache(options.cache)
      ],
      find: [
        iff(isProvider('external'),
          queryWithCurrentUser({ idField: 'id', as: 'user' })),
      ]
    },
    after: {
      all: [
        hooks.populate('rules.rewards.metric', { service: 'metrics' }),
        cache(options.cache),
        hooks.presentEntity(UserActionEntity, options.entities),
        hooks.responder()
      ]
    }
  };
}
const { disallow } = require('feathers-hooks-common');
const { queryWithCurrentUser } = require('feathers-authentication-hooks');
const { hooks } = require('mostly-feathers-mongoose');
const { cache } = require('mostly-feathers-cache');
const { sanitize, validate } = require('mostly-feathers-validate');
const feeds = require('playing-feed-common');

const UserActionEntity = require('../../entities/action.entity');
const accepts = require('./user-action.accepts');
const notifiers = require('./user-action.notifiers');

module.exports = function (options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options.auth, 'scores,actions'),
        cache(options.cache)
      ],
      find: [
        queryWithCurrentUser({ idField: 'id', as: 'user' }),
      ],
      get: [
        queryWithCurrentUser({ idField: 'id', as: 'user' }),
      ],
      create: [
        sanitize(accepts),
        validate(accepts),
        hooks.discardFields('count', 'limit'),
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
};
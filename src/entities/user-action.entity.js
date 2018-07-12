const Entity = require('mostly-entity');

const UserActionEntity = new Entity('UserAction');

UserActionEntity.discard('_id');

module.exports = UserActionEntity.freeze();

const Entity = require('mostly-entity');
const { BlobEntity } = require('playing-content-common');

const ActionEntity = new Entity('Action', {
  image: { using: BlobEntity }
});

ActionEntity.discard('_id');

module.exports = ActionEntity.freeze();

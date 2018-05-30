import Entity from 'mostly-entity';
import { BlobEntity } from 'playing-content-common';

const ActionEntity = new Entity('Action', {
  image: { using: BlobEntity }
});

ActionEntity.excepts('updatedAt', 'destroyedAt');

export default ActionEntity.asImmutable();

import Entity from 'mostly-entity';
import { entities as contents } from 'playing-content-services';

const ActionEntity = new Entity('Action', {
  image: { using: contents.BlobEntity }
});

ActionEntity.excepts('updatedAt', 'destroyedAt');

export default ActionEntity.asImmutable();

import Entity from 'mostly-entity';

const UserActionEntity = new Entity('UserAction');

UserActionEntity.excepts('updatedAt', 'destroyedAt');

export default UserActionEntity.asImmutable();

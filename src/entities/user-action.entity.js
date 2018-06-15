import Entity from 'mostly-entity';

const UserActionEntity = new Entity('UserAction');

UserActionEntity.excepts('_id');

export default UserActionEntity.asImmutable();

import Entity from 'mostly-entity';

const UserActionEntity = new Entity('UserAction');

UserActionEntity.discard('_id');

export default UserActionEntity.freeze();

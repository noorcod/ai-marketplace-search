import { Entity, ManyToOne, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { MarketplaceUser } from './marketplace-user.entity';

@Entity()
export class UserSearches {
  [PrimaryKeyProp]: 'id';

  @PrimaryKey({ autoincrement: true, type: 'numeric' })
  id: number;

  @Property({ type: 'text', nullable: false })
  searchText: string;

  @Property({ type: 'boolean', default: false })
  resultFound: boolean;

  @Property({ type: 'string', nullable: false, length: 45 })
  ip: string;

  @ManyToOne({
    entity: () => MarketplaceUser,
    fieldName: 'fk_user_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'fk_user_id',
  })
  user!: MarketplaceUser;

  @Property({ type: 'datetime', onCreate: () => new Date() })
  createdAt: Date;
}

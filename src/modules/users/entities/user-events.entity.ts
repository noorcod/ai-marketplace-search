import { Entity, EntityRepositoryType, ManyToOne, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { MarketplaceUser } from './marketplace-user.entity';
import { Model } from '../../models/entities/Model.entity';
import { UserEventsRepository } from '../repositories/user-events.repository';

@Entity({ repository: () => UserEventsRepository })
export class UserEvents {
  [EntityRepositoryType]?: UserEventsRepository;

  [PrimaryKeyProp]: 'id';

  @PrimaryKey({ type: 'number', unsigned: false })
  id: number;

  @Property({ type: 'string', length: 50, nullable: false })
  eventName: string;

  @Property({ type: 'boolean', nullable: false, default: true })
  isGuest: boolean;

  @Property({ type: 'string', length: 45, nullable: false })
  ip: string;

  @Property({ fieldName: 'shop_id', type: 'string', length: 45, nullable: true })
  // TODO: Add decorators once their entity is created
  shopId?: number;

  @Property({ fieldName: 'listing_id', type: 'string', length: 45, nullable: true })
  // TODO: Add decorators once their entity is created
  listingId?: number;

  @ManyToOne({
    entity: () => Model,
    fieldName: 'model_id',
    nullable: true,
  })
  modelId!: number;

  @ManyToOne({
    entity: () => MarketplaceUser,
    fieldName: 'fk_user_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'fk_user_id',
    nullable: true,
  })
  userId!: MarketplaceUser | string;

  @Property({ type: 'datetime', onCreate: () => new Date() })
  createdAt: Date;
}

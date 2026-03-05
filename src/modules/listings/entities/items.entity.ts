import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  type Opt,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from '@mikro-orm/core';
import { ItemsImages } from './items-images.entity';
import { LegacyOrder } from '@modules/legacy-orders/entities/legacy-order.entity';

@Entity()
export class Items {
  [PrimaryKeyProp]?: 'itemId';

  @PrimaryKey({ unsigned: false })
  itemId!: number;

  @Property({ length: 50 })
  brand!: string;

  @Property()
  title!: string;

  @Property({ length: 18 })
  stockNo!: string;

  @Property({ fieldName: 'category_id', index: 'CategoryIdItem' })
  category!: number;

  @Property({ length: 150 })
  model!: string;

  @Property({ fieldName: 'storage_mobile_id', nullable: true, index: 'storagemobileIdItems' })
  storageMobile?: number;

  @Property({ nullable: true })
  storageSsd?: number;

  @Property({ nullable: true })
  storageHdd?: number;

  @Property({ nullable: true })
  ram?: number;

  @Property({ length: 50, nullable: true })
  color?: string;

  @Property({ fieldName: 'shop_id', index: 'ShopIdItem' })
  shop!: number;

  @Property({ fieldName: 'location_id', index: 'LocationIdItem' })
  location!: number;

  @Property({ length: 50, nullable: true })
  conditionItem?: string;

  @Property({ fieldName: 'condition_id', index: 'conditionIdItems' })
  condition!: number;

  @ManyToOne({
    entity: () => ItemsImages,
    fieldName: 'images',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    nullable: true,
    index: 'imagesItems',
  })
  images?: ItemsImages;

  @Property()
  salePrice!: bigint;

  @Property({ columnType: 'longtext', nullable: true, ignoreSchemaChanges: ['type'] })
  description?: unknown;

  @Property()
  quantity!: bigint;

  @Property({ length: 150, nullable: true })
  processor?: string;

  @Property()
  isOnMarketplace!: boolean;

  @Property({ type: 'tinyint' })
  isArchive: number & Opt = 0;

  @Property()
  isMiscellaneous!: boolean;

  @Property({ type: 'tinyint' })
  isActive: number & Opt = 1;

  @Property({ type: 'tinyint' })
  isDeleted: number & Opt = 0;

  @Property({ columnType: 'timestamp', nullable: true })
  createdAt?: Date;

  @Property({ columnType: 'timestamp', nullable: true })
  updatedAt?: Date;

  @Property({ type: 'string', length: 1, nullable: true })
  itemSource?: string = 'M';

  @Property({ type: 'string', length: 50 })
  accessoryType: string & Opt = 'nil';

  @OneToMany(() => LegacyOrder, order => order.item)
  deliveryForYouOrders? = new Collection<LegacyOrder>(this);
}

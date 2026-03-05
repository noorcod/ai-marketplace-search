import {
  Collection,
  Entity,
  EntityRepositoryType,
  OneToMany,
  OneToOne,
  type Opt,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from '@mikro-orm/core';
import { ShopsRepository } from '../repositories/shops.repository';
import { ShopOption } from './shop-option.entity';
import { Subscriptions } from './subscriptions.entity';
import { Location } from './location.entity';
import { Listing } from '@modules/listings/entities/listing.entity';
import { Tag } from './tag.entity';
import { LegacyOrder } from '@modules/legacy-orders/entities/legacy-order.entity';
import { OrderSource } from '@modules/orders/entities/order-source.entity';
import { ListingReview } from '@modules/listings/entities/listing-review.entity';

@Entity({ repository: () => ShopsRepository })
export class Shop {
  [EntityRepositoryType]?: ShopsRepository;
  [PrimaryKeyProp]?: 'shopId';

  @PrimaryKey({ unsigned: false })
  shopId!: number;

  @Property({ index: 'salesmanId' }) // If there is user entity, we can add reference here
  registeredBy!: number;

  @Property({ index: 'moderatorId' }) // If there is user entity, we can add reference here
  moderator!: number;

  @Property({ fieldName: 'shop_name', length: 150 })
  shopName!: string;

  @Property({ length: 60, nullable: true })
  username?: string;

  @Property({ fieldName: 'shop_owner_name', length: 70 })
  shopOwnerName!: string;

  @Property({ fieldName: 'shop_address', length: 255 })
  shopAddress!: string;

  @Property({ fieldName: 'owner_CNIC', length: 20 })
  ownerCNIC!: string;

  @Property({ fieldName: 'owner_email', length: 100, unique: 'owner_email' })
  ownerEmail!: string;

  @Property({ fieldName: 'owner_whatsapp_number', length: 18 })
  ownerWhatsappNumber!: string;

  @Property({ fieldName: 'owner_backup_phone_number', length: 18 })
  ownerBackupPhoneNumber!: string;

  @Property()
  onTrial!: boolean;

  @Property()
  onPayment!: boolean;

  @Property({ type: 'date', nullable: true })
  trialTillDate?: string;

  @Property({ type: 'string', length: 500 })
  invoiceTerms: string & Opt = 'nil';

  @Property({ length: 500, nullable: true })
  vendorInvoiceTerms?: string;

  @Property({ length: 100, nullable: true })
  logoPath?: string;

  @Property({ type: 'json', nullable: true })
  configuration?: any;

  @Property({ type: 'json', nullable: true })
  finalConfiguration?: any;

  @Property({ length: 450, nullable: true })
  instagram?: string;

  @Property({ length: 450, nullable: true })
  facebook?: string;

  @Property({ length: 450, nullable: true })
  tiktok?: string;

  @Property({ length: 450, nullable: true })
  youtube?: string;

  @Property()
  createdAt!: Date;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ type: 'boolean' })
  isActive: boolean & Opt = false;

  @Property()
  isDeleted!: boolean;

  @OneToOne(() => ShopOption, shopOption => shopOption.shop)
  shopOption: ShopOption;

  @OneToOne(() => Subscriptions, subscription => subscription.shop)
  subscription: Subscriptions;

  @OneToMany(() => Location, s => s.shop)
  locations = new Collection<Location>(this);

  @OneToMany(() => Listing, s => s.shop)
  listings = new Collection<Listing>(this);

  @OneToMany(() => Tag, t => t.shop)
  tags = new Collection<Tag>(this);

  @OneToMany(() => LegacyOrder, order => order.shop)
  deliveryForYouOrders? = new Collection<LegacyOrder>(this);

  @OneToMany(() => OrderSource, orderSource => orderSource.shop)
  orderSources = new Collection<OrderSource>(this);

  @OneToMany(() => ListingReview, listingReview => listingReview.shop)
  reviews = new Collection<ListingReview>(this);
}

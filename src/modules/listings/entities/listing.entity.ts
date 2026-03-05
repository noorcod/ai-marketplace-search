import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  OneToOne,
  Collection,
  Opt,
  EntityRepositoryType,
  PrimaryKeyProp,
} from '@mikro-orm/core';
import { Brand } from '@modules/lookups/entities/brand.entity';
import { Categories } from '@modules/lookups/entities/categories.entity';
import { City } from '@modules/lookups/entities/city.entity';
import { Condition } from '@modules/lookups/entities/condition.entity';
import { Location } from '@modules/stores/entities/location.entity';
import { Shop } from '@modules/stores/entities/shop.entity';
import { Items } from './items.entity';
import { ItemsImages } from './items-images.entity';
import { ListingPrice } from './listing-price.entity';
import { ListingText } from './listing-text.entity';
import { ListingSpecification } from './listing-specification.entity';
import { ListingTag } from './listing-tag.entity';
import { ListingMeta } from './listing-meta.entity';
import { ListingModeration } from './listing-moderation.entity';
import { ListingDevicePort } from '@modules/listings/entities/listing-device-port.entity';
import { ListingReview } from '@modules/listings/entities/listing-review.entity';
import { ListingsRepository } from '../repositories/listings.repository';
import { ListingStatus } from '@common/enums/listing-status.enum';
import { FeaturedListing } from './featured-listing.entity';
import { LegacyOrder } from '@modules/legacy-orders/entities/legacy-order.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';

@Entity({ repository: () => ListingsRepository })
export class Listing {
  [EntityRepositoryType] = ListingsRepository;

  [PrimaryKeyProp]?: 'listingId';

  @PrimaryKey({ unsigned: false })
  listingId!: number;

  @Property({ length: 300 })
  listingTitle!: string;

  @Property()
  listedQty!: number;

  @Property({ type: 'text', length: 65535, nullable: true })
  url?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true, defaultRaw: `0.00` })
  effectivePrice?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true, defaultRaw: `0.00` })
  effectiveDiscount?: string;

  @Property({ type: 'integer' })
  visits: number & Opt = 0;

  @Property({ type: 'decimal', precision: 1, scale: 1, nullable: true })
  rating?: string;

  @ManyToOne({
    entity: () => Items,
    fieldName: 'item_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'item_id',
  })
  item!: Items;

  @ManyToOne({
    entity: () => Shop,
    fieldName: 'shop_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'fk_listing_shop',
  })
  shop!: Shop;

  @ManyToOne({
    entity: () => Location,
    fieldName: 'location_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'fk_listing_location',
  })
  location!: Location;

  @ManyToOne({
    entity: () => City,
    fieldName: 'city_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'fk_city_id',
  })
  city!: City;

  @ManyToOne({
    entity: () => Categories,
    fieldName: 'category_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'fk_category_id',
  })
  category!: Categories;

  @Property({ length: 50 })
  categoryName!: string;

  @ManyToOne({
    entity: () => Condition,
    fieldName: 'condition_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'fk_condition_id',
  })
  condition!: Condition;

  @Property({ length: 50 })
  conditionName!: string;

  @ManyToOne({
    entity: () => Brand,
    fieldName: 'brand_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'fk_brand_id',
    nullable: true,
  })
  brand?: Brand;

  @Property({ length: 100, nullable: true })
  brandName?: string;

  @Property({ type: 'boolean' })
  usedAutofill: boolean & Opt = false;

  @Property({ type: 'text', length: 65535, nullable: true })
  modelTitle?: string;

  @Property()
  primaryImage!: string;

  @Property({ fieldName: 'color_id', nullable: true })
  color?: number;

  @Property({ fieldName: 'color', length: 100, nullable: true })
  colorName?: string;

  @ManyToOne({
    entity: () => ItemsImages,
    fieldName: 'images_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    nullable: true,
    index: 'listing_ibfk_8_idx',
  })
  images?: ItemsImages;

  @Property({ type: 'text', length: 65535, nullable: true })
  videoUrl?: string;

  @Property({ fieldName: 'terms_id', nullable: true, index: 'terms_id' })
  terms?: number;

  @Property({ type: 'tinyint' })
  hasWarranty: number & Opt = -1;

  @Property({ type: 'boolean' })
  hasUndisclosedPrice: boolean & Opt = false;

  @Property({ type: 'boolean' })
  hasUnitPrice: boolean & Opt = true;

  @Property({ type: 'boolean' })
  hasPriceRange: boolean & Opt = false;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minEffectivePrice?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxEffectivePrice?: string;

  @Property({ type: 'boolean' })
  acceptsVouchers: boolean & Opt = false;

  @Property()
  onSale!: boolean;

  @Property({ type: 'boolean' })
  onSpecialSale: boolean & Opt = false;

  @Property({ fieldName: 'special_sale_id', nullable: true, index: 'special_sale_id' })
  specialSaleId?: number;

  @Property({ length: 100, nullable: true })
  specialSaleName?: string;

  @Property({ fieldName: 'currency_id', index: 'currency_id' })
  currency!: number;

  @Property({ length: 3 })
  currencyCode!: string;

  @Property({ type: 'boolean' })
  isDummy: boolean & Opt = false;

  @Property({ type: 'boolean' })
  isAdvertised: boolean & Opt = false;

  @Property({ type: 'boolean' })
  isFeatured: boolean & Opt = false;

  @Property({ type: 'boolean' })
  isHotSelling: boolean & Opt = false;

  @Property({ type: 'boolean' })
  isLimitedEdition: boolean & Opt = false;

  @Property({ type: 'enum', length: 7 })
  listingType: string & Opt = 'Normal';

  @ManyToOne(() => 'GroupedListing', { fieldName: 'grouped_listing_id', nullable: true, index: 'grouped_listing_id' })
  groupedListing?: number;

  @Property({ type: 'enum', length: 27 })
  status: ListingStatus & Opt = ListingStatus.VALIDATION_PENDING_INACTIVE;

  @Property({ type: 'boolean' })
  listedViaSupport: boolean & Opt = false;

  @Property({ type: 'boolean' })
  isModerated: boolean & Opt = false;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  activationDate?: Date;

  @Property({ nullable: true })
  archivedOn?: Date;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ type: 'boolean' })
  isDeleted: boolean & Opt = false;

  @Property({ nullable: true })
  deletedAt?: Date;

  @OneToOne(() => ListingSpecification, listingSpecification => listingSpecification.listing)
  listingSpecification?: ListingSpecification;

  @OneToOne(() => ListingText, listingText => listingText.listing)
  listingText?: ListingText;

  @OneToOne(() => ListingPrice, listingPrice => listingPrice.listing)
  listingPrice?: ListingPrice;

  @OneToMany(() => ListingTag, listingTag => listingTag.listing)
  listingTags = new Collection<ListingTag>(this);

  @OneToOne(() => ListingMeta, listingMeta => listingMeta.listing)
  listingMetadata?: ListingMeta;

  @OneToOne(() => ListingModeration, moderation => moderation.listing)
  moderation?: ListingModeration;

  @OneToMany(() => ListingDevicePort, devicePort => devicePort.listing)
  devicePorts = new Collection<ListingDevicePort>(this);

  @OneToMany(() => ListingReview, review => review.listing)
  reviews = new Collection<ListingReview>(this);

  @OneToOne(() => FeaturedListing, featured => featured.listing)
  featuredListing?: FeaturedListing;

  @OneToMany(() => LegacyOrder, order => order.listing)
  deliveryForYouOrders? = new Collection<LegacyOrder>(this);

  @OneToMany(() => OrderItem, orderItem => orderItem.listing)
  orderItems = new Collection<OrderItem>(this);
}

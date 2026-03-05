import { Entity, ManyToOne, OneToOne, type Opt, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Listing } from './listing.entity';
import { Currency } from '@modules/listings/entities/currency.entity';

@Entity()
export class ListingPrice {
  @PrimaryKey({ unsigned: false })
  id!: number;

  // owning side of the relationship

  @OneToOne(() => Listing, listing => listing.listingPrice, {
    fieldName: 'listing_id',
    owner: true,
  })
  listing!: Ref<Listing>;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  onlinePrice!: string;

  @Property({ type: 'enum', length: 10 })
  discountUnit!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  discountValue!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  inventorySalePrice!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  minCostPrice!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  maxCostPrice!: string;

  @ManyToOne(() => Currency, { fieldName: 'currency_id' })
  currency!: Currency | number;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;
}

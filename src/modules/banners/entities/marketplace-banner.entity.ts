import { Entity, EntityRepositoryType, Enum, PrimaryKey, Property } from '@mikro-orm/core';
import { BannersRepository } from '../banners.repository';

@Entity({ repository: () => BannersRepository })
export class MarketplaceBanner {
  [EntityRepositoryType]?: BannersRepository;
  @PrimaryKey({ unsigned: false })
  id!: number;

  @Enum({ items: () => MarketplaceBannerStyle })
  style!: MarketplaceBannerStyle;

  @Enum({ items: () => MarketplaceBannerPage })
  page!: MarketplaceBannerPage;

  @Property()
  location!: string;

  @Property()
  img!: string;

  @Property({ nullable: true })
  link?: string;

  @Property()
  sequence!: number;

  @Property({ nullable: true, type: 'tinyint' })
  isMobileBanner?: boolean;

  @Property({ type: 'date', nullable: true })
  expiresOn?: string;

  @Property({ index: 'fk_marketplace_banner_uploaded_by' })
  uploadedBy!: number;

  @Property({ columnType: 'timestamp', nullable: true, defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt?: Date;

  @Property({
    columnType: 'timestamp',
    nullable: true,
    defaultRaw: `CURRENT_TIMESTAMP`,
    extra: 'on update CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;

  @Property({ type: 'boolean', nullable: true })
  isDeleted?: boolean = false;
}

export enum MarketplaceBannerStyle {
  CAROUSEL = 'carousel',
  SINGLE = 'single',
}

export enum MarketplaceBannerPage {
  HOME = 'home',
  CATEGORY = 'category',
  PLP = 'plp',
  SHOP = 'shop',
  PDP = 'pdp',
  OTHER = 'other',
}

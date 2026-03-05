import { Collection, Entity, EntityRepositoryType, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { SaleBanner } from '@modules/sale-events/entities/sale-banner.entity';
import { SaleEventsRepository } from '@modules/sale-events/repositories/sale-events.repository';

@Entity({ repository: () => SaleEventsRepository })
export class Sale {
  [EntityRepositoryType]?: SaleEventsRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ nullable: true, defaultRaw: `CURRENT_TIMESTAMP` })
  startDate?: Date;

  @Property({ nullable: true })
  endDate?: Date;

  @Property({ length: 45 })
  name!: string;

  @Property()
  colorScheme!: string;

  @Property({ length: 45, nullable: true })
  discountUpto?: string;

  @Property({ type: 'json' })
  listings!: any;

  @Property({ length: 450, nullable: true })
  metaKeywords?: string;

  @Property({ length: 450, nullable: true })
  metaDescription?: string;

  @Property({ length: 45, nullable: true })
  metaTitle?: string;

  @Property({ nullable: true })
  isActive?: boolean;

  @Property({ type: 'boolean', nullable: true })
  isDeleted?: boolean = false;

  @OneToMany(() => SaleBanner, banner => banner.sale)
  banners = new Collection<SaleBanner>(this);
}

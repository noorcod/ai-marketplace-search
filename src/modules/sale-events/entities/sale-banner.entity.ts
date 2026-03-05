import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Sale } from './sale.entity';

@Entity()
export class SaleBanner {
  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property()
  bannerKey!: string;

  @ManyToOne({
    entity: () => Sale,
    fieldName: 'fk_sale_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'sale_banner_fk_sale_id',
    foreignKeyName: 'fk_sale_id',
  })
  sale!: Sale;

  @Property({ length: 45, nullable: true })
  location?: string;

  @Property({ type: 'boolean', nullable: true })
  isDeleted?: boolean = false;
}

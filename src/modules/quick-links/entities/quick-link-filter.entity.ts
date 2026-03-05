import { Entity, ManyToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { QuickLink } from './quick-link.entity';

@Entity()
export class QuickLinkFilter {
  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne({
    entity: () => QuickLink,
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'quick_link_filter_fk_qk_id_fk',
    fieldName: 'fk_qk_id',
  })
  quickLink!: QuickLink;

  @Property({ length: 100 })
  filterName!: string;

  @Property({ length: 100 })
  filterKey!: string;

  @Property({ length: 500, nullable: true })
  filterValues?: string;

  @Property({ type: 'tinyint' })
  isDeleted: number & Opt = 0;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;
}

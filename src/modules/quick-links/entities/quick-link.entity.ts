import { Collection, Entity, EntityRepositoryType, OneToMany, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { QuickLinkFilter } from '@modules/quick-links/entities/quick-link-filter.entity';
import { QuickLinksRepository } from '@modules/quick-links/repositories/quick-links.repository';

@Entity({ repository: () => QuickLinksRepository })
export class QuickLink {
  [EntityRepositoryType]?: QuickLinksRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ length: 100 })
  slug!: string;

  @Property({ length: 150, nullable: true })
  title?: string;

  @Property({ length: 100, nullable: true })
  linkText?: string;

  @Property({ fieldName: 'category_id', index: 'quick_links_categories_FK' })
  category!: number;

  @Property({ length: 45, nullable: true })
  categoryName?: string;

  @Property({ length: 100 })
  metaTitle!: string;

  @Property({ length: 1000 })
  metaDescription!: string;

  @Property({ length: 100 })
  metaKeyword!: string;

  @Property({ type: 'text', length: 65535 })
  content!: string;

  @Property({ type: 'text', length: 65535, nullable: true })
  faqs?: string;

  @Property({ type: 'tinyint' })
  isActive: number & Opt = 1;

  @Property({ type: 'tinyint' })
  isDeleted: number & Opt = 0;

  @Property({ type: 'tinyint' })
  isCore: number & Opt = 1;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;

  @OneToMany(() => QuickLinkFilter, quickLinkFilter => quickLinkFilter.quickLink)
  filters = new Collection<QuickLinkFilter>(this);
}

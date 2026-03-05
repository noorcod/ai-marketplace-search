import { Entity, OneToOne, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Model } from './Model.entity';

@Entity()
export class ModelMeta {
  [PrimaryKeyProp]?: 'metaId';

  @PrimaryKey({ unsigned: false })
  metaId!: number;

  @Property({ length: 200 })
  metaTitle!: string;

  @Property({ length: 500, nullable: true })
  metaDescription?: string;

  @Property({ length: 2000, nullable: true })
  metaKeywords?: string;

  @OneToOne({ entity: () => Model, index: 'fk_model_id', owner: true, fieldName: 'fk_model_id' })
  model!: Model;
}

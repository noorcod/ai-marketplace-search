import { Entity, ManyToOne, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Model } from './Model.entity';

@Entity()
export class Images {
  [PrimaryKeyProp]?: 'imagesId';

  @PrimaryKey({ unsigned: false })
  imagesId!: number;

  @ManyToOne({
    entity: () => Model,
    fieldName: 'model_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'imagesModelId',
  })
  model!: Model;

  @Property({ fieldName: 'color_id', index: 'imagesColorId' })
  color!: number;

  @Property({ length: 60 })
  colorName!: string;

  @Property({ length: 120 })
  img0!: string;

  @Property({ length: 120 })
  img1!: string;

  @Property({ length: 120 })
  img2!: string;

  @Property({ length: 120 })
  img3!: string;

  @Property({ length: 120 })
  img4!: string;
}

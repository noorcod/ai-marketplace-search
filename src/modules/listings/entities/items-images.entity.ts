import { Entity, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';

@Entity()
export class ItemsImages {
  [PrimaryKeyProp]?: 'imagesId';

  @PrimaryKey({ unsigned: false })
  imagesId!: number;

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

  @Property({ length: 120 })
  img5!: string;

  @Property({ length: 120 })
  img6!: string;

  @Property({ length: 120 })
  img7!: string;

  @Property({ length: 120 })
  img8!: string;

  @Property({ length: 120 })
  img9!: string;

  @Property()
  isImageUploaded!: boolean;
}

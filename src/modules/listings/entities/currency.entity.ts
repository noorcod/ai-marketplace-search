import { Entity, type Opt, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';

@Entity()
export class Currency {
  [PrimaryKeyProp]?: 'currencyId';

  @PrimaryKey({ unsigned: false })
  currencyId!: number;

  @Property({ length: 3 })
  currencyCode!: string;

  @Property({ length: 100 })
  currencyName!: string;

  @Property({ length: 10 })
  symbol!: string;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;
}

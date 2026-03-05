import { Entity, type Opt, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class DeliveryPartner {
  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ length: 100, nullable: true })
  name?: string;

  @Property({ type: 'enum', length: 10 })
  type: string & Opt = 'Techbazaar';

  @Property({ type: 'tinyint' })
  isDeleted: number & Opt = 0;

  @Property({ columnType: 'timestamp', nullable: true, defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt?: Date;

  @Property({
    columnType: 'timestamp',
    nullable: true,
    defaultRaw: `CURRENT_TIMESTAMP`,
    extra: 'on update CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;
}

import { Entity, EntityRepositoryType, PrimaryKey, Property } from '@mikro-orm/core';
import { ConditionsRepository } from '../repositories/conditions.repository';

@Entity({ repository: () => ConditionsRepository })
export class Condition {
  [EntityRepositoryType]?: ConditionsRepository;
  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ length: 250 })
  label!: string;

  @Property()
  createdAt!: Date;

  @Property()
  isDeleted!: boolean;
}

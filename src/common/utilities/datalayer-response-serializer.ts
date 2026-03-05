import { Loaded } from '@mikro-orm/core';

export function transformEntity<T>(entity: Loaded<T>): Partial<T> {
  return entity;
}

export function transformEntities<T>(entities: Loaded<T>[]): Partial<T>[] {
  return entities.map(entity => transformEntity(entity));
}

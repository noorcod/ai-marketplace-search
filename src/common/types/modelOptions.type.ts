import { FilterQuery } from '@mikro-orm/mysql';
import { FindOptions } from '@mikro-orm/core/drivers/IDatabaseDriver';

export type ModelOptions<T> = {
  where: FilterQuery<T>;
  options: FindOptions<T> & {
    [key: string]: any;
  };
  rawWhere?: string;
};

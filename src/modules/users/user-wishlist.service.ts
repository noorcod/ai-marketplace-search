import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { Injectable } from '@nestjs/common';
import { UserWishlistRepository } from './repositories/user-wishlist.repository';
import { CreateUserWishlistDto } from './dtos/create-user-wishlist.dto';
import { dateTime } from 'src/common/utilities/date-time';
import { AppResponse } from 'src/common/responses/app-response';
import { UserWishlist } from './entities/user-wishlist.entity';
import { QueryOptions } from 'src/common/interfaces/repository.interface';
import { COLUMNS_FOR_WISHLIST } from '@common/constants/column-selections.constants';
import { WISHLIST_POPULATE } from '@common/constants/populate-tables.constants';
import { nestedObjectToDotFields } from '@common/utilities/nested-object-to-dot-fields';
import { PaginationOptions } from '@common/utilities/pagination-options';

@Injectable()
export class UserWishlistService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly repo: UserWishlistRepository,
  ) {}
  async addProductToWishlist(userWishlistObj: CreateUserWishlistDto, userId: string) {
    const userWishlist = {
      userId,
      createdAt: dateTime(),
      listing: userWishlistObj.listingId,
    };
    const result = await this.repo.createEntity(userWishlist);
    if (!result.success) {
      return AppResponse.Err(result.message) as AppResponse<Partial<UserWishlist>>;
    }
    return AppResponse.fromDataLayer(result) as AppResponse<Partial<UserWishlist>>;
  }

  async removeProductFromWishlist(listingId: number, userId: string) {
    const whereFilter = {
      listing: listingId,
      deletedAt: null,
      userId: userId,
    };
    const recordIsExist = await this.repo.fetchOne(whereFilter);
    if (!recordIsExist.success) {
      return AppResponse.Err(recordIsExist.message) as AppResponse<Partial<UserWishlist>>;
    } else {
      const result = await this.repo.deleteEntity(whereFilter);
      if (!result.success) {
        return AppResponse.Err(result.message) as AppResponse<Partial<UserWishlist>>;
      }
      return AppResponse.OkWithMessage('Successfully deleted the Product from wishlist!') as AppResponse<
        Partial<UserWishlist>
      >;
    }
  }

  async fetchProductsFromWishlist(userId: string, pagination?: PaginationOptions, returnIds = false) {
    if (returnIds === true) {
      const where = { userId: userId, deletedAt: null };
      const options: QueryOptions<UserWishlist> = {
        fields: ['id'],
        orderBy: { createdAt: 'DESC' },
        distinct: true,
        limit: pagination.limit(),
        offset: pagination.offset(),
      };
      const data = await this.repo.fetch(where, options);
      if (!data.success) {
        return AppResponse.Err(data.message) as AppResponse<Partial<UserWishlist>[]>;
      }
      return AppResponse.fromDataLayer({ ...data, data: data.data.map(item => item.id) }) as AppResponse<
        Partial<UserWishlist>[]
      >;
    } else {
      const wishlistPopulatedTables = nestedObjectToDotFields(WISHLIST_POPULATE);
      const wishlistColumns = nestedObjectToDotFields(COLUMNS_FOR_WISHLIST);
      const where = { userId: userId, deletedAt: null };
      const options: QueryOptions<UserWishlist> = {
        populate: wishlistPopulatedTables,
        fields: wishlistColumns,
        orderBy: { createdAt: 'DESC' },
        distinct: true,
        limit: pagination.limit(),
        offset: pagination.offset(),
      };
      const result = await this.repo.fetch(where, options);
      if (!result.success) {
        return AppResponse.Err(result.message) as AppResponse<Partial<UserWishlist>[]>;
      }
      return AppResponse.fromDataLayer(result) as AppResponse<Partial<UserWishlist>[]>;
    }
  }
}

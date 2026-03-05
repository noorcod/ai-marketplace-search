import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { Injectable } from '@nestjs/common';
import { AppResponse } from 'src/common/responses/app-response';
import { QueryOptions, QueryWhere } from 'src/common/interfaces/repository.interface';
import { UserAddressDto } from './dtos/user-address.dto';
import { UpdateUserAddressDto } from './dtos/update-user-address.dto';
import { UserAddressRepository } from './repositories/user-address.repository';
import { UserAddress } from './entities/user-address.entity';
import { dateTime } from '@common/utilities/date-time';
import { nestedObjectToDotFields } from '@common/utilities/nested-object-to-dot-fields';
import { USER_ADDRESSES_POPULATE } from '@common/constants/populate-tables.constants';
import { USER_ADDRESSES_COLUMNS } from '@common/constants/column-selections.constants';
import { AddressTag } from './entities/address-tag.entity';
import { AddressTagRepository } from './repositories/address-tag.repository';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { MarketplaceUsersRepository } from './repositories/marketplace-users.repository';
import { PaginatedResponse } from '@common/responses/paginated-response';

@Injectable()
export class AddressesService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly repo: UserAddressRepository,
    private readonly addressTagRepo: AddressTagRepository,
    private readonly userRepo: MarketplaceUsersRepository,
  ) {}

  async fetchAddressTags() {
    const where = {
      isDeleted: 0,
    };

    const options: QueryOptions<AddressTag> = {
      orderBy: { createdAt: 'DESC' },
    };
    const data = await this.addressTagRepo.fetch(where, options);
    if (!data.success) {
      return AppResponse.Err(data.message) as AppResponse<Partial<AddressTag>[]>;
    }
    return PaginatedResponse.fromDataLayer(data) as PaginatedResponse<Partial<AddressTag>[]>;
  }

  async updateUserAddress(userId: string, id: string, address: UpdateUserAddressDto) {
    const where: QueryWhere<UserAddress> = { id, user: userId };

    // Extract tagId separately since it needs entity conversion
    const { tagId, ...addressFields } = address;

    // Start with the DTO fields (excluding tagId)
    const updateData: Partial<UserAddress> = { ...addressFields };

    // Handle tag relationship if tagId is provided
    if (tagId !== undefined) {
      const tagResult = await this.addressTagRepo.fetchOne({ id: tagId });
      if (!tagResult.success || !tagResult.data) {
        return AppResponse.Err('Address tag not found') as AppResponse<Partial<UserAddress>[]>;
      }
      const tagEntity = Array.isArray(tagResult.data) ? tagResult.data[0] : tagResult.data;
      updateData.tag = tagEntity;
    }

    const data = await this.repo.updateEntity(updateData, where);
    if (!data.success) {
      return AppResponse.Err(data.message) as AppResponse<Partial<UserAddress>[]>;
    }
    return AppResponse.fromDataLayer(data) as AppResponse<Partial<UserAddress>[]>;
  }

  async addUserAddress(userId: string, address: UserAddressDto) {
    // Fetch the user entity to establish the relationship
    const userResult = await this.userRepo.fetchOne({ id: userId });
    if (!userResult.success) {
      return AppResponse.Err('User not found') as AppResponse<Partial<UserAddress>[]>;
    }

    const userEntity = Array.isArray(userResult.data) ? userResult.data[0] : userResult.data;
    if (!userEntity) {
      return AppResponse.Err('User not found') as AppResponse<Partial<UserAddress>[]>;
    }

    // Fetch the address tag entity
    const tagResult = await this.addressTagRepo.fetchOne({ id: address.tagId });
    if (!tagResult.success) {
      return AppResponse.Err('Address tag not found') as AppResponse<Partial<UserAddress>[]>;
    }

    const tagEntity = Array.isArray(tagResult.data) ? tagResult.data[0] : tagResult.data;
    if (!tagEntity) {
      return AppResponse.Err('Address tag not found') as AppResponse<Partial<UserAddress>[]>;
    }

    address.createdAt = dateTime();
    // Create the address with both user and tag relationships
    const addressData: Partial<UserAddress> = {
      streetAddress: address.streetAddress,
      cityId: Number(address.cityId),
      provinceId: Number(address.provinceId),
      city: address.city,
      province: address.province,
      country: address.country,
      isMain: address.isMain || false,
      nearLandmark: address.nearLandmark,
      zipCode: address.zipCode,
      createdAt: address.createdAt,
      user: userEntity,
      tag: tagEntity,
    };
    const data = await this.repo.createEntity(addressData);
    if (!data.success) {
      return AppResponse.Err(data.message) as AppResponse<Partial<UserAddress>[]>;
    }
    return AppResponse.fromDataLayer(data) as AppResponse<Partial<UserAddress>[]>;
  }

  async fetchUserAddresses(userId: string, pagination: PaginationOptions) {
    const where: QueryWhere<UserAddress> = { user: userId };
    const userAddressColumns = nestedObjectToDotFields(USER_ADDRESSES_COLUMNS);
    const addressPopulatedTables = nestedObjectToDotFields(USER_ADDRESSES_POPULATE);
    const options: QueryOptions<UserAddress> = {
      populate: addressPopulatedTables,
      fields: userAddressColumns,
      orderBy: { createdAt: 'DESC' },
      limit: pagination.limit(),
      offset: pagination.offset(),
    };

    const data = await this.repo.fetch(where, options);
    if (!data.success) {
      return AppResponse.Err(data.message) as AppResponse<Partial<UserAddress>[]>;
    }
    return AppResponse.fromDataLayer(data) as AppResponse<Partial<UserAddress>[]>;
  }

  async fetchUserMainAddress(userId: string) {
    const where: QueryWhere<UserAddress> = { user: userId, isMain: true };
    const userAddressColumns = nestedObjectToDotFields(USER_ADDRESSES_COLUMNS);
    const addressPopulatedTables = nestedObjectToDotFields(USER_ADDRESSES_POPULATE);
    const options: QueryOptions<UserAddress> = {
      populate: addressPopulatedTables,
      fields: userAddressColumns,
    };

    const data = await this.repo.fetch(where, options);
    if (!data.success) {
      return AppResponse.Err(data.message) as AppResponse<Partial<UserAddress>[]>;
    }
    return AppResponse.fromDataLayer(data) as AppResponse<Partial<UserAddress>[]>;
  }
}

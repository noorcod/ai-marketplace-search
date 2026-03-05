import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { Injectable } from '@nestjs/common';
import { MarketplaceUsersRepository } from './repositories/marketplace-users.repository';
import { AppResponse } from 'src/common/responses/app-response';
import { MarketplaceUser } from './entities/marketplace-user.entity';
import { QueryWhere } from 'src/common/interfaces/repository.interface';
import { CreateUserDto } from './dtos/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly repo: MarketplaceUsersRepository,
  ) {}

  async createUser(user: CreateUserDto): Promise<AppResponse<Partial<MarketplaceUser>>> {
    const createdUser = await this.repo.createEntity(user);
    if (!createdUser.success) {
      return AppResponse.Err(createdUser.message) as AppResponse<Partial<MarketplaceUser>>;
    }
    return AppResponse.fromDataLayer(createdUser) as AppResponse<Partial<MarketplaceUser>>;
  }

  async fetchUser(data: {
    email?: string;
    authType?: string;
    id?: string;
    phoneNumber?: string;
  }): Promise<AppResponse<Partial<MarketplaceUser>>> {
    let where: QueryWhere<MarketplaceUser>;
    if (data.hasOwnProperty('email')) {
      where = { email: data['email'], authType: data['authType'], deletedAt: null };
    } else if (data.hasOwnProperty('phoneNumber')) {
      where = { phoneNumber: data['phoneNumber'], deletedAt: null };
    } else {
      where = { id: data['id'], deletedAt: null };
    }
    const user = await this.repo.fetchOne(where);
    if (!user.success) {
      return AppResponse.Err(user.message) as AppResponse<Partial<MarketplaceUser>>;
    }
    return AppResponse.fromDataLayer(user) as AppResponse<Partial<MarketplaceUser>>;
  }

  async updateUser(where: QueryWhere<MarketplaceUser>, updateData: Partial<MarketplaceUser>) {
    return this.repo.updateEntity(where, updateData);
  }
}

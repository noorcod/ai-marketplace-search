import { Injectable, Logger } from '@nestjs/common';
import { AppResponse } from '../../common/responses/app-response';
import { RedisService } from '@liaoliaots/nestjs-redis';

@Injectable()
export class MainService {
  private readonly logger = new Logger(MainService.name);

  constructor(private readonly redisService: RedisService) {}

  async getHello(): Promise<AppResponse<any>> {
    return AppResponse.Ok({ message: 'Hello World!' });
  }
}

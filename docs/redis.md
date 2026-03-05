# Redis Usage

In the project we can use redis by importing the redis service.

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class AppService {
  private readonly redis: Redis | null;
  // In case we want to use both pubsub and normal redis, we can have multiple redis instances.
  private readonly pubsubClient: Redis | null;
  
  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getOrNil();
    // If you want to use a different instance for pubsub, you can do so like this:
    this.pubsubClient = this.redisService.getOrNil();
  }

  async somefunction() {
    return await this.redis.set('key', 'value', 'EX', 10);
  }
}
```
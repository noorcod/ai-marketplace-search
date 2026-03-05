import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AiSearchController } from './ai-search.controller';
import { AiSearchService } from './ai-search.service';
import { Listing } from '@modules/listings/entities/listing.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Listing])],
  controllers: [AiSearchController],
  providers: [AiSearchService],
  exports: [AiSearchService],
})
export class AiSearchModule {}

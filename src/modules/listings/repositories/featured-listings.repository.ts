import { BaseRepository } from '@common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { FeaturedListing } from '../entities/featured-listing.entity';

@Injectable()
export class FeaturedListingsRepository extends BaseRepository<FeaturedListing> {}

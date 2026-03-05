import { Module } from '@nestjs/common';
import { QuickLinksController } from './quick-links.controller';
import { QuickLinksService } from './quick-links.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { QuickLink } from '@modules/quick-links/entities/quick-link.entity';
import { QuickLinkFilter } from '@modules/quick-links/entities/quick-link-filter.entity';

@Module({
  imports: [MikroOrmModule.forFeature([QuickLink, QuickLinkFilter])],
  controllers: [QuickLinksController],
  providers: [QuickLinksService],
})
export class QuickLinksModule {}

import { Module } from '@nestjs/common';
import { MainController } from './main.controller';
import { MainService } from './main.service';

@Module({
  imports: [],
  providers: [MainService],
  controllers: [MainController],
  exports: [],
})
export class MainModule {}

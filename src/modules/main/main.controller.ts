import { Controller, Get } from '@nestjs/common';
import { MainService } from './main.service';
import { AppResponse } from '../../common/responses/app-response';

@Controller()
export class MainController {
  constructor(private readonly appService: MainService) {}

  @Get()
  async getHello(): Promise<AppResponse<any>> {
    return await this.appService.getHello();
  }
}

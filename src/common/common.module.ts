import { Module } from '@nestjs/common';
import { GlobalExceptionsFilter } from './filters/global-exceptions/global-exceptions.filter';
import { AppResponseInterceptor } from './interceptors/app-response/app-response.interceptor';
import { SMSService } from './services/sms/sms.service';
import { OptionalJwtAuthGuard } from './guards/optional-auth.guard';

@Module({
  imports: [],
  providers: [GlobalExceptionsFilter, AppResponseInterceptor, SMSService, OptionalJwtAuthGuard],
  exports: [GlobalExceptionsFilter, AppResponseInterceptor, SMSService, OptionalJwtAuthGuard],
})
export class CommonModule {}

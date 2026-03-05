import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SMSService } from 'src/common/services/sms/sms.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PassportModule, UsersModule],
  providers: [AuthService, GoogleStrategy, JwtStrategy, SMSService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

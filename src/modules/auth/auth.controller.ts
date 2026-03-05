import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { EnvService } from 'src/global-modules/env/env.service';
import { User } from 'src/common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly envService: EnvService,
  ) {}
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuthenticate() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res) {
    const result = await this.authService.validateOrCreateUser(req.user);
    const data = result.data as { access_token: string };
    if (result.success) {
      // Redirect to frontend with token
      const frontendUrl = `${this.envService.frontendUrl}/auth/callback?token=${data.access_token}`;
      return res.redirect(frontendUrl);
    } else {
      // Redirect to frontend with error
      const frontendUrl = `${this.envService.frontendUrl}/auth/error?message=${result.message}`;
      return res.redirect(frontendUrl);
    }
  }

  @Post('send-otp')
  async sendOtp(@Body() body: SendOtpDto) {
    return this.authService.sendOtp(body.phoneNumber);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body);
  }

  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUser(@User('userId') userId: string) {
    return this.authService.getCurrentUser(userId);
  }
}

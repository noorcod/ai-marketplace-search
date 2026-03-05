import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { EnvService } from 'src/global-modules/env/env.service';
import { GOOGLE_AUTH_TYPE } from 'src/common/constants/auth.constants';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly envService: EnvService) {
    super({
      clientID: envService.getGoogleClientId,
      clientSecret: envService.getGoogleClientSecret,
      callbackURL: envService.getGoogleCallbackUrl,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const { name, emails } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      authType: GOOGLE_AUTH_TYPE,
      phoneNumber: null,
      isEmailVerified: emails[0].verified ? true : false,
      isPhoneNumberVerified: false,
    };
    done(null, user);
  }
}

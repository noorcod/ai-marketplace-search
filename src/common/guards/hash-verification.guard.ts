import { verifyPayload } from '@common/utilities/verification.utils';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EnvService } from 'src/global-modules/env/env.service';

@Injectable()
export class HashVerificationGuard implements CanActivate {
  constructor(private readonly envService: EnvService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // get the hash from the request header
    const hmac = request.headers['x-signature'];

    // get the payload from the request body
    const payloadString = JSON.stringify(request.body);

    const isVerified = verifyPayload(hmac, payloadString, this.envService.HMACSecret);
    if (!isVerified) {
      response.status(401).json({
        status: 401,
        error: 'Unauthorized',
        message: 'Payload has been tempered with',
      });
      return false;
    }
    return true;
  }
}

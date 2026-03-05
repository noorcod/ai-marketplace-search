import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { EnvService } from 'src/global-modules/env/env.service';

@Injectable()
export class ReCaptchaGuard implements CanActivate {
  private _baseUrl: string = 'https://www.google.com/recaptcha/api/siteverify?';

  constructor(
    private readonly httpService: HttpService,
    private readonly envService: EnvService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { body } = context.switchToHttp().getRequest();

    const { data } = await firstValueFrom(
      this.httpService
        .post(`${this._baseUrl}response=${body?.['token']}&secret=${this.envService.recaptchaSecretKey}`)
        .pipe(
          catchError(err => {
            Logger.error(err);
            throw new ForbiddenException(err.message);
          }),
        ),
    );
    // Default score is 0.5 but we have increased it to 0.61
    if (!data.success || data.score < 0.61) {
      throw new ForbiddenException();
    }

    return true;
  }
}

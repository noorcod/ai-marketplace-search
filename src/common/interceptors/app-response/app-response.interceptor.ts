import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response } from 'express';
import { AppResponse } from '../../responses/app-response';
import { PaginatedResponse } from '../../responses/paginated-response';
import { DataLayerResponse } from '../../responses/data-layer-response';

@Injectable()
export class AppResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<AppResponse<any>> {
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map(response => {
        let appRes: AppResponse<any>;

        // 1️⃣ If it’s a data‑layer reply, lift it into AppResponse
        if (response instanceof DataLayerResponse) {
          appRes = AppResponse.fromDataLayer(response);
        } // 3️⃣ Already an AppResponse? or PaginatedResponse? just forward
        else if (response instanceof AppResponse || response instanceof PaginatedResponse) {
          appRes = response;

          // 4️⃣ Empty array → 404 “No data found”
        } else if (Array.isArray(response) && response.length === 0) {
          const empty = DataLayerResponse.NotFound();
          appRes = AppResponse.fromDataLayer(empty);

          // 5️⃣ Null or undefined → explicit error
        } else if (response == null) {
          appRes = AppResponse.Err('No data found', 404);

          // 6️⃣ Anything else → standard OK envelope
        } else {
          appRes = AppResponse.Ok({ data: response });
        }

        // apply the HTTP status, then return the envelope
        res.status(appRes.status);
        return appRes;
      }),
    );
  }
}

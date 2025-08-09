import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('[HTTP ERROR]', err);
        
        // Interview endpoint'leri için pop-up gösterme
        if (req.url.includes('/interviews') || req.url.includes('/candidates')) {
          console.warn('Interview loading failed, but continuing...', err.error?.message);
          return throwError(() => err);
        }
        
        // Diğer critical hatalar için pop-up göster
        if (err.status >= 500) {
          alert('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.');
        } else if (err.status === 404) {
          console.warn('Resource not found:', err.url);
        } else if (err.status === 401) {
          alert('Oturum süreniz dolmuş. Lütfen yeniden giriş yapın.');
        } else {
          console.error('Beklenmeyen hata:', err.error?.message);
        }
        
        return throwError(() => err);
      })
    );
  }
}
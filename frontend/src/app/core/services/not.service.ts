// src/app/core/services/not.service.ts
// Fetches notes for all interviews. We'll filter on the UI by mulakat_id.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Not } from '../../shared/models/mulakat.model';

@Injectable({ providedIn: 'root' })
export class NotService {
  private base = `${environment.apiBaseUrl}/notlar`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Not[]> {
    return this.http.get<Not[]>(this.base);
  }
}

// src/app/core/services/katilimci.service.ts
// Fetches interview participants. We'll call getAll() once and filter by mulakat_id in the UI.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Katilimci } from '../../shared/models/katilimci.model';

@Injectable({ providedIn: 'root' })
export class KatilimciService {
  private base = `${environment.apiBaseUrl}/katilimcilar`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Katilimci[]> {
    return this.http.get<Katilimci[]>(this.base);
  }

  create(p: Partial<Katilimci>): Observable<Katilimci> {
    return this.http.post<Katilimci>(this.base, p);
  }
}

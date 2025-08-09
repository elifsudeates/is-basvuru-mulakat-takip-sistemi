// src/app/core/services/degerlendirme.service.ts
// Fetches all evaluations and filters on the UI by mulakat_id.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Degerlendirme } from '../../shared/models/mulakat.model';

@Injectable({ providedIn: 'root' })
export class DegerlendirmeService {
  private base = `${environment.apiBaseUrl}/degerlendirme`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Degerlendirme[]> {
    return this.http.get<Degerlendirme[]>(this.base);
  }
}

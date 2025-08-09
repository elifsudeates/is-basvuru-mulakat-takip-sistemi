// src/app/core/services/mulakat.service.ts - Güncellenmiş ve genişletilmiş
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

/** ---- Response shapes (UI-friendly) ---- */
export interface Katilimci {
  id: number;
  katilimci_adi: string;
  sicil: string;
}

export interface Not {
  id: number;
  mulakat_id: number;
  sicil: string;
  not_metni?: string | null;
  is_deleted?: boolean | null;
  is_active?: boolean | null;
  created_date?: string | null;
}

export interface Degerlendirme {
  id: number;
  mulakat_id: number;
  degerlendirme_turu?: string | null;
  sicil: string;
  puani?: number | string | null;
  created_date?: string | null;
}

/**
 * Canonical shape used by the UI (a.k.a. "full" interview).
 */
export interface MulakatFull {
  id: number;
  aday_id: number;
  mulakat_tarihi?: string | null | undefined;
  planlanan_toplanti_tarihi?: string | null | undefined;
  mulakat_tipi?: string | null;
  created_date?: string | null | undefined;
  
  katilimcilar: Katilimci[];
  notlar: Not[];
  degerlendirmeler: Degerlendirme[];
}

/**
 * Basit mülakat listesi için interface
 */
export interface MulakatBasic {
  mulakat_id: number;
  aday_id: number;
  mulakat_tarihi?: string | null;
  planlanan_toplanti_tarihi?: string | null;
  mulakat_tipi?: string | null;
  created_date?: string | null;
  aday_adi?: string; // YENİ: Aday adı
}

/**
 * YENİ: Mülakat oluşturma/güncelleme için payload
 */
export interface MulakatPayload {
  aday_id?: number;
  mulakat_tarihi?: string | null;
  planlanan_toplanti_tarihi?: string | null;
  mulakat_tipi?: string | null;
  katilimcilar?: number[];
  notlar?: Array<{
    sicil: string;
    not_metni: string;
  }>;
  degerlendirmeler?: Array<{
    sicil: string;
    degerlendirme_turu: string;
    puani: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class MulakatService {
  private base = environment.apiBaseUrl;
  private fullCache = new Map<number, MulakatFull[]>();

  constructor(private http: HttpClient) {}

  /**
   * Tüm mülakatları getir (basit liste)
   */
  getAll(): Observable<MulakatBasic[]> {
    return this.http.get<MulakatBasic[]>(`${this.base}/mulakatlar`).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('getAll error:', err);
        return of<MulakatBasic[]>([]);
      })
    );
  }

  /**
   * YENİ: ID'ye göre tek mülakat getir
   */
  getById(id: number): Observable<MulakatFull | null> {
    return this.http.get<MulakatFull>(`${this.base}/mulakatlar/${id}`).pipe(
      map(result => this.normalizeSingle(result)),
      catchError((err: HttpErrorResponse) => {
        console.error('getById error:', err);
        return of<MulakatFull | null>(null);
      })
    );
  }

  /**
   * Aday için "full" mülakatları getir (katılımcı, not, değerlendirme dahil)
   */
  getFullByCandidate(candidateId: number, forceRefresh = false): Observable<MulakatFull[]> {
    if (!forceRefresh && this.fullCache.has(candidateId)) {
      return of(this.fullCache.get(candidateId)!);
    }

    // Primary endpoint
    const primary$ = this.http
      .get<MulakatFull[]>(`${this.base}/candidates/${candidateId}/interviews/full`)
      .pipe(
        map(rows => this.normalizeList(rows)),
        tap(list => this.fullCache.set(candidateId, list))
      );

    // Fallback to /mulakatlar/aday/:id
    return primary$.pipe(
      catchError((err: HttpErrorResponse) => {
        if (err?.status === 404 || err?.status === 500) {
          const fallback$ = this.http
            .get<any[]>(`${this.base}/mulakatlar/aday/${candidateId}`)
            .pipe(
              map(rows => this.normalizeFromFallback(rows)),
              tap(list => this.fullCache.set(candidateId, list)),
              catchError(() => of<MulakatFull[]>([]))
            );
          return fallback$;
        }
        return of<MulakatFull[]>([]);
      })
    );
  }

  /**
   * YENİ: Mülakat oluştur
   */
  create(payload: MulakatPayload): Observable<any> {
    return this.http.post<any>(`${this.base}/mulakatlar`, payload).pipe(
      tap(() => {
        // Cache'i temizle
        if (payload.aday_id) {
          this.invalidateFullCache(payload.aday_id);
        }
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('create error:', err);
        throw err;
      })
    );
  }

  /**
   * YENİ: Mülakat güncelle
   */
  update(id: number, payload: MulakatPayload): Observable<any> {
    return this.http.put<any>(`${this.base}/mulakatlar/${id}`, payload).pipe(
      tap(() => {
        // Cache'i temizle
        this.fullCache.clear();
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('update error:', err);
        throw err;
      })
    );
  }

  /**
   * YENİ: Mülakat sil
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/mulakatlar/${id}`).pipe(
      tap(() => {
        // Cache'i temizle
        this.fullCache.clear();
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('delete error:', err);
        throw err;
      })
    );
  }

  /** Cache temizleme */
  invalidateFullCache(candidateId?: number): void {
    if (typeof candidateId === 'number') {
      this.fullCache.delete(candidateId);
    } else {
      this.fullCache.clear();
    }
  }

  // ---------------------------
  // Normalization helpers
  // ---------------------------

  private normalizeSingle(row: any): MulakatFull {
    return {
      id: row?.id ?? row?.mulakat_id,
      aday_id: row?.aday_id,
      mulakat_tarihi: (row?.mulakat_tarihi ?? null) ?? undefined,
      planlanan_toplanti_tarihi: (row?.planlanan_toplanti_tarihi ?? null) ?? undefined,
      mulakat_tipi: row?.mulakat_tipi ?? null,
      created_date: (row?.created_date ?? null) ?? undefined,
      katilimcilar: Array.isArray(row?.katilimcilar) ? row.katilimcilar : [],
      notlar: Array.isArray(row?.notlar) ? row.notlar : 
              (Array.isArray(row?.notlar_listesi) ? row.notlar_listesi : []),
      degerlendirmeler: Array.isArray(row?.degerlendirmeler) ? row.degerlendirmeler : [],
    };
  }

  private normalizeList(rows: MulakatFull[] | null | undefined): MulakatFull[] {
    return (rows || []).map(r => ({
      ...r,
      mulakat_tarihi: r?.mulakat_tarihi ?? undefined,
      planlanan_toplanti_tarihi: r?.planlanan_toplanti_tarihi ?? undefined,
      created_date: r?.created_date ?? undefined,
      katilimcilar: Array.isArray(r?.katilimcilar) ? r.katilimcilar : [],
      notlar: Array.isArray(r?.notlar) ? r.notlar : [],
      degerlendirmeler: Array.isArray(r?.degerlendirmeler) ? r.degerlendirmeler : [],
    }));
  }

  private normalizeFromFallback(rows: any[] | null | undefined): MulakatFull[] {
    return (rows || []).map((r: any) => {
      const katilimcilar = Array.isArray(r?.katilimcilar) ? r.katilimcilar : [];
      const notlar = Array.isArray(r?.notlar_listesi) ? r.notlar_listesi : 
                    (Array.isArray(r?.notlar) ? r.notlar : []);
      const degerlendirmeler = Array.isArray(r?.degerlendirmeler) ? r.degerlendirmeler : [];

      return {
        id: r?.id ?? r?.mulakat_id,
        aday_id: r?.aday_id,
        mulakat_tarihi: (r?.mulakat_tarihi ?? null) ?? undefined,
        planlanan_toplanti_tarihi: (r?.planlanan_toplanti_tarihi ?? null) ?? undefined,
        mulakat_tipi: r?.mulakat_tipi ?? null,
        created_date: (r?.created_date ?? null) ?? undefined,
        katilimcilar,
        notlar,
        degerlendirmeler,
      } as MulakatFull;
    });
  }
}
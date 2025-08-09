import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Kisi } from '../../shared/models/kisi.model';

@Injectable({ providedIn: 'root' })
export class KisiService {
  private base = `${environment.apiBaseUrl}/kisiler`;

  constructor(private http: HttpClient) {}

getAll(param:any){
  
   return this.http.post(this.base+'/getAllUser', 
        param
    );} 
    
     getById(id: number): Observable<Kisi>    { 
    return this.http.get<Kisi>(`${this.base}/${id}`); }
  create(payload: Partial<Kisi>): Observable<Kisi> { 
    
    return this.http.post<Kisi>(this.base+'/postUser', payload); 
  }
  update(id: number, payload: Partial<Kisi>): Observable<Kisi> { return this.http.put<Kisi>(`${this.base}/${id}`, payload); }
  delete(id: number): Observable<void>     { return this.http.delete<void>(`${this.base}/${id}`); }
}

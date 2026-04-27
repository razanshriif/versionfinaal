import { Client } from '../models/client.model';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({ providedIn: 'root' })
export class ClientService {

  private api = `${environment.apiUrl}/v1/clients`;

  constructor(private http: HttpClient) { }

  private authHeaders() {
    return {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    };
  }

  getAll(): Observable<any> {
    return this.http.get<any>(this.api, this.authHeaders());
  }

  getById(id: number) {
    return this.http.get<Client>(`${this.api}/${id}`, this.authHeaders());
  }

  getByCode(code: string) {
    return this.http.get<Client>(`${this.api}/code/${code}`, this.authHeaders());
  }

  create(client: Client) {
    return this.http.post<Client>(this.api, client, this.authHeaders());
  }

  update(id: number, client: Client) {
    return this.http.put<Client>(`${this.api}/${id}`, client, this.authHeaders());
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`, this.authHeaders());
  }

  count() {
    return this.http.get<number>(`${this.api}/count`, this.authHeaders());
  }
}


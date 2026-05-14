import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientServiceService {

  private apiUrl = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) { }
  getClients(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  addClient(client: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, client);
  }

  deleteClient(code: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${code}`);
  }

}




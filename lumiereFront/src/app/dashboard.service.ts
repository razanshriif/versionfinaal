import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http: HttpClient) { }

  private baseUrl = environment.baseUrl;
  countArticles(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/articles/count`, { headers: this.getAuthHeaders() });
  }

  countClients(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/clients/count`, { headers: this.getAuthHeaders() });
  }

  countOrders(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/ordres/count`, { headers: this.getAuthHeaders() });
  }
  countNonPlanifieOrders(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/ordres/countNonPlanifie`, { headers: this.getAuthHeaders() });
  }

  countPlanifieOrders(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/ordres/countPlanifie`, { headers: this.getAuthHeaders() });
  }
  countEnCoursDeChargementOrders(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/ordres/count/en-cours-de-chargement`, { headers: this.getAuthHeaders() });
  }

  countChargeOrders(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/ordres/count/charge`, { headers: this.getAuthHeaders() });
  }

  countEnCoursDeLivraisonOrders(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/ordres/count/en-cours-de-livraison`, { headers: this.getAuthHeaders() });
  }

  countLivreOrders(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/ordres/count/livre`, { headers: this.getAuthHeaders() });
  }

  countPendingUsers(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/api/v1/admin/users/count/pending`, { headers: this.getAuthHeaders() });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders(token ? { 'Authorization': `Bearer ${token}` } : {});
  }
}




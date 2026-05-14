import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Article } from '../models/article.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  private apiUrl = `${environment.apiUrl}/articles`;
  private baseUrl = `${environment.apiUrl}/articles`;

  constructor(private http: HttpClient) { }

  // Create
  createArticle(article: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, article, { headers: this.getAuthHeaders() });
  }

  // Read
  getArticle(id: number): Observable<Article> {
    return this.http.get<any>(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  searchByCodeArticle(codeArticle: string): Observable<any> {
    const url = `${this.baseUrl}/search`;
    const headers = this.getAuthHeaders();
    return this.http.get<Article>(url, {
      headers,
      params: { codeArticle },
    });
  }
  getArticles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}`, { headers: this.getAuthHeaders() });
  }

  // Update
  updateArticle(id: number, article: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, article, { headers: this.getAuthHeaders() });
  }

  // Delete
  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() });
  }



  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders(token ? { 'Authorization': `Bearer ${token}` } : {});
  }

}






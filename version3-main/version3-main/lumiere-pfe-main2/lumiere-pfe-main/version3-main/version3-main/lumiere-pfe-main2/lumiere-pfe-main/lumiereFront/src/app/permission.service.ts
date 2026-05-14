import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    private apiUrl = `${environment.baseUrl}/api/v1/permissions`;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    getAllPermissions(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
    }

    getPermissionsByRole(role: string): Observable<{ [key: string]: boolean }> {
        return this.http.get<{ [key: string]: boolean }>(`${this.apiUrl}/${role}`, { headers: this.getHeaders() });
    }

    updatePermissions(permissions: any[]): Observable<void> {
        return this.http.post<void>(this.apiUrl, permissions, { headers: this.getHeaders() });
    }

    getPermissionsByUser(userId: number): Observable<{ [key: string]: boolean }> {
        return this.http.get<{ [key: string]: boolean }>(`${this.apiUrl}/user/${userId}`, { headers: this.getHeaders() });
    }

    updateUserPermissions(userId: number, permissions: any[]): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/user/${userId}`, permissions, { headers: this.getHeaders() });
    }
}




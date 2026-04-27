import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private http: HttpClient) { }

  // ── Legacy compatibility (used by article, client components) ──
  notification: any = {
    type: '',
    message: '',
    isRead: false
  };

  ajouternotification(notification: any): void {
    this.ajouter(notification).subscribe({
      next: () => {},
      error: (err) => console.error('Erreur notification:', err)
    });
  }
  // ────────────────────────────────────────────────────────────────

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders(token ? { 'Authorization': `Bearer ${token}` } : {});
  }

  /** Decode the JWT to get userId and role */
  getCurrentUserInfo(): { userId: number | null; role: string | null } {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          userId: payload.id || payload.userId || null,
          role: payload.role || payload.authorities?.[0]?.replace('ROLE_', '') || null
        };
      }
    } catch (e) {}
    return { userId: null, role: null };
  }

  /** Fetch notifications targeted at this user */
  afficher(): Observable<any[]> {
    const { userId, role } = this.getCurrentUserInfo();
    let params = '';
    if (userId && role) {
      params = `?userId=${userId}&role=${role}`;
    }
    return this.http.get<any[]>(`${environment.v1ApiUrl}/notifications${params}`, { headers: this.getAuthHeaders() });
  }

  /** Fetch unread count targeted at this user */
  getUnreadCount(): Observable<number> {
    const { userId, role } = this.getCurrentUserInfo();
    let params = '';
    if (userId && role) {
      params = `?userId=${userId}&role=${role}`;
    }
    return this.http.get<number>(`${environment.v1ApiUrl}/notifications/unread/count${params}`, { headers: this.getAuthHeaders() });
  }

  ajouter(notification: any): Observable<any> {
    return this.http.post<any>(`${environment.v1ApiUrl}/notifications`, notification, { headers: this.getAuthHeaders() });
  }

  markAsRead(id: number): Observable<any> {
    return this.http.put(`${environment.v1ApiUrl}/notifications/${id}/read`, {}, { headers: this.getAuthHeaders() });
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${environment.v1ApiUrl}/notifications/read-all`, {}, { headers: this.getAuthHeaders() });
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${environment.v1ApiUrl}/notifications/${id}`, { headers: this.getAuthHeaders() });
  }
}




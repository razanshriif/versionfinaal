// src/app/services/notification.service.ts
// Adapté pour fonctionner avec le backend Otflow réel

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Notification, NotificationSettings } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_URL = `${environment.apiUrl}/v1/notifications`;

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    // ✅ Ne pas charger au démarrage pour éviter un 401 si non connecté
    // Appeler loadUnreadCount() manuellement après connexion
  }

  private authHeaders() {
    return {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    };
  }

  /**
   * Initialiser après connexion (appeler depuis la page home ou après login)
   */
  initAfterLogin() {
    this.loadUnreadCount();
  }

  /**
   * Obtenir toutes les notifications
   */
  getNotifications(page: number = 0, size: number = 20): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.API_URL, this.authHeaders());
  }

  /**
   * Obtenir les notifications non lues
   */
  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.API_URL}/unread`, this.authHeaders());
  }

  /**
   * Marquer une notification comme lue
   */
  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/read`, {}, this.authHeaders())
      .pipe(tap(() => this.updateUnreadCount()));
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/read-all`, {}, this.authHeaders())
      .pipe(tap(() => this.unreadCountSubject.next(0)));
  }

  /**
   * Supprimer une notification
   */
  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, this.authHeaders())
      .pipe(tap(() => this.updateUnreadCount()));
  }

  /**
   * Supprimer toutes les notifications lues
   */
  deleteAllRead(): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/read`, this.authHeaders());
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/unread/count`, this.authHeaders());
  }

  /**
   * Charger le nombre de notifications non lues
   */
  loadUnreadCount() {
    this.getUnreadCount().subscribe({
      next: count => this.unreadCountSubject.next(count),
      error: err => console.error('Error loading unread count:', err)
    });
  }

  /**
   * Mettre à jour le compteur de notifications non lues
   */
  private updateUnreadCount() {
    this.loadUnreadCount();
  }

  /**
   * Obtenir les paramètres de notification
   */
  getSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${this.API_URL}/settings`, this.authHeaders());
  }

  /**
   * Mettre à jour les paramètres de notification
   */
  updateSettings(settings: Partial<NotificationSettings>): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>(`${this.API_URL}/settings`, settings, this.authHeaders());
  }

  /**
   * Tester l'envoi d'une notification
   */
  testNotification(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/test`, {}, this.authHeaders());
  }
}


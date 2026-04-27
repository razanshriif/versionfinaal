import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonHeader, IonSpinner } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, warningOutline, alertCircleOutline, informationOutline,
  chatbubbleEllipsesOutline, closeOutline, arrowBackOutline, refreshOutline,
  informationCircleOutline, notificationsOffOutline, logOutOutline, notificationsOutline,
  timeOutline, sparklesOutline, checkmarkDoneOutline
} from 'ionicons/icons';

import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/notification.model';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonHeader, IonSpinner]
})
export class NotificationsPage implements OnInit {

  allNotifications: Notification[] = [];
  notifications: Notification[] = [];
  isLoading = false;
  activeFilter: 'all' | 'rappel' | 'unread' = 'all';

  filters: { key: 'all' | 'rappel' | 'unread'; label: string }[] = [
    { key: 'all',    label: 'Toutes' },
    { key: 'rappel', label: 'Rappels' },
    { key: 'unread', label: 'Non lues' },
  ];

  constructor(
    private router: Router,
    public navCtrl: NavController,
    private notificationService: NotificationService
  ) {
    addIcons({
      arrowBackOutline, closeOutline, notificationsOffOutline, notificationsOutline,
      checkmarkCircleOutline, warningOutline, alertCircleOutline, informationOutline,
      chatbubbleEllipsesOutline, refreshOutline, informationCircleOutline, logOutOutline,
      timeOutline, sparklesOutline, checkmarkDoneOutline
    });
  }

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.isLoading = true;
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        // Filter out INSCRIPTION notifications for mobile clients
        this.allNotifications = data.filter(n => n.type?.toUpperCase() !== 'INSCRIPTION');
        this.applyFilter(this.activeFilter);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.isLoading = false;
      }
    });
  }

  applyFilter(filter: 'all' | 'rappel' | 'unread') {
    this.activeFilter = filter;
    switch (filter) {
      case 'rappel':
        this.notifications = this.allNotifications.filter(n =>
          n.type?.toUpperCase() === 'RAPPEL');
        break;
      case 'unread':
        this.notifications = this.allNotifications.filter(n => !n.read);
        break;
      default:
        this.notifications = [...this.allNotifications];
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.allNotifications.forEach(n => n.read = true);
        this.applyFilter(this.activeFilter);
      },
      error: (err) => console.error('Error marking all as read:', err)
    });
  }

  markAsRead(id: number) {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        const notif = this.allNotifications.find(n => n.id === id);
        if (notif) notif.read = true;
        this.applyFilter(this.activeFilter);
      }
    });
  }

  deleteNotification(id: number) {
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.allNotifications = this.allNotifications.filter(n => n.id !== id);
        this.applyFilter(this.activeFilter);
      }
    });
  }

  /** Parse "📅 Rappel: Some Title (Prévu pour: 21:30)" into title + time */
  parseRappelMessage(message: string): { title: string; time: string } | null {
    if (!message) return null;
    // Match: Rappel: <title> (Prévu pour: <time>)
    const match = message.match(/Rappel:\s*(.+?)\s*\(Prévu pour:\s*(.+?)\)/i);
    if (match) {
      return { title: match[1].trim(), time: match[2].trim() };
    }
    return null;
  }

  getIcon(type: string): string {
    switch (type?.toUpperCase()) {
      case 'SUCCES':
      case 'SUCCESS': return 'checkmark-circle-outline';
      case 'ALERTE':
      case 'WARNING': return 'warning-outline';
      case 'ERREUR':
      case 'ERROR': return 'alert-circle-outline';
      case 'RAPPEL': return 'notifications-outline';
      case 'INSCRIPTION':
      case 'INFO': return 'information-circle-outline';
      default: return 'information-circle-outline';
    }
  }

  getColorClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'SUCCES':
      case 'SUCCESS': return 'success';
      case 'ALERTE':
      case 'WARNING': return 'warning';
      case 'ERREUR':
      case 'ERROR': return 'danger';
      case 'RAPPEL': return 'rappel';
      case 'INSCRIPTION':
      case 'INFO': return 'info';
      default: return 'primary';
    }
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  get unreadCount(): number {
    return this.allNotifications.filter(n => !n.read).length;
  }

  goToNotifications() { /* already here */ }

  logout() {
    this.navCtrl.navigateRoot('/login');
  }
}


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

import { LumLogoBarComponent } from '../../components/lum-logo-bar/lum-logo-bar.component';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonHeader, IonSpinner, LumLogoBarComponent]
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
        const apiNotifications = data.filter(n => n.type?.toUpperCase() !== 'INSCRIPTION');

        // Load local storage rappels
        let localRappels: any[] = [];
        try {
          const raw = localStorage.getItem('rappels');
          localRappels = raw ? JSON.parse(raw) : [];
        } catch (e) {
          console.error('Error parsing local rappels:', e);
        }

        // Map local rappels to Notification interface
        const mappedRappels: Notification[] = localRappels.map((r: any) => {
          const d = new Date(r.date);
          const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          return {
            id: -parseInt(r.id) || -Date.now(), // negative ID to distinguish from API
            type: 'RAPPEL',
            message: `Rappel: ${r.titre} (Prévu pour: ${dateStr})`,
            read: !!r.fait,
            timestamp: r.date
          };
        });

        // Combine both sets and sort by date descending
        this.allNotifications = [...apiNotifications, ...mappedRappels].sort((a, b) => {
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return dateB - dateA;
        });

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
    // 1. Mark all local rappels as read (fait = true)
    try {
      const raw = localStorage.getItem('rappels');
      let localRappels = raw ? JSON.parse(raw) : [];
      localRappels.forEach((r: any) => r.fait = true);
      localStorage.setItem('rappels', JSON.stringify(localRappels));
    } catch (e) {
      console.error('Error marking all local rappels as read:', e);
    }

    // 2. Mark all API notifications as read on backend
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.allNotifications.forEach(n => n.read = true);
        this.applyFilter(this.activeFilter);
      },
      error: (err) => console.error('Error marking all as read:', err)
    });
  }

  markAsRead(id: number) {
    if (id < 0) {
      // Local rappel mark as read (fait = true)
      try {
        const raw = localStorage.getItem('rappels');
        let localRappels = raw ? JSON.parse(raw) : [];
        const rappelIdString = (-id).toString();
        const rappel = localRappels.find((r: any) => r.id === rappelIdString);
        if (rappel) {
          rappel.fait = true;
          localStorage.setItem('rappels', JSON.stringify(localRappels));
        }
      } catch (e) {
        console.error('Error marking local rappel as read:', e);
      }
      const notif = this.allNotifications.find(n => n.id === id);
      if (notif) notif.read = true;
      this.applyFilter(this.activeFilter);
    } else {
      // API notification mark as read
      this.notificationService.markAsRead(id).subscribe({
        next: () => {
          const notif = this.allNotifications.find(n => n.id === id);
          if (notif) notif.read = true;
          this.applyFilter(this.activeFilter);
        }
      });
    }
  }

  deleteNotification(id: number) {
    if (id < 0) {
      // Local rappel deletion
      try {
        const raw = localStorage.getItem('rappels');
        let localRappels = raw ? JSON.parse(raw) : [];
        const rappelIdString = (-id).toString();
        localRappels = localRappels.filter((r: any) => r.id !== rappelIdString);
        localStorage.setItem('rappels', JSON.stringify(localRappels));
      } catch (e) {
        console.error('Error deleting local rappel:', e);
      }
      this.allNotifications = this.allNotifications.filter(n => n.id !== id);
      this.applyFilter(this.activeFilter);
    } else {
      // API notification deletion
      this.notificationService.deleteNotification(id).subscribe({
        next: () => {
          this.allNotifications = this.allNotifications.filter(n => n.id !== id);
          this.applyFilter(this.activeFilter);
        }
      });
    }
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


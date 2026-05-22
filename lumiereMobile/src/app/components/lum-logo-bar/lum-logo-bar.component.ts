import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { notificationsOutline, logOutOutline } from 'ionicons/icons';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lum-logo-bar',
  template: `
    <div class="lum-logo-bar">
      <div class="lum-logo-wrap">
        <img src="assets/otflow-horizontal.png" alt="Otflow" />
      </div>
      <div class="lum-logo-actions">
        <button class="lum-icon-btn" (click)="goToNotifications()">
          <ion-icon name="notifications-outline"></ion-icon>
          <span class="lum-badge" *ngIf="unreadNotifsCount > 0">{{ unreadNotifsCount }}</span>
        </button>
        <button class="lum-icon-btn" (click)="logout()">
          <ion-icon name="log-out-outline"></ion-icon>
        </button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, IonIcon]
})
export class LumLogoBarComponent implements OnInit, OnDestroy {
  unreadNotifsCount = 0;
  private lastApiCount = 0;
  private sub?: Subscription;
  private intervalId: any;

  constructor(
    private navCtrl: NavController,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    addIcons({ notificationsOutline, logOutOutline });
  }

  ngOnInit() {
    this.sub = this.notificationService.unreadCount$.subscribe(count => {
      this.lastApiCount = count;
      this.updateTotalCount();
    });

    this.updateTotalCount();

    // Periodically refresh the count to pick up local storage updates from other screens
    this.intervalId = setInterval(() => {
      this.updateTotalCount();
    }, 2000);
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateTotalCount() {
    let pendingRappelsCount = 0;
    try {
      const raw = localStorage.getItem('rappels');
      if (raw) {
        const all = JSON.parse(raw);
        pendingRappelsCount = all.filter((r: any) => !r.fait).length;
      }
    } catch (e) {
      console.error('Error loading rappels for header count:', e);
    }
    this.unreadNotifsCount = this.lastApiCount + pendingRappelsCount;
  }

  goToNotifications() {
    this.navCtrl.navigateForward(['/notifications']);
  }

  logout() {
    this.authService.logout();
    this.navCtrl.navigateRoot(['/login']);
  }
}

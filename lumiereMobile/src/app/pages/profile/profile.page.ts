import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner,
  AlertController,
  LoadingController
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  chatbubbleEllipsesOutline, arrowBackOutline, createOutline, keyOutline,
  logOutOutline, personOutline, mailOutline, callOutline,
  lockClosedOutline, notificationsOutline, chevronForwardOutline,
  shieldCheckmarkOutline, closeCircleOutline, informationCircleOutline,
  checkmarkOutline, shieldOutline, shieldCheckmark, cameraOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  host: { 'class': 'ion-page' },
  imports: [
    IonContent,
    IonHeader,
    IonIcon,
    IonButton,
    IonSpinner,
    CommonModule,
    FormsModule,
    HttpClientModule
  ]
})
export class ProfilePage implements OnInit {
  loading = false;
  updating = false;
  editMode = false;
  activeTab: 'info' | 'password' = 'info';
  selectedSegment = 'profile';
  user: any = null;
  isSavingInfo = false;
  isSavingPassword = false;
  passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  stats: any = {
    totalMesDemandes: 0,
    totalMesLivraisons: 0
  };

  constructor(
    private authService: AuthService,
    public router: Router,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    public navCtrl: NavController,
    private http: HttpClient
  ) {
    addIcons({
      chatbubbleEllipsesOutline, arrowBackOutline, createOutline, keyOutline, logOutOutline,
      personOutline, mailOutline, callOutline, lockClosedOutline, notificationsOutline,
      chevronForwardOutline, shieldCheckmarkOutline, closeCircleOutline,
      informationCircleOutline, checkmarkOutline, shieldOutline, shieldCheckmark,
      cameraOutline
    });
  }

  ngOnInit() {
    this.loadProfile();
    this.loadStats();
  }

  loadStats() {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get(`${environment.apiUrl}/v1/client/dashboard/stats`, { headers }).subscribe({
      next: (res: any) => {
        this.stats = res;
      },
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  loadProfile() {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.loading = false;

        if (error.status === 401 || error.status === 403) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  saveProfileInfo() {
    if (!this.user.firstname?.trim() || !this.user.lastname?.trim()) {
      this.toastService.show('Veuillez remplir tous les champs obligatoires', 'warning');
      return;
    }
    this.isSavingInfo = true;
    // Simulate save
    setTimeout(() => {
      this.isSavingInfo = false;
      this.toastService.show('Profil mis à jour avec succès !', 'success');
    }, 800);
  }

  savePassword() {
    if (!this.passwordForm.currentPassword) {
      this.toastService.show('Veuillez saisir votre mot de passe actuel', 'warning');
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.toastService.show('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (this.passwordForm.newPassword.length < 6) {
      this.toastService.show('Le mot de passe doit contenir au moins 6 caractères', 'warning');
      return;
    }
    this.isSavingPassword = true;
    setTimeout(() => {
      this.isSavingPassword = false;
      this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      this.toastService.show('Mot de passe mis à jour avec succès !', 'success');
    }, 800);
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      cssClass: 'custom-alert',
      buttons: [
        { 
          text: 'Annuler', 
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Déconnexion',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  getUserInitials(): string {
    if (!this.user) return 'U';
    const firstname = this.user.firstname || '';
    const lastname = this.user.lastname || '';
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase() || 'U';
  }

  goToNotifications() {
    this.router.navigate(['/notifications']);
  }

  editField(field: string) {
    // Kept for template compatibility
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result;
        this.uploadAvatar(base64);
      };
      reader.readAsDataURL(file);
    }
  }

  async uploadAvatar(base64: string) {
    if (!this.user.id) return;
    
    const loading = await this.loadingController.create({
      message: 'Mise à jour de la photo...',
    });
    await loading.present();

    const body = {
      firstname: this.user.firstname,
      lastname: this.user.lastname,
      profileImageBase64: base64
    };

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.put(`${environment.apiUrl}/v1/users/${this.user.id}/profile`, body, { headers }).subscribe({
      next: (res: any) => {
        this.user = res;
        this.toastService.show('Photo de profil mise à jour !', 'success');
        loading.dismiss();
      },
      error: (err) => {
        console.error('Error updating profile image:', err);
        this.toastService.show('Erreur lors de la mise à jour', 'error');
        loading.dismiss();
      }
    });
  }
}


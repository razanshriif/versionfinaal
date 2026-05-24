import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonBackButton,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonCheckbox,
  LoadingController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,

  imports: [
    CommonModule,
    FormsModule, // ✅ REQUIRED for ngModel

    // ✅ Ionic standalone components
    IonContent,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonCheckbox
  ]
})
export class RegisterPage {

  showPassword = false;
  showConfirmPassword = false;

  formData = {
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private loadingCtrl: LoadingController
  ) {
    addIcons({
      eyeOutline,
      eyeOffOutline
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
  async onRegister() {
    // 1️⃣ Simple validation
    if (!this.formData.firstname || !this.formData.lastname || !this.formData.email ||
      !this.formData.password || !this.formData.confirmPassword) {
      await this.toastService.show('Veuillez remplir tous les champs obligatoires', 'warning');
      return;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      await this.toastService.show('Les mots de passe ne correspondent pas', 'danger');
      return;
    }

    if (!this.formData.acceptTerms) {
      await this.toastService.show('Veuillez accepter les conditions', 'warning');
      return;
    }

    // 2️⃣ Show loading
    const loading = await this.loadingCtrl.create({
      message: 'Création du compte...',
      spinner: 'crescent'
    });
    await loading.present();

    // 3️⃣ Prepare payload for backend (Full DTO to avoid 400)
    const payload = {
      firstname: this.formData.firstname,
      lastname: this.formData.lastname,
      email: this.formData.email,
      password: this.formData.password,
      role: 'CLIENT',
      civilite: '',
      telephone: '',
      adresse: '',
      ville: '',
      pays: 'Tunisie',
      codepostal: 0,
      type: 'Standard',
      societeFacturation: ''
    };

    // 4️⃣ Call backend
    this.authService.register(payload).subscribe({
      next: async (res) => {
        await loading.dismiss();
        // Save email so the pending page can poll status
        sessionStorage.setItem('pending_email', this.formData.email);
        await this.toastService.show(
          'Compte créé ! En attente de validation par un administrateur.',
          'warning',
          4000
        );
        this.router.navigate(['/pending']);
      },
      error: async (err) => {
        await loading.dismiss();
        const message = err?.error?.message || 'Erreur lors de l’inscription';
        await this.toastService.show(message, 'danger');
      }
    });
  }

}


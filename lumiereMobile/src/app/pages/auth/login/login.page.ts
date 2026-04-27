import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  logInOutline,
  personAddOutline,
  businessOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  host: { 'class': 'ion-page' },
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonInput,      // ✅ IMPORTANT : IonInput ajouté ici
    IonButton,
    IonIcon,
    IonSpinner
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  // ✅ IMPORTANT : Permet d'utiliser les custom elements Ionic
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    // Enregistrer toutes les icônes
    addIcons({ mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, logInOutline, personAddOutline, business: businessOutline });
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Login
  async onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const loading = await this.loadingController.create({
        message: 'Connexion en cours...',
        spinner: 'crescent'
      });
      await loading.present();

      this.authService.login(this.loginForm.value).subscribe({
        next: async (response) => {
          this.isLoading = false;
          await loading.dismiss();

          // Set flag for home page to show welcome toast
          sessionStorage.setItem('login_success', 'true');
          
          // Initialiser les notifications après login
          this.notificationService.initAfterLogin();

          // Blur any active element (like the login button) to prevent focus retention in hidden page
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }

          this.router.navigate(['/home']);
        },
        error: async (error) => {
          this.isLoading = false;
          await loading.dismiss();
          let errorMessage = 'Email ou mot de passe incorrect';

          if (error.status === 0) {
            errorMessage = 'Erreur de connexion au serveur. Vérifiez que le backend est lancé et accessible.';
          } else if (error.status === 403) {
            let msg = '';
            if (typeof error.error === 'string') {
              msg = error.error;
            } else if (error.error && typeof error.error === 'object' && error.error.message) {
              msg = error.error.message;
            } else if (error.message) {
              msg = error.message;
            }

            if (msg && typeof msg === 'string' && msg.includes('ACCOUNT_PENDING')) {
              const email = this.loginForm.get('email')?.value;
              sessionStorage.setItem('pending_email', email);
              this.router.navigate(['/pending']);
              return;
            } else if (msg && typeof msg === 'string' && msg.includes('ACCOUNT_REJECTED')) {
              errorMessage = '❌ Votre compte a été rejeté. Contactez l’administrateur.';
            } else {
              errorMessage = 'Accès refusé. Vérifiez vos identifiants.';
            }
          } else if (error.status >= 500) {
            errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
          }

          await this.showToast(errorMessage, 'danger');
          console.error('Login error:', error);
        }
      });

    } else {
      await this.showToast('Veuillez remplir tous les champs', 'warning');
    }
  }

  // Navigate to register
  goToRegister() {
    this.router.navigate(['/register']);
  }

  // Show toast
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    toast.present();
  }
  testBackend() {
    const payload = {
      email: 'test@example.com',
      password: '123456'
    };

    this.authService.login(payload).subscribe({
      next: (res) => {
        console.log('Backend works! Response:', res);
        alert('Login success! JWT token: ' + res.token);
      },
      error: (err) => {
        console.error('Backend error:', err);
        alert('Login failed: ' + JSON.stringify(err));
      }
    });
  }

}


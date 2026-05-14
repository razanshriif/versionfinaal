import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent, IonInput, IonButton, IonIcon, IonSpinner, ToastController, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonInput, IonButton, IonIcon, IonSpinner, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton]
})
export class ResetPasswordPage implements OnInit {
  resetForm!: FormGroup;
  isLoading = false;
  email = '';
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.email = this.route.snapshot.queryParams['email'] || '';
    const codeFromUrl = this.route.snapshot.queryParams['code'] || '';

    this.resetForm = this.formBuilder.group({
      email: [this.email, [Validators.required, Validators.email]],
      code: [codeFromUrl, [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.resetForm.valid) {
      this.isLoading = true;
      const payload = this.resetForm.value;
      
      this.http.post(`${environment.apiUrl}/auth/reset-password`, payload).subscribe({
        next: async (res: any) => {
          this.isLoading = false;
          await this.showToast(res.message || 'Mot de passe réinitialisé avec succès', 'success');
          this.router.navigate(['/login']);
        },
        error: async (err) => {
          this.isLoading = false;
          const msg = err.error?.message || 'Code invalide ou erreur serveur.';
          await this.showToast(msg, 'danger');
        }
      });
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    toast.present();
  }
}

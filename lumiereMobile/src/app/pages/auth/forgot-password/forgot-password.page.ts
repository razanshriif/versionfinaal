import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonInput, IonButton, IonIcon, IonSpinner, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { ToastService } from '../../../services/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonInput, IonButton, IonIcon, IonSpinner, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton]
})
export class ForgotPasswordPage implements OnInit {
  forgotForm!: FormGroup;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.forgotForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.valid) {
      this.isLoading = true;
      const email = this.forgotForm.get('email')?.value;
      
      this.http.post(`${environment.apiUrl}/v1/auth/forgot-password`, { email }).subscribe({
        next: async (res: any) => {
          this.isLoading = false;
          await this.showToast(res.message || 'Code envoyé avec succès', 'success');
          // Navigate to reset password page, pass email
          this.router.navigate(['/reset-password'], { queryParams: { email } });
        },
        error: async (err) => {
          this.isLoading = false;
          await this.showToast('Erreur lors de l\'envoi du code. Veuillez réessayer.', 'danger');
        }
      });
    }
  }

  async showToast(message: string, color: string) {
    await this.toastService.show(
      message,
      color as 'success' | 'danger' | 'warning' | 'error' | 'info'
    );
  }
}

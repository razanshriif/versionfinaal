import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';
  error: string = '';
  success: string = '';
  isLoading: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    if (!this.email) {
      this.error = 'Veuillez entrer votre adresse email.';
      return;
    }
    
    this.isLoading = true;
    this.error = '';
    this.success = '';

    this.http.post('http://localhost:8080/api/v1/auth/forgot-password', { email: this.email }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.success = res.message || 'Code de réinitialisation envoyé.';
        setTimeout(() => {
          this.router.navigate(['/auth/reset-password'], { queryParams: { email: this.email } });
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }
}

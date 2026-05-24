import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  email: string = '';
  err: boolean = false;
  error: string = '';
  successMsg: string = '';
  isLoading: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    if (!this.email) {
      this.err = true;
      this.error = 'Veuillez entrer votre adresse email.';
      return;
    }
    
    this.isLoading = true;
    this.err = false;
    
    this.http.post(`${environment.apiUrl}/v1/auth/forgot-password`, { email: this.email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMsg = "Code envoyé avec succès ! Redirection...";
        // Navigate to reset password page with email in query params
        setTimeout(() => {
          this.router.navigate(['/reset-password'], { queryParams: { email: this.email } });
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.err = true;
        this.error = "Erreur lors de l'envoi. Vérifiez l'adresse email.";
      }
    });
  }
}

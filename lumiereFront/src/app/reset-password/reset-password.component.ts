import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  email: string = '';
  code: string = '';
  newPassword: string = '';
  
  err: boolean = false;
  error: string = '';
  successMsg: string = '';
  isLoading: boolean = false;
  showPassword = false;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (!this.email || !this.code || !this.newPassword) {
      this.err = true;
      this.error = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    
    this.isLoading = true;
    this.err = false;
    
    const payload = {
      email: this.email,
      code: this.code,
      password: this.newPassword
    };
    
    this.http.post(`${environment.apiUrl}/v1/auth/reset-password`, payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMsg = 'Mot de passe réinitialisé avec succès ! Vous allez être redirigé vers la page de connexion.';
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.err = true;
        this.error = err.error?.message || 'Erreur lors de la réinitialisation du mot de passe.';
      }
    });
  }
}

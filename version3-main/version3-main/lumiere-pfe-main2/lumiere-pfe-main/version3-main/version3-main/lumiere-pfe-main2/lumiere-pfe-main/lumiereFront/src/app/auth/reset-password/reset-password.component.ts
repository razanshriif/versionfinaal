import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  email: string = '';
  code: string = '';
  newPassword: string = '';
  error: string = '';
  success: string = '';
  isLoading: boolean = false;

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
      if (params['code']) {
        this.code = params['code'];
      }
    });
  }

  onSubmit() {
    if (!this.email || !this.code || !this.newPassword) {
      this.error = 'Veuillez remplir tous les champs.';
      return;
    }
    
    this.isLoading = true;
    this.error = '';
    this.success = '';

    this.http.post('http://localhost:8080/api/v1/auth/reset-password', {
      email: this.email,
      code: this.code,
      newPassword: this.newPassword
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.success = res.message || 'Mot de passe réinitialisé.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Code invalide ou erreur serveur.';
      }
    });
  }
}

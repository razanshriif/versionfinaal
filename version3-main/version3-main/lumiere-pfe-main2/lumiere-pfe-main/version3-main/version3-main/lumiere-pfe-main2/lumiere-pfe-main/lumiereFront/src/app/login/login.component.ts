import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {


  error: string = "";
  err = false;


  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  login(): void {
    this.authService.login(this.email, this.password).subscribe(response => {
      localStorage.setItem('token', response.token);
      this.router.navigate(['/material/dashboard']);
      this.error = "";
      this.err = false;
    }, error => {
      console.error('Login failed', error);
      if (error.error && error.error.message) {
        this.error = error.error.message;
      } else if (typeof error.error === 'string') {
        this.error = error.error;
      } else {
        this.error = "Verifier Vos Champs";
      }
      this.err = true;

    });
  }
}




import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

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

  onSubmit() {
    if (!this.email) {
      this.err = true;
      this.error = 'Veuillez entrer votre adresse email.';
      return;
    }
    this.err = false;
    this.successMsg = "Un lien de réinitialisation a été envoyé si l'adresse email existe dans notre système.";
  }
}

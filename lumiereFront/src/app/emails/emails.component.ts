import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-emails',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './emails.component.html',
  styleUrl: './emails.component.css'
})
export class EmailsComponent {
  isModalOpen = false;

  email = {
    to: '',
    subject: '',
    body: ''
  };

  openModal() {
    this.isModalOpen = true;
  }

  closeModal(event?: MouseEvent) {
    this.isModalOpen = false;
  }

  onSubmit() {
    console.log('Email envoyé:', this.email);
    // Ajoutez ici la logique pour envoyer l'email via un service Angular
    this.closeModal();
  }
}




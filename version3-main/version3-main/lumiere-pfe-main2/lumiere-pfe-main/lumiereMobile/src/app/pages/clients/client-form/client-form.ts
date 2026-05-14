import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonButton, IonIcon,
  IonContent, IonLabel, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonCheckbox, ToastController
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ClientService } from '../../../services/client.service';
import { Client } from '../../../models/client.model';
import { addIcons } from 'ionicons';
import { saveOutline, arrowBackOutline, notificationsOutline, logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.html',
  styleUrls: ['./client-form.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonButton, IonIcon,
    IonContent, IonLabel, IonInput, IonTextarea,
    IonSelect, IonSelectOption, IonCheckbox
  ]
})
export class ClientForm implements OnInit {
  isEditMode: boolean = false;
  clientCode: number | null = null;
  client: any = {
    code: 0,
    codeclient: '',
    codepostal: 0,
    nom: '',
    adresse: '',
    ville: '',
    pays: 'TUN',
    statut: 'ACTIF',
    civilite: '',
    type: '',
    email: '',
    telephone: '',
    sType: '',
    confiere: false,
    societeFacturation: '',
    siteExploitation: '',
    numeroPortable: '',
    idTva: '',
    idEdi: ''
  };

  constructor(
    private clientService: ClientService,
    private route: ActivatedRoute,
    public navCtrl: NavController,
    private toastController: ToastController
  ) {
    addIcons({ saveOutline, arrowBackOutline, notificationsOutline, logOutOutline });
  }

  logout() {
    this.navCtrl.navigateRoot('/login');
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params: any) => {
      if (params.has('id')) {
        this.isEditMode = true;
        this.clientCode = +params.get('id')!;
        this.loadClient(this.clientCode);
      } else {
        // Initialize with next available code logic if needed, or leave for manual input
      }
    });
  }

  loadClient(id: number) {
    this.clientService.getById(id).subscribe({
      next: (data) => this.client = data,
      error: () => this.showToast('Erreur lors du chargement du client', 'danger')
    });
  }

  saveClient() {
    if (!this.isValid()) {
      this.showToast('Veuillez remplir les champs obligatoires (*)', 'warning');
      return;
    }

    if (this.isEditMode && this.clientCode) {
      this.clientService.update(this.clientCode, this.client).subscribe({
        next: () => {
          this.showToast('Client mis à jour avec succès', 'success');
          this.navCtrl.back();
        },
        error: () => this.showToast('Erreur lors de la mise à jour', 'danger')
      });
    } else {
      this.clientService.create(this.client).subscribe({
        next: () => {
          this.showToast('Client créé avec succès', 'success');
          this.navCtrl.back();
        },
        error: () => this.showToast('Erreur lors de la création', 'danger')
      });
    }
  }

  isValid(): boolean {
    return !!(this.client.code && this.client.nom && this.client.adresse && this.client.ville);
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}


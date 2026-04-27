import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ViewDidEnter, ToastController, AlertController, NavController } from '@ionic/angular';
import {
  IonHeader, IonIcon,
  IonContent, IonRefresher, IonRefresherContent,
  IonInput, IonList, IonItemSliding, IonItem, IonItemOptions, IonItemOption
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  logOutOutline,
  searchOutline,
  addOutline,
  pencilOutline,
  trashOutline,
  personOutline,
  chevronForwardOutline,
  locationOutline,
  personAddOutline,
  createOutline,
  arrowBackOutline,
  peopleOutline,
  chatbubbleEllipsesOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.html',
  styleUrls: ['./clients.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader, IonIcon,
    IonContent, IonRefresher, IonRefresherContent,
    IonInput, IonList, IonItemSliding, IonItem, IonItemOptions, IonItemOption
  ]
})
export class Clients implements OnInit, ViewDidEnter {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  stats = { notifications: 0 };

  constructor(
    private clientService: ClientService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    public navCtrl: NavController
  ) {
    addIcons({
      notificationsOutline,
      logOutOutline,
      searchOutline,
      addOutline,
      pencilOutline,
      trashOutline,
      personOutline,
      chevronForwardOutline,
      locationOutline,
      personAddOutline,
      createOutline,
      arrowBackOutline,
      peopleOutline,
      chatbubbleEllipsesOutline
    });
  }

  ngOnInit() { }

  ionViewDidEnter() {
    this.loadClients();
  }

  loadClients(event?: any) {
    this.isLoading = true;
    this.clientService.getAll().subscribe({
      next: (data) => {
        this.clients = data;
        this.filterClients();
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('Error loading clients', err);
        this.isLoading = false;
        this.showToast('Erreur lors du chargement des clients', 'danger');
        if (event) event.target.complete();
      }
    });
  }

  filterClients() {
    if (!this.searchTerm) {
      this.filteredClients = this.clients;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(c =>
      (c.nom && c.nom.toLowerCase().includes(term)) ||
      (c.code && c.code.toString().includes(term)) ||
      (c.ville && c.ville.toLowerCase().includes(term))
    );
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.filterClients();
  }

  async deleteClient(client: Client) {
    const alert = await this.alertController.create({
      header: 'Confirmation',
      message: `Voulez-vous vraiment supprimer le client ${client.nom} ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: () => {
            this.performDelete(client.code!);
          }
        }
      ]
    });
    await alert.present();
  }

  performDelete(id: number) {
    this.clientService.delete(id).subscribe({
      next: () => {
        this.showToast('Client supprimé avec succès', 'success');
        this.loadClients();
      },
      error: () => this.showToast('Erreur lors de la suppression', 'danger')
    });
  }

  editClient(client: Client) {
    this.router.navigate(['/clients/edit', client.code]);
  }

  createClient() {
    this.router.navigate(['/clients/create']);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  goToNotifications() {
    this.router.navigate(['/notifications']);
  }

  logout() {
    // In a real app, call authService.logout()
    this.router.navigate(['/login']);
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


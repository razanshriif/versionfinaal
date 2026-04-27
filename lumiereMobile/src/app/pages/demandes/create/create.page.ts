import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ToastController,
  LoadingController,
  IonIcon,
  IonContent,
  IonModal,
  IonButton,
  IonHeader,
  IonSearchbar,
  IonInput,
  IonTextarea,
  IonRadioGroup,
  IonRadio,
  IonDatetimeButton,
  IonDatetime
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline, locationOutline, cubeOutline, calendarOutline,
  carOutline, searchOutline, sendOutline, arrowUpCircleOutline, chatbubbleOutline,
  arrowBackOutline, personAddOutline, closeOutline, cloudUploadOutline, personOutline,
  busOutline, snowOutline, layersOutline, waterOutline,
  notificationsOutline, logOutOutline, logInOutline, chevronDownOutline
} from 'ionicons/icons';
import { DemandeService } from '../../../services/demande.service';
import { ClientService } from '../../../services/client.service';
import { ArticleService } from '../../../services/article.service';
import { AuthService } from '../../../services/auth.service';
import { Client } from '../../../models/client.model';
import { Article } from '../../../models/article.model';
import { Ordre } from '../../../models/ordre.model';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonIcon, IonContent, IonHeader, IonModal,
    IonButton, IonSearchbar, IonInput, IonTextarea, IonRadioGroup, IonRadio,
    IonDatetimeButton, IonDatetime
  ]
})
export class CreatePage implements OnInit {
  ordre: Ordre = {
    client: '',
    nomclient: '',
    siteclient: 'SAL',
    idedi: 'Otflow',
    codeclientcharg: '',
    chargementNom: '',
    chargementAdr1: '',
    chargementVille: '',
    codepostalcharg: '',
    codeclientliv: '',
    livraisonNom: '',
    livraisonAdr1: '',
    livraisonVille: '',
    codepostalliv: '',
    chargementDate: new Date().toISOString(),
    livraisonDate: new Date().toISOString(),
    codeArticle: '',
    designation: '',
    nombreColis: 0,
    nombrePalettes: 0,
    volume: 0,
    poids: 0,
    longueur: 0,
    commentaires: []
  };

  siteOptions = ['BAR', 'SAL', 'BKS', 'SFX', 'TUN', 'GAB', 'GAS', 'BSL', 'JER', 'BIZ', 'NAS'];

  allClients: Client[] = [];
  filteredClients: Client[] = [];
  isClientPickerOpen = false;
  pickerTarget: 'chargement' | 'livraison' = 'livraison';

  allArticles: Article[] = [];
  filteredArticles: Article[] = [];
  isArticlePickerOpen = false;
  isSitePickerOpen = false;
  filteredSites: string[] = [];

  optionsCommentaire = {
    typeVoyage: '',
    typeCamion: '',
    typeSemi: '',
    commentaireLibre: ''
  };

  commentaireFinal = '';
  orderSent: string | null = null;
  userProfile: any = null;

  constructor(
    private demandeService: DemandeService,
    private clientService: ClientService,
    private articleService: ArticleService,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ notificationsOutline, logOutOutline, logInOutline, chevronDownOutline, arrowBackOutline, personOutline, cloudUploadOutline, searchOutline, locationOutline, cubeOutline, carOutline, sendOutline, businessOutline, calendarOutline, arrowUpCircleOutline, chatbubbleOutline, personAddOutline, closeOutline, busOutline, snowOutline, layersOutline, waterOutline });
  }

  async ngOnInit() {
    this.initDates();
    await this.loadInitialData();
    this.updateCommentaire();
  }

  initDates() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const chargement = new Date(tomorrow);
    chargement.setHours(8, 0, 0, 0);
    const livraison = new Date(tomorrow);
    livraison.setHours(12, 0, 0, 0);

    this.ordre.chargementDate = chargement.toISOString();
    this.ordre.livraisonDate = livraison.toISOString();
  }

  async loadInitialData() {
    try {
      // 1. Get User Profile for Sender Info (Block 1 & 2)
      this.userProfile = await this.authService.getProfile().toPromise();
      if (this.userProfile) {
        this.ordre.nomclient = (this.userProfile.firstname + ' ' + (this.userProfile.lastname || '')).trim();
        this.ordre.client = this.userProfile.email || this.userProfile.codeClient || '';
        this.ordre.siteclient = this.userProfile.site || 'SAL';

        // Auto-populate Block 2 (Chargement)
        this.ordre.codeclientcharg = this.ordre.client;
        this.ordre.chargementNom = this.ordre.nomclient;
        this.ordre.chargementAdr1 = this.userProfile.adresse || '';
        this.ordre.chargementVille = this.userProfile.ville || '';
        this.ordre.codepostalcharg = this.userProfile.codepostal?.toString() || '';
      }

      // 2. Pre-fetch all clients
      this.allClients = await this.clientService.getAll().toPromise() || [];
      this.filteredClients = [...this.allClients];

      // 3. Pre-fetch all articles
      this.allArticles = await this.articleService.getArticles().toPromise() || [];
      this.filteredArticles = [...this.allArticles];

    } catch (e) {
      console.error('Error loading data', e);
    }
  }

  openClientPicker(target: 'chargement' | 'livraison' = 'livraison') {
    this.pickerTarget = target;
    this.filteredClients = [...this.allClients];
    this.isClientPickerOpen = true;
  }

  filterClients(event: any) {
    const val = event.target.value.toLowerCase();
    this.filteredClients = this.allClients.filter(c =>
      (c.nom?.toLowerCase().includes(val) || false) ||
      (c.codeclient?.toLowerCase().includes(val) || false) ||
      (c.ville?.toLowerCase().includes(val) || false)
    );
  }

  selectClient(c: Client) {
    if (this.pickerTarget === 'livraison') {
      this.ordre.codeclientliv = c.codeclient || '';
      this.ordre.livraisonNom = c.nom || '';
      this.ordre.livraisonAdr1 = c.adresse || '';
      this.ordre.livraisonVille = c.ville || '';
      this.ordre.codepostalliv = c.codepostal?.toString() || '';
    } else {
      this.ordre.codeclientcharg = c.codeclient || '';
      this.ordre.chargementNom = c.nom || '';
      this.ordre.chargementAdr1 = c.adresse || '';
      this.ordre.chargementVille = c.ville || '';
      this.ordre.codepostalcharg = c.codepostal?.toString() || '';
    }
    this.isClientPickerOpen = false;
  }

  openArticlePicker() {
    this.filteredArticles = [...this.allArticles];
    this.isArticlePickerOpen = true;
  }

  filterArticles(event: any) {
    const val = event.target.value.toLowerCase();
    this.filteredArticles = this.allArticles.filter(a =>
      a.label.toLowerCase().includes(val) || a.codeArticle.toLowerCase().includes(val)
    );
  }

  selectArticle(a: Article) {
    this.ordre.codeArticle = a.codeArticle || '';
    this.ordre.designation = a.label || '';

    // Auto-fill logic based on new Article model fields
    if (a.typeDeRemorque) {
      if (['Standard', 'Bache'].includes(a.typeDeRemorque)) {
        this.optionsCommentaire.typeCamion = 'Semi';
        this.optionsCommentaire.typeSemi = 'Bache';
      } else if (a.typeDeRemorque === 'Frigo') {
        this.optionsCommentaire.typeCamion = 'Semi';
        this.optionsCommentaire.typeSemi = 'Frigo';
      } else if (a.typeDeRemorque === 'Plateau') {
        this.optionsCommentaire.typeCamion = 'Semi';
        this.optionsCommentaire.typeSemi = 'Plateau';
      }
      this.updateCommentaire();
    }

    this.isArticlePickerOpen = false;
  }

  onArticleCodeChange(event: any) {
    const val = event.target.value?.toUpperCase().trim();
    if (!val) {
      this.ordre.designation = '';
      return;
    }

    const match = this.allArticles.find(a =>
      a.codeArticle?.toUpperCase() === val
    );

    if (match) {
      this.ordre.designation = match.label;
    } else {
      this.ordre.designation = '';
    }
  }

  updateCommentaire() {
    const parts = [];
    if (this.optionsCommentaire.typeVoyage) {
      parts.push(this.optionsCommentaire.typeVoyage);
    }
    if (this.optionsCommentaire.typeCamion) {
      parts.push(this.optionsCommentaire.typeCamion);
      if ((this.optionsCommentaire.typeCamion === 'Semi' || this.optionsCommentaire.typeCamion === 'Cargo') && this.optionsCommentaire.typeSemi) {
        parts.push(`(${this.optionsCommentaire.typeSemi})`);
      }
    }
    if (this.optionsCommentaire.commentaireLibre) {
      parts.push(this.optionsCommentaire.commentaireLibre);
    }
    this.commentaireFinal = parts.join(', ');
  }

  async validerCommande() {
    if (!this.ordre.client) {
      await this.showToast('Veuillez renseigner le code client', 'warning');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Création de l\'ordre...' });
    await loading.present();

    try {
      this.updateCommentaire();
      if (this.commentaireFinal) {
        this.ordre.commentaires = [this.commentaireFinal];
      }

      // Clean payload for backend (remove auto-generated/conflict fields)
      const { id, orderNumber, dateSaisie, statut, ...cleanPayload } = this.ordre as any;

      // Ensure numeric fields are definitely numbers
      const finalPayload = {
        ...cleanPayload,
        poids: Number(cleanPayload.poids || 0),
        volume: Number(cleanPayload.volume || 0),
        longueur: Number(cleanPayload.longueur || 0),
        nombreColis: Number(cleanPayload.nombreColis || 0),
        nombrePalettes: Number(cleanPayload.nombrePalettes || 0),
        commentaires: this.ordre.commentaires && this.ordre.commentaires.length > 0
          ? Array.from(new Set(this.ordre.commentaires)) : null
      };

      await this.demandeService.createDemande(finalPayload as any).toPromise();
      await loading.dismiss();
      this.orderSent = "Commande enregistrée avec succès";
      await this.showToast('Ordre créé avec succès!', 'success');
      this.router.navigate(['/demandes/list']);
    } catch (error) {
      await loading.dismiss();
      console.error('Erreur lors de la création de l\'ordre:', error);
      await this.showToast('Erreur lors de la création de l\'ordre', 'danger');
    }
  }

  // Site Picker
  openSitePicker() {
    this.filteredSites = [...this.siteOptions];
    this.isSitePickerOpen = true;
  }

  filterSites(event: any) {
    const val = event.target.value?.toLowerCase() || '';
    this.filteredSites = this.siteOptions.filter(s => s.toLowerCase().includes(val));
  }

  selectSite(site: string) {
    this.ordre.siteclient = site;
    this.isSitePickerOpen = false;
  }

  cancel() {
    this.router.navigate(['/demandes/list']);
  }

  goToCreateClient() {
    this.router.navigate(['/clients/create']);
  }

  goToNotifications() {
    this.router.navigate(['/notifications']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}


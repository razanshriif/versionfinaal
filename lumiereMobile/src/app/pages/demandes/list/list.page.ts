import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  IonHeader, IonIcon,
  IonContent, IonRefresher, IonRefresherContent,
  IonInfiniteScroll, IonInfiniteScrollContent,
  IonInput, IonList, IonItemSliding, IonItem, IonItemOptions, IonItemOption
} from '@ionic/angular/standalone';
import { IonicModule, NavController } from '@ionic/angular';
import { DemandeService, DemandeFilter } from '../../../services/demande.service';
import { Demande } from '../../../models/demande.model';
import { AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  logOutOutline,
  checkmarkCircleOutline,
  trashOutline,
  copyOutline,
  createOutline,
  eyeOutline,
  arrowBackOutline,
  addCircleOutline,
  searchOutline,
  refreshOutline,
  documentTextOutline,
  carOutline,
  chevronDownOutline,
  cubeOutline,
  addOutline,
  layersOutline,
  chevronForwardOutline,
  chatbubbleEllipsesOutline,
  pinOutline,
  navigateCircleOutline,
  navigateOutline,
  chevronForward,
  timeOutline,
  chevronBackOutline,
  locationOutline,
  archiveOutline,
  funnelOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-list',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonIcon,
    IonContent, IonRefresher, IonRefresherContent,
    IonInfiniteScroll, IonInfiniteScrollContent,
    IonInput, IonList, IonItemSliding, IonItem, IonItemOptions, IonItemOption
  ]
})
export class ListPage implements OnInit {
  demandes: Demande[] = [];
  draftDemandes: Demande[] = [];
  pendingDemandes: Demande[] = [];
  confirmedDemandes: Demande[] = [];
  loading = false;
  searchTerm = '';
  selectedStatut = '';
  listMode: 'confirmed' | 'draft' | 'pending' = 'draft';
  draftCount = 0;
  pendingCount = 0;
  confirmedCount = 0;
  stats = { notifications: 0 };

  @ViewChild('swipeContainer', { static: false }) swipeContainer!: ElementRef;
  private isScrolling = false;

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  skeletonCount = [1, 2, 3, 4, 5]; // For skeleton loading

  private searchSubject = new Subject<string>();

  statutOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'NON_PLANIFIE', label: 'En attente' },
    { value: 'PLANIFIE', label: 'Planifié' },
    { value: 'EN_COURS_DE_LIVRAISON', label: 'En cours' },
    { value: 'LIVRE', label: 'Livré' },
    { value: 'NON_LIVRE', label: 'Non livré' }
  ];

  constructor(
    private demandeService: DemandeService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    public navCtrl: NavController
  ) {
    addIcons({
      notificationsOutline,
      logOutOutline,
      checkmarkCircleOutline,
      trashOutline,
      copyOutline,
      createOutline,
      eyeOutline,
      arrowBackOutline,
      addCircleOutline,
      searchOutline,
      refreshOutline,
      documentTextOutline,
      carOutline,
      chevronDownOutline,
      cubeOutline,
      addOutline,
      layersOutline,
      chevronForwardOutline,
      chatbubbleEllipsesOutline,
      pinOutline,
      navigateCircleOutline,
      navigateOutline,
      chevronForward,
      timeOutline,
      chevronBackOutline,
      locationOutline,
      archiveOutline,
      funnelOutline
    });
  }

  ngOnInit() {
    this.setupSearchDebounce();
    this.loadDemandes();
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.applyFilters();
    });
  }

  private allDemandes: Demande[] = [];

  loadDemandes(event?: any) {
    this.loading = true;

    this.demandeService.getDemandes().subscribe({
      next: (response: any) => {
        this.allDemandes = response.content || response;
        this.updateCounts();
        this.applyFilters();
        this.loading = false;
        if (event) { event.target.complete(); }
      },
      error: (error: any) => {
        console.error('Error loading demandes:', error);
        this.loading = false;
        if (event) { event.target.complete(); }
      }
    });
  }

  private applyFilters() {
    const term = this.searchTerm.toLowerCase();
    const matchTerm = (d: Demande) =>
      !term ||
      (d as any).nomclient?.toLowerCase().includes(term) ||
      (d as any).orderNumber?.toLowerCase().includes(term) ||
      (d as any).client?.toLowerCase().includes(term);

    // Filter Drafts (NON_CONFIRME / BROUILLON)
    this.draftDemandes = this.allDemandes.filter(d => {
      const status = (d.statut || '').toString().trim().toUpperCase();
      return (status === 'NON_CONFIRME' || status === 'BROUILLON') && matchTerm(d);
    });

    // Filter Pending (NON_PLANIFIE — confirmed but not yet scheduled)
    this.pendingDemandes = this.allDemandes.filter(d => {
      const status = (d.statut || '').toString().trim().toUpperCase();
      return status === 'NON_PLANIFIE' && matchTerm(d);
    });

    // Filter Confirmed (everything else)
    this.confirmedDemandes = this.allDemandes.filter(d => {
      const status = (d.statut || '').toString().trim().toUpperCase();
      const isExcluded = status === 'NON_CONFIRME' || status === 'BROUILLON' || status === 'NON_PLANIFIE';
      return !isExcluded &&
        (!this.selectedStatut || status === this.selectedStatut.toUpperCase()) &&
        matchTerm(d);
    });

    this.demandes = this.listMode === 'draft' ? this.draftDemandes
      : this.listMode === 'pending' ? this.pendingDemandes
      : this.confirmedDemandes;
  }

  onSearch(event: any) {
    this.searchSubject.next(event.target.value);
  }

  onStatutChange(event: any) {
    this.selectedStatut = event.target.value;
    this.applyFilters();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedStatut = '';
    this.applyFilters();
  }

  private updateCounts() {
    this.draftCount = this.allDemandes.filter(d => {
      const s = (d.statut || '').toString().trim().toUpperCase();
      return s === 'NON_CONFIRME' || s === 'BROUILLON';
    }).length;
    this.pendingCount = this.allDemandes.filter(d => {
      return (d.statut || '').toString().trim().toUpperCase() === 'NON_PLANIFIE';
    }).length;
    this.confirmedCount = this.allDemandes.filter(d => {
      const s = (d.statut || '').toString().trim().toUpperCase();
      return s !== 'NON_CONFIRME' && s !== 'BROUILLON' && s !== 'NON_PLANIFIE';
    }).length;
  }

  setListMode(mode: 'confirmed' | 'draft' | 'pending') {
    if (this.listMode === mode) return;
    this.listMode = mode;
    this.isScrolling = true;

    if (!this.swipeContainer || !this.swipeContainer.nativeElement) return;
    const container = this.swipeContainer.nativeElement;
    const colIndex = mode === 'draft' ? 0 : mode === 'pending' ? 1 : 2;
    const scrollAmount = colIndex * container.offsetWidth;

    container.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });

    setTimeout(() => { this.isScrolling = false; }, 500);
  }

  onScroll(event: any) {
    if (this.isScrolling) return;

    const scrollLeft = event.target.scrollLeft;
    const width = event.target.offsetWidth;

    let newMode: 'draft' | 'pending' | 'confirmed';
    if (scrollLeft < width * 0.5) {
      newMode = 'draft';
    } else if (scrollLeft < width * 1.5) {
      newMode = 'pending';
    } else {
      newMode = 'confirmed';
    }

    if (this.listMode !== newMode) {
      this.listMode = newMode;
    }
  }

  onModeChange() {
    this.currentPage = 0;
    this.applyFilters(); // Filter locally for immediate feedback
  }

  getClientDisplay(d: Demande): string {
    return (d as any).client || d.chargementNom || 'Client Privé';
  }

  viewDetails(demande: Demande, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/demandes/details'], { queryParams: { id: demande.id } });
  }

  createNewDemande() {
    this.router.navigate(['/demandes/create']);
  }

  goToCreate() {
    this.createNewDemande();
  }

  refreshData(event: any) {
    this.currentPage = 0;
    this.loadDemandes(event);
  }

  loadMore(event: any) {
    // Pas de pagination backend — tout est déjà chargé côté client
    event.target.complete();
    event.target.disabled = true;
  }

  getStatusClass(statut: string): string {
    const classes: any = {
      'EN_ATTENTE': 'status-pending',
      'PLANIFIE': 'status-validated',
      'EN_COURS_DE_LIVRAISON': 'status-progress',
      'LIVRE': 'status-delivered',
      'NON_LIVRE': 'status-cancelled'
    };
    return classes[statut] || 'status-pending';
  }

  getStatusLabel(statut: string): string {
    const labels: any = {
      'NON_PLANIFIE': 'En attente',
      'PLANIFIE': 'Planifié',
      'EN_COURS_DE_CHARGEMENT': 'En chargement',
      'CHARGE': 'Chargé',
      'EN_COURS_DE_LIVRAISON': 'En livraison',
      'LIVRE': 'Livré',
      'NON_LIVRE': 'Non livré',
      'FIN': 'Terminé',
      'NON_CONFIRME': 'Brouillon'
    };
    return labels[statut] || statut;
  }

  /**
   * Returns true if the order is in a state where transport is active
   * (i.e. the commercial has planned it). EN_ATTENTE = confirmed by user
   * but not yet scheduled by the commercial → no tracking available.
   */
  isTrackable(statut: string): boolean {
    const trackableStatuses = [
      'PLANIFIE', 'CHARGE',
      'EN_COURS_DE_LIVRAISON', 'EN_LIVRAISON',
      'LIVRE', 'FIN', 'NON_LIVRE'
    ];
    return trackableStatuses.includes(statut);
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
  async confirmDemande(demande: Demande, event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Confirmation',
      message: `Voulez-vous confirmer l'ordre ${demande.id} ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Confirmer',
          handler: () => {
            this.demandeService.confirmerDemande(demande.id!).subscribe({
              next: () => {
                this.showToast('Ordre confirmé avec succès', 'success');
                this.currentPage = 0;
                this.loadDemandes();
              },
              error: () => this.showToast('Erreur lors de la confirmation', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteDemande(demande: Demande, event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Suppression',
      message: `Voulez-vous supprimer l'ordre ${demande.id} ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: () => {
            this.demandeService.deleteDemande(demande.id!).subscribe({
              next: () => {
                this.showToast('Ordre supprimé avec succès', 'success');
                this.currentPage = 0;
                this.loadDemandes();
              },
              error: () => this.showToast('Erreur lors de la suppression', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  duplicateDemande(demande: Demande, event: Event) {
    event.stopPropagation();
    this.demandeService.dupliquerDemande(demande.id!).subscribe({
      next: () => {
        this.showToast('Ordre dupliqué avec succès', 'success');
        this.currentPage = 0;
        this.loadDemandes();
      },
      error: () => this.showToast('Erreur lors de la duplication', 'danger')
    });
  }

  editDemande(demande: Demande, event: Event) {
    event.stopPropagation();
    // Navigate to create page with query param or id to populate form
    // Assuming create page can handle editing or we have an edit page
    this.router.navigate(['/demandes/create'], { queryParams: { id: demande.id, mode: 'edit' } });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  goToNotifications() {
    this.router.navigate(['/notifications']);
  }

  logout() {
    this.navCtrl.navigateRoot('/login');
  }

  toggleFilter() {
    // Placeholder: expand filter panel or show filter popover
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom',
      cssClass: 'premium-toast'
    });
    await toast.present();
  }
}


import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader,
  IonIcon,
  IonRefresher, IonRefresherContent,
  IonDatetime, IonInput
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  notificationsOutline, logOutOutline, chevronDownOutline,
  arrowBackOutline, carOutline, chevronForwardOutline,
  locationOutline, calendarOutline, addOutline,
  personOutline, checkmarkOutline, searchOutline,
  todayOutline, timeOutline, arrowForwardOutline,
  sunnyOutline, arrowDownOutline, cubeOutline
} from 'ionicons/icons';
import { LivraisonService, LivraisonSimple } from '../../../services/livraison.service';

/** The 5 delivery stages mapped to order statuses */
const STEPS = [
  { key: 'created', label: 'Créé', statuts: ['EN_ATTENTE', 'NON_CONFIRME'] },
  { key: 'charged', label: 'Chargé', statuts: ['PLANIFIE', 'CHARGE'] },
  { key: 'transit', label: 'En transit', statuts: ['EN_COURS_DE_LIVRAISON'] },
  { key: 'delivery', label: 'Livraison', statuts: ['EN_LIVRAISON'] },
  { key: 'done', label: 'Livré', statuts: ['LIVRE', 'FIN'] },
];

@Component({
  selector: 'app-list',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader,
    IonIcon,
    IonRefresher, IonRefresherContent,
    IonDatetime, IonInput,
    CommonModule, FormsModule
  ]
}) 
export class ListPage implements OnInit {
  livraisons: LivraisonSimple[] = [];
  isLoading = false;
  stats = { notifications: 0 };

  /** Active tab: today | date | history */
  activeTab: 'today' | 'date' | 'history' = 'today';

  /** Date selected in the date-picker tab (ISO string) */
  selectedDate: string = '';

  /** Search term for the history tab */
  searchTerm: string = '';

  /** Today's date string (YYYY-MM-DD) used as max for the date picker */
  todayStr: string = new Date().toISOString().split('T')[0];

  @ViewChild('swipeContainer', { static: false }) swipeContainer!: ElementRef;
  private isScrolling = false;

  constructor(
    private livraisonService: LivraisonService,
    private router: Router,
    public navCtrl: NavController
  ) {
    addIcons({
      notificationsOutline,
      logOutOutline,
      chevronDownOutline,
      arrowBackOutline, carOutline, chevronForwardOutline,
      locationOutline, calendarOutline, addOutline,
      personOutline, checkmarkOutline, searchOutline,
      todayOutline, timeOutline, arrowForwardOutline,
      sunnyOutline, arrowDownOutline, cubeOutline
    });
  }

  ngOnInit() {
    this.loadLivraisons();
  }

  loadLivraisons(event?: any) {
    this.isLoading = true;
    this.livraisonService.getLivraisons().subscribe({
      next: (res: any) => {
        this.livraisons = Array.isArray(res) ? res : (res.content || []);
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('Error loading livraisons', err);
        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  // ── Tab & filter logic ──────────────────────────

  getTabItems(tab: 'today' | 'date' | 'history'): LivraisonSimple[] {
    const trackableStatuses = ['PLANIFIE', 'CHARGE', 'EN_COURS_DE_LIVRAISON', 'EN_LIVRAISON', 'LIVRE', 'FIN', 'NON_LIVRE'];
    let result = this.livraisons.filter(liv => trackableStatuses.includes(liv.statut));

    if (tab === 'today') {
      result = result.filter(liv =>
        this.isToday(liv.chargementDate) || this.isToday(liv.livraisonDate)
      );
    } else if (tab === 'date') {
      if (!this.selectedDate) return [];
      const sel = this.selectedDate.split('T')[0];
      result = result.filter(liv =>
        this.isSameDay(liv.chargementDate, sel) || this.isSameDay(liv.livraisonDate, sel)
      );
    } else if (tab === 'history') {
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        result = result.filter(liv =>
          (liv.chargementVille || '').toLowerCase().includes(term) ||
          (liv.livraisonVille || '').toLowerCase().includes(term) ||
          ((liv as any).chauffeur || '').toLowerCase().includes(term) ||
          ((liv as any).camion || '').toLowerCase().includes(term) ||
          String(liv.id).includes(term)
        );
      }
    }

    return result;
  }

  setTab(tab: 'today' | 'date' | 'history') {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.isScrolling = true;

    if (!this.swipeContainer || !this.swipeContainer.nativeElement) return;
    const container = this.swipeContainer.nativeElement;
    let scrollAmount = 0;
    if (tab === 'date') scrollAmount = container.offsetWidth;
    if (tab === 'history') scrollAmount = container.offsetWidth * 2;

    container.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });

    setTimeout(() => {
      this.isScrolling = false;
      this.onTabChange();
    }, 500);
  }

  onScroll(event: any) {
    if (this.isScrolling) return;

    const scrollLeft = event.target.scrollLeft;
    const width = event.target.offsetWidth;

    let newTab: 'today' | 'date' | 'history' = 'today';
    if (scrollLeft > width * 1.5) {
      newTab = 'history';
    } else if (scrollLeft > width * 0.5) {
      newTab = 'date';
    }

    if (this.activeTab !== newTab) {
      this.activeTab = newTab;
      this.onTabChange();
    }
  }

  onTabChange() {
    // searchTerm reset filtered implicitly by getter
  }

  onDateChange() {
    // filteredLivraisons getter recomputes automatically
  }

  onSearch() {
    // filteredLivraisons getter recomputes automatically
  }

  // ── Today banner label ──────────────────

  getTodayLabel(): string {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  // ── Progress helpers ────────────────────

  /** Returns 0–100 progress based on status */
  getProgressPct(statut: string): number {
    const map: Record<string, number> = {
      NON_CONFIRME: 0,
      EN_ATTENTE: 10,
      PLANIFIE: 25,
      CHARGE: 45,
      EN_COURS_DE_LIVRAISON: 70,
      EN_LIVRAISON: 85,
      LIVRE: 100,
      FIN: 100,
      NON_LIVRE: 100
    };
    return map[statut] ?? 0;
  }

  /** Returns human-readable step label */
  getStepLabel(statut: string): string {
    const map: Record<string, string> = {
      NON_CONFIRME: 'Non confirmé',
      EN_ATTENTE: 'En attente de planification',
      PLANIFIE: 'Planifié',
      CHARGE: 'Chargement effectué',
      EN_COURS_DE_LIVRAISON: 'En cours de livraison',
      EN_LIVRAISON: 'Dernière étape',
      LIVRE: 'Livré ✓',
      FIN: 'Terminé ✓',
      NON_LIVRE: 'Non livré'
    };
    return map[statut] || statut;
  }

  // ── Date helpers ──────────────────────────

  isToday(date: string | Date | undefined): boolean {
    if (!date) return false;
    const d = new Date(date);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
  }

  isSameDay(date: string | Date | undefined, dayStr: string): boolean {
    if (!date) return false;
    return new Date(date).toISOString().split('T')[0] === dayStr;
  }

  // ── Navigation ──────────────────────────

  viewDetails(liv: LivraisonSimple) {
    this.router.navigate(['/livraisons/tracking'], { queryParams: { id: liv.id } });
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short'
    });
  }

  getStatusLabel(statut: string): string {
    const labels: Record<string, string> = {
      NON_CONFIRME: 'Brouillon',
      EN_ATTENTE: 'En attente',
      PLANIFIE: 'Planifié',
      CHARGE: 'Chargé',
      EN_COURS_DE_LIVRAISON: 'En livraison',
      EN_LIVRAISON: 'En livraison',
      LIVRE: 'Livré',
      FIN: 'Terminé',
      NON_LIVRE: 'Non livré'
    };
    return labels[statut] || statut;
  }

  getStatusKey(statut: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'pending',
      NON_CONFIRME: 'pending',
      PLANIFIE: 'ready',
      CHARGE: 'ready',
      EN_COURS_DE_LIVRAISON: 'transit',
      EN_LIVRAISON: 'delivery',
      LIVRE: 'done',
      FIN: 'done',
      NON_LIVRE: 'failed'
    };
    return map[statut] || 'pending';
  }

  /**
   * Returns the 5 steps with done / active flags based on current statut.
   */
  getSteps(statut: string): { label: string; done: boolean; active: boolean }[] {
    let activeIdx = 0;
    for (let i = 0; i < STEPS.length; i++) {
      if (STEPS[i].statuts.includes(statut)) {
        activeIdx = i;
        break;
      }
    }
    return STEPS.map((s, i) => ({
      label: s.label,
      done: i < activeIdx,
      active: i === activeIdx
    }));
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
}


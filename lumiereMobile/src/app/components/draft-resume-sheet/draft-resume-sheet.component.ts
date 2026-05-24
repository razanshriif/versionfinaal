import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  closeOutline,
  documentTextOutline,
  locationOutline,
} from 'ionicons/icons';
import { Demande } from '../../models/demande.model';

@Component({
  selector: 'app-draft-resume-sheet',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './draft-resume-sheet.component.html',
  styleUrls: ['./draft-resume-sheet.component.scss'],
})
export class DraftResumeSheetComponent {
  @Input() isOpen = false;
  @Input() draft: Demande | null = null;
  @Input() draftCount = 1;

  @Output() closed = new EventEmitter<void>();
  @Output() ignored = new EventEmitter<void>();
  @Output() continued = new EventEmitter<void>();

  constructor() {
    addIcons({ documentTextOutline, locationOutline, arrowForwardOutline, closeOutline });
  }

  get reference(): string {
    if (!this.draft) {
      return '';
    }
    return this.draft.orderNumber || `#${this.draft.id}`;
  }

  get clientLabel(): string {
    return this.draft?.nomclient || this.draft?.client || 'Votre commande';
  }

  get routeLabel(): string {
    const from = this.draft?.chargementVille?.trim();
    const to = this.draft?.livraisonVille?.trim();
    if (from && to) {
      return `${from} → ${to}`;
    }
    return to || from || 'Itinéraire à compléter';
  }

  get savedDateLabel(): string {
    const raw = this.draft?.dateSaisie;
    if (!raw) {
      return '';
    }
    return new Date(raw).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  get message(): string {
    if (this.draftCount > 1) {
      return `Vous avez ${this.draftCount} brouillons. Reprenez le plus récent pour terminer votre demande.`;
    }
    return 'Votre demande est enregistrée en brouillon. Souhaitez-vous la reprendre maintenant ?';
  }

  onBackdropClick(): void {
    this.ignored.emit();
  }

  onIgnore(): void {
    this.ignored.emit();
  }

  onContinue(): void {
    this.continued.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}

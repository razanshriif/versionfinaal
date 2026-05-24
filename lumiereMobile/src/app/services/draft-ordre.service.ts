import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, map } from 'rxjs';
import { DemandeService } from './demande.service';
import { Ordre } from '../models/ordre.model';
import { Demande } from '../models/demande.model';

export interface DraftCommentOptions {
  typeVoyage: string;
  typeCamion: string;
  typeSemi: string;
  commentaireLibre: string;
}

export const DRAFT_RESUME_CHECK_KEY = 'check_draft_resume';
export const DRAFT_RESUME_IGNORED_KEY = 'draft_resume_ignored';

@Injectable({
  providedIn: 'root'
})
export class DraftOrdreService {

  constructor(
    private demandeService: DemandeService,
    private router: Router
  ) {}

  /** Set after successful login so home can prompt once. */
  markCheckDraftOnNextHome(): void {
    sessionStorage.removeItem(DRAFT_RESUME_IGNORED_KEY);
    sessionStorage.setItem(DRAFT_RESUME_CHECK_KEY, 'true');
  }

  shouldCheckDraftResume(): boolean {
    return sessionStorage.getItem(DRAFT_RESUME_CHECK_KEY) === 'true'
      && sessionStorage.getItem(DRAFT_RESUME_IGNORED_KEY) !== 'true';
  }

  clearDraftResumeCheck(): void {
    sessionStorage.removeItem(DRAFT_RESUME_CHECK_KEY);
  }

  ignoreDraftResumeForSession(): void {
    sessionStorage.setItem(DRAFT_RESUME_IGNORED_KEY, 'true');
    this.clearDraftResumeCheck();
  }

  fetchPendingDrafts(): Observable<Demande[]> {
    return this.demandeService.getDemandes().pipe(
      map((list) => {
        const data = Array.isArray(list) ? list : [];
        return data
          .filter((d) => {
            const s = (d.statut || '').toUpperCase();
            return s === 'NON_CONFIRME' || s === 'BROUILLON';
          })
          .sort((a, b) => {
            const da = new Date(a.dateSaisie || 0).getTime();
            const db = new Date(b.dateSaisie || 0).getTime();
            return db - da;
          });
      })
    );
  }

  /** Required fields before "Valider la commande" (still saved as brouillon until admin confirms). */
  isOrdreCompleteForSubmit(ordre: Ordre, options: DraftCommentOptions): boolean {
    if (!ordre.client?.trim()) {
      return false;
    }
    if (!ordre.chargementNom?.trim() || !ordre.chargementDate) {
      return false;
    }
    if (!ordre.livraisonNom?.trim() || !ordre.livraisonVille?.trim() || !ordre.livraisonDate) {
      return false;
    }
    if (!ordre.codeArticle?.trim()) {
      return false;
    }
    const poids = Number(ordre.poids) || 0;
    if (poids <= 0) {
      return false;
    }
    if (!options.typeVoyage?.trim()) {
      return false;
    }
    return true;
  }

  getIncompleteSubmitMessage(ordre: Ordre, options: DraftCommentOptions): string {
    if (!ordre.client?.trim()) {
      return 'Renseignez le compte client.';
    }
    if (!ordre.chargementNom?.trim() || !ordre.chargementDate) {
      return 'Renseignez le point et la date de chargement.';
    }
    if (!ordre.livraisonNom?.trim() || !ordre.livraisonVille?.trim() || !ordre.livraisonDate) {
      return 'Renseignez le point et la date de livraison.';
    }
    if (!ordre.codeArticle?.trim()) {
      return 'Sélectionnez un article.';
    }
    if ((Number(ordre.poids) || 0) <= 0) {
      return 'Indiquez un poids supérieur à 0.';
    }
    if (!options.typeVoyage?.trim()) {
      return 'Choisissez le type de voyage.';
    }
    return 'Complétez tous les champs obligatoires.';
  }

  hasMeaningfulDraftData(ordre: Ordre, options: DraftCommentOptions): boolean {
    // Ignore profile auto-fill on chargement — user must have started livraison/article/qty
    const hasDelivery =
      !!(ordre.livraisonNom?.trim() && ordre.livraisonVille?.trim());
    const hasArticle = !!(ordre.codeArticle?.trim() || ordre.designation?.trim());
    const hasQuantities =
      (Number(ordre.poids) || 0) > 0 ||
      (Number(ordre.volume) || 0) > 0 ||
      (Number(ordre.nombrePalettes) || 0) > 0 ||
      (Number(ordre.nombreColis) || 0) > 0 ||
      (Number(ordre.longueur) || 0) > 0;
    const hasComments =
      !!(options.typeVoyage || options.typeCamion || options.typeSemi || options.commentaireLibre?.trim());

    return hasDelivery || hasArticle || hasQuantities || hasComments;
  }

  buildCommentaireFinal(options: DraftCommentOptions): string {
    const parts: string[] = [];
    if (options.typeVoyage) {
      parts.push(options.typeVoyage);
    }
    if (options.typeCamion) {
      parts.push(options.typeCamion);
      if (
        (options.typeCamion === 'Semi' || options.typeCamion === 'Cargo') &&
        options.typeSemi
      ) {
        parts.push(`(${options.typeSemi})`);
      }
    }
    if (options.commentaireLibre?.trim()) {
      parts.push(options.commentaireLibre.trim());
    }
    return parts.join(', ');
  }

  buildDraftPayload(ordre: Ordre, options: DraftCommentOptions): Record<string, unknown> {
    const commentaireFinal = this.buildCommentaireFinal(options);
    const commentaires =
      commentaireFinal.length > 0 ? [commentaireFinal] : null;

    const { id, orderNumber, dateSaisie, statut, ...cleanPayload } = ordre as Ordre & {
      id?: number;
      orderNumber?: string;
      dateSaisie?: string;
      statut?: string;
    };

    return {
      ...cleanPayload,
      poids: Number(cleanPayload.poids || 0),
      volume: Number(cleanPayload.volume || 0),
      longueur: Number(cleanPayload.longueur || 0),
      nombreColis: Number(cleanPayload.nombreColis || 0),
      nombrePalettes: Number(cleanPayload.nombrePalettes || 0),
      commentaires,
      statut: 'NON_CONFIRME'
    };
  }

  async saveDraft(
    ordre: Ordre,
    options: DraftCommentOptions,
    existingId?: number
  ): Promise<number | null> {
    if (!this.hasMeaningfulDraftData(ordre, options)) {
      return null;
    }

    const payload = this.buildDraftPayload(ordre, options);

    if (existingId) {
      await firstValueFrom(
        this.demandeService.updateDemande(existingId, payload as Partial<Demande>)
      );
      return existingId;
    }

    const created = await firstValueFrom(
      this.demandeService.createDemande(payload as import('../models/demande.model').CreateDemandeRequest)
    );
    return created.id ?? null;
  }

  openDraftForEdit(draftId: number): void {
    this.router.navigate(['/demandes/create'], {
      queryParams: { id: draftId, mode: 'edit' },
    });
  }

  applyDraftToForm(ordre: Ordre, data: Demande): Ordre {
    return {
      ...ordre,
      ...data,
      nombrePalettes: data.nombrePalettes ?? ordre.nombrePalettes,
      nombreColis: data.nombreColis ?? ordre.nombreColis,
      commentaires: data.commentaires ?? []
    };
  }

  parseCommentOptions(commentaires?: string[] | null): DraftCommentOptions {
    const options: DraftCommentOptions = {
      typeVoyage: '',
      typeCamion: '',
      typeSemi: '',
      commentaireLibre: ''
    };
    if (!commentaires?.length) {
      return options;
    }
    const text = commentaires.join(', ');
    options.commentaireLibre = text;
    return options;
  }
}

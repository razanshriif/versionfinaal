// src/app/services/demande.service.ts
// Adapté pour fonctionner avec le backend Otflow réel

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Demande, CreateDemandeRequest, DemandeStatut } from '../models/demande.model';
import { environment } from '../../environments/environment';

export interface DemandeFilter {
  statut?: DemandeStatut;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DemandeService {
  // Les demandes sont stockées comme des "Ordres" dans le backend
  private readonly API_URL = `${environment.apiUrl}/v1/ordres`;

  constructor(private http: HttpClient) { }

  private authHeaders() {
    return {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    };
  }

  /**
   * Obtenir toutes les demandes (ordres)
   */
  getDemandes(filter?: DemandeFilter): Observable<Demande[]> {
    return this.http.get<Demande[]>(this.API_URL, this.authHeaders());
  }

  /**
   * Obtenir une demande par ID
   */
  getDemandeById(id: number): Observable<Demande> {
    return this.http.get<Demande>(`${this.API_URL}/${id}`, this.authHeaders());
  }

  /**
   * Créer une nouvelle demande
   */
  createDemande(demande: CreateDemandeRequest): Observable<Demande> {
    return this.http.post<Demande>(this.API_URL, demande, this.authHeaders());
  }

  /**
   * Mettre à jour une demande
   */
  updateDemande(id: number, demande: Partial<Demande>): Observable<Demande> {
    return this.http.put<Demande>(`${this.API_URL}/${id}`, demande, this.authHeaders());
  }

  /**
   * Annuler une demande
   */
  annulerDemande(id: number, motif?: string): Observable<Demande> {
    return this.http.post<Demande>(`${this.API_URL}/${id}/annuler`, { motif }, this.authHeaders());
  }

  /**
   * Confirmer une demande
   */
  confirmerDemande(id: number): Observable<Demande> {
    return this.http.put<Demande>(`${this.API_URL}/${id}/confirmer`, {}, this.authHeaders());
  }

  /**
   * Dupliquer une demande
   */
  dupliquerDemande(id: number): Observable<Demande> {
    return this.http.post<Demande>(`${this.API_URL}/${id}/dupliquer`, {}, this.authHeaders());
  }

  /**
   * Obtenir l'historique d'une demande (commentaires)
   */
  getHistorique(id: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/${id}/historique`, this.authHeaders());
  }

  /**
   * Obtenir les statistiques des demandes
   */
  getStatistiques(): Observable<any> {
    return this.http.get(`${this.API_URL}/statistiques`, this.authHeaders());
  }

  /**
   * Supprimer une demande
   */
  deleteDemande(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, this.authHeaders());
  }
}


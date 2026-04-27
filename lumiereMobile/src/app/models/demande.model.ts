// src/app/models/demande.model.ts
// Updated to match backend Ordre entity

export interface Demande {
  id: number;
  orderNumber?: string;
  client: string;
  nomclient: string;
  siteclient: string;
  idedi: string;
  codeclientcharg: string;
  chargementNom: string;
  chargementAdr1: string;
  chargementAdr2?: string;
  chargementVille: string;
  chargementDate: string | Date;
  codeclientliv: string;
  livraisonNom: string;
  livraisonAdr1: string;
  livraisonAdr2?: string;
  codepostalliv: string;
  livraisonVille: string;
  livraisonDate: string | Date;
  codeArticle: string;
  designation: string;
  poids: number;
  volume: number;
  nombrePalettes: number;
  nombreColis: number;
  longueur: number;
  dateSaisie: string | Date;
  statut: string;
  matricule?: string;
  voycle?: string;
  chauffeur?: string;
  telchauffeur?: string;
  camion?: string;
  datevoy?: string;
  commentaires?: string[];
}

export enum DemandeStatut {
  NON_CONFIRME = 'NON_CONFIRME',
  NON_PLANIFIE = 'NON_PLANIFIE',
  PLANIFIE = 'PLANIFIE',
  EN_COURS_DE_CHARGEMENT = 'EN_COURS_DE_CHARGEMENT',
  CHARGE = 'CHARGE',
  EN_COURS_DE_LIVRAISON = 'EN_COURS_DE_LIVRAISON',
  LIVRE = 'LIVRE',
  FIN = 'FIN',
  NON_LIVRE = 'NON_LIVRE',
  EN_ATTENTE = 'EN_ATTENTE'
}

export interface CreateDemandeRequest extends Partial<Demande> {
  // Add any specific fields for creation if different
}


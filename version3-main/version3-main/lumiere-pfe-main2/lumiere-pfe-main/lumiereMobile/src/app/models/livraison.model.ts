// src/app/models/livraison.model.ts

export interface Livraison {
  id: number;
  demandeId: number;
  camionId: number;
  chauffeurId: number;
  numeroSuivi: string;
  statut: LivraisonStatut;
  dateDepart?: Date;
  dateArriveeEstimee?: Date;
  dateArriveeReelle?: Date;
  destinationVille?: string;
  dateLivraisonPrevue?: string | Date;

  // Position actuelle
  positionActuelle?: Position;

  // Trajet
  itineraire: Position[];
  distanceTotale: number;
  distanceParcourue: number;

  // Incidents
  incidents?: Incident[];

  // Informations camion
  camion?: Camion;
  chauffeur?: Chauffeur;

  // Timeline
  timeline: TimelineEvent[];
}

export enum LivraisonStatut {
  PLANIFIEE = 'PLANIFIEE',
  EN_PREPARATION = 'EN_PREPARATION',
  EN_ROUTE = 'EN_ROUTE',
  ENLEVEMENT_EFFECTUE = 'ENLEVEMENT_EFFECTUE',
  EN_TRANSIT = 'EN_TRANSIT',
  EN_LIVRAISON = 'EN_LIVRAISON',
  LIVREE = 'LIVREE',
  INCIDENT = 'INCIDENT',
  ANNULEE = 'ANNULEE'
}

export interface Position {
  latitude: number;
  longitude: number;
  timestamp: Date;
  altitude?: number;
  vitesse?: number;
  cap?: number;
}

export interface Incident {
  id: number;
  type: IncidentType;
  description: string;
  dateDebut: Date;
  dateFin?: Date;
  severite: Severite;
  position?: Position;
  resolu: boolean;
}

export enum IncidentType {
  RETARD = 'RETARD',
  PANNE = 'PANNE',
  ACCIDENT = 'ACCIDENT',
  TRAFIC = 'TRAFIC',
  METEO = 'METEO',
  DOUANE = 'DOUANE',
  AUTRE = 'AUTRE'
}

export enum Severite {
  FAIBLE = 'FAIBLE',
  MOYENNE = 'MOYENNE',
  ELEVEE = 'ELEVEE',
  CRITIQUE = 'CRITIQUE'
}

export interface Camion {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  capacite: number;
  type: TypeCamion;
  statut: CamionStatut;
}

export enum TypeCamion {
  FOURGON = 'FOURGON',
  PORTEUR = 'PORTEUR',
  SEMI_REMORQUE = 'SEMI_REMORQUE',
  FRIGORIFIQUE = 'FRIGORIFIQUE'
}

export enum CamionStatut {
  DISPONIBLE = 'DISPONIBLE',
  EN_MISSION = 'EN_MISSION',
  EN_MAINTENANCE = 'EN_MAINTENANCE',
  HORS_SERVICE = 'HORS_SERVICE'
}

export interface Chauffeur {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  permis: string;
}

export interface TimelineEvent {
  id: number;
  timestamp: Date;
  type: EventType;
  description: string;
  position?: Position;
}

export enum EventType {
  CREATION = 'CREATION',
  DEPART = 'DEPART',
  ENLEVEMENT = 'ENLEVEMENT',
  CHECKPOINT = 'CHECKPOINT',
  INCIDENT = 'INCIDENT',
  LIVRAISON = 'LIVRAISON',
  CLOTURE = 'CLOTURE'
}


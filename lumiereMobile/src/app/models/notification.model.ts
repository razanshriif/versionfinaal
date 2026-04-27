// src/app/models/notification.model.ts
// Adapté pour correspondre à l'entité backend Notification

export interface Notification {
  id: number;
  type: string;        // type de notification (ex: 'INFO', 'COMMANDE', etc.)
  message: string;     // contenu de la notification
  read: boolean;       // isRead dans le backend (mappé par Jackson)
  timestamp: string | Date; // date de création
}

export enum NotificationType {
  INFO = 'INFO',
  DEMANDE = 'DEMANDE',
  LIVRAISON = 'LIVRAISON',
  INCIDENT = 'INCIDENT',
  SYSTEME = 'SYSTEME',
  TEST = 'TEST'
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}


import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', loadComponent: () => import('./pages/auth/login/login.page').then(m => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/auth/register/register.page').then(m => m.RegisterPage) },
  { path: 'pending', loadComponent: () => import('./pages/auth/pending/pending.page').then(m => m.PendingPage) },
  { path: 'orders/non-planned', redirectTo: '/demandes/create', pathMatch: 'full' },
  // Aliases to avoid NG04002 (unknown URL segments)
  { path: 'nouvelle-demande', redirectTo: '/demandes/create', pathMatch: 'full' },
  { path: 'mes-commandes', redirectTo: '/demandes/list', pathMatch: 'full' },
  { path: 'suivi', redirectTo: '/livraisons/tracking', pathMatch: 'full' },
  { path: 'profil', redirectTo: '/profile', pathMatch: 'full' },
  { path: 'tabs/clients', redirectTo: '/clients', pathMatch: 'full' },

  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
    canActivate: [AuthGuard]
  },
  // Demandes (Flattened)
  { path: 'demandes', redirectTo: '/demandes/list', pathMatch: 'full' },
  {
    path: 'demandes/list',
    loadComponent: () => import('./pages/demandes/list/list.page').then(m => m.ListPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'demandes/details',
    loadComponent: () => import('./pages/demandes/details/details.page').then(m => m.DetailsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'demandes/create',
    loadComponent: () => import('./pages/demandes/create/create.page').then(m => m.CreatePage),
    canActivate: [AuthGuard]
  },

  // Livraisons (Flattened)
  { path: 'livraisons', redirectTo: '/livraisons/list', pathMatch: 'full' },
  {
    path: 'livraisons/list',
    loadComponent: () => import('./pages/livraisons/list/list.page').then(m => m.ListPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'livraisons/tracking',
    loadComponent: () => import('./pages/livraisons/tracking/tracking.page').then(m => m.TrackingPage),
    canActivate: [AuthGuard]
  },

  // Clients (Flattened - specific paths FIRST)
  {
    path: 'clients/create',
    loadComponent: () => import('./pages/clients/client-form/client-form').then(m => m.ClientForm),
    canActivate: [AuthGuard]
  },
  {
    path: 'clients/edit/:id',
    loadComponent: () => import('./pages/clients/client-form/client-form').then(m => m.ClientForm),
    canActivate: [AuthGuard]
  },
  {
    path: 'clients',
    loadComponent: () => import('./pages/clients/clients').then(m => m.Clients),
    canActivate: [AuthGuard]
  },


  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
    canActivate: [AuthGuard]
  },

  // Routes outside tabs (already root, unified guard style)
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications.page').then(m => m.NotificationsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'chatbot',
    loadComponent: () => import('./pages/chatbot/chatbot.page').then(m => m.ChatbotPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'map',
    loadComponent: () => import('./pages/map/map.page').then(m => m.MapPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'rappel',
    loadComponent: () => import('./pages/rappel/rappel.page').then(m => m.RappelPage),
    canActivate: [AuthGuard]
  },
];


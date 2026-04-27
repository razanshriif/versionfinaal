import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { NavController, ViewDidEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, notificationsOutline, logOutOutline, busOutline, analyticsOutline, locationOutline, businessOutline } from 'ionicons/icons';
import { ActivatedRoute } from '@angular/router';
import { LivraisonService, LivraisonSimple } from '../../services/livraison.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonIcon, IonSpinner, CommonModule, FormsModule, HttpClientModule]
})
export class MapPage implements OnInit, OnDestroy, ViewDidEnter {
  selectedLivraison: LivraisonSimple | null = null;
  map: any = null;
  isLoading = false;
  isExpanded = false; // Toggle for bottom sheet expansion
  private timeouts: any[] = [];

  constructor(
    public navCtrl: NavController,
    private route: ActivatedRoute,
    private livraisonService: LivraisonService,
    private http: HttpClient
  ) {
    addIcons({ arrowBackOutline, notificationsOutline, logOutOutline, busOutline, analyticsOutline, locationOutline, businessOutline });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = params['livraisonId'];
      if (id) {
        this.loadLivraison(+id);
      }
    });
  }

  ngOnDestroy() {
    this.timeouts.forEach(t => clearTimeout(t));
    if (this.map) {
      this.map.remove();
    }
  }

  ionViewDidEnter() {
    if (this.selectedLivraison) {
      this.initMap(this.selectedLivraison);
    }
  }

  loadLivraison(id: number) {
    this.isLoading = true;
    this.livraisonService.getLivraisonById(id).subscribe({
      next: (livraison: LivraisonSimple) => {
        this.selectedLivraison = livraison;
        // Si on est déjà dans la vue, on init, sinon ionViewDidEnter s'en chargera
        if (this.map) {
          this.initMap(livraison);
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement livraison pour la carte:', err);
        this.isLoading = false;
      }
    });
  }

  initMap(livraison: LivraisonSimple) {
    // Wait for the container to be ready
    setTimeout(() => {
      if (this.map) {
        this.map.remove();
      }

      // 1. Initialiser la carte centrée sur la Tunisie par défaut
      this.map = L.map('osm-map', {
        zoomControl: false, // On le placera manuellement si besoin
        attributionControl: false
      }).setView([33.8869, 9.5375], 6);

      // 2. Ajouter les tuiles OpenStreetMap (Exactement comme sur le Web)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(this.map);

      // 4. Force invalidateSize to fix the "gray area" or small map bug
      const t1 = setTimeout(() => {
        if (!this.map) return;
        this.map.invalidateSize();
        
        // Force it again multiple times to be sure
        const t2 = setTimeout(() => this.map?.invalidateSize(), 200);
        const t3 = setTimeout(() => this.map?.invalidateSize(), 500);
        const t4 = setTimeout(() => this.map?.invalidateSize(), 1000);
        const t5 = setTimeout(() => this.map?.invalidateSize(), 2000);
        this.timeouts.push(t2, t3, t4, t5);
      }, 300);
      this.timeouts.push(t1);

      // 3. Géocoder et tracer la route
      this.geocodeAndPlot(livraison);
    }, 100);
  }

  geocodeAndPlot(livraison: LivraisonSimple) {
    const sourceCity = livraison.chargementVille || '';
    const destCity = livraison.livraisonVille || '';
    if (!sourceCity || !destCity) return;

    const urlBase = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=';
    
    // Geocode Source
    this.http.get<any[]>(urlBase + encodeURIComponent(sourceCity + ', Tunisia')).subscribe(res1 => {
        let lat1 = 36.8065, lon1 = 10.1815; // default Tunis
        if(res1 && res1.length > 0) {
            lat1 = parseFloat(res1[0].lat);
            lon1 = parseFloat(res1[0].lon);
        }

        // Marker Départ (Green)
        L.marker([lat1, lon1], {
            icon: L.divIcon({
              className: 'custom-map-icon',
              html: `<div class="marker-pin start"><ion-icon name="business-outline"></ion-icon></div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })
        }).addTo(this.map).bindPopup('Départ: ' + sourceCity);

        // Geocode Destination
        this.http.get<any[]>(urlBase + encodeURIComponent(destCity + ', Tunisia')).subscribe(res2 => {
            let lat2 = 34.7398, lon2 = 10.7600; // default Sfax
            if(res2 && res2.length > 0) {
                lat2 = parseFloat(res2[0].lat);
                lon2 = parseFloat(res2[0].lon);
            }

            // Marker Destination (Red)
            L.marker([lat2, lon2], {
                icon: L.divIcon({
                  className: 'custom-map-icon',
                  html: `<div class="marker-pin end"><ion-icon name="location-outline"></ion-icon></div>`,
                  iconSize: [30, 30],
                  iconAnchor: [15, 15]
                })
            }).addTo(this.map).bindPopup('Destination: ' + destCity);

            // Draw connecting path (Glowing effect)
            const latlngs: L.LatLngTuple[] = [ [lat1, lon1], [lat2, lon2] ];
            
            // Path Shadow
            L.polyline(latlngs, {
                color: '#3b82f6',
                weight: 8,
                opacity: 0.15,
                lineCap: 'round'
            }).addTo(this.map);

            // Path Main
            const polyline = L.polyline(latlngs, {
                color: '#3b82f6', 
                weight: 4, 
                dashArray: '10, 15',
                lineCap: 'round'
            }).addTo(this.map);
            
            // Adjust bounds
            this.map.fitBounds(polyline.getBounds(), { padding: [100, 100] });

            this.plotTruck(livraison, lat1, lon1, lat2, lon2);
        });
    });
  }

  plotTruck(livraison: any, lat1: number, lon1: number, lat2: number, lon2: number) {
    const statut = livraison.statut;
    
    let truckLat = 0;
    let truckLon = 0;
    let gpsActif = false;

    // 1. Priorité : Coordonnées GPS réelles (si disponibles via API)
    if (livraison.currentLat && livraison.currentLon) {
        truckLat = livraison.currentLat;
        truckLon = livraison.currentLon;
        gpsActif = true;
    } else {
        // 2. Mode Simulation (basé sur le statut comme sur le Web)
        let ratio = 0.5;
        if (['NON_PLANIFIE', 'PLANIFIE'].includes(statut)) ratio = 0.0;
        else if (['EN_COURS_DE_CHARGEMENT', 'CHARGE'].includes(statut)) ratio = 0.1;
        else if (['LIVRE', 'Fin'].includes(statut)) ratio = 1.0;
        
        truckLat = lat1 + (lat2 - lat1) * ratio;
        truckLon = lon1 + (lon2 - lon1) * ratio;
    }

    const color = gpsActif ? '#10b981' : '#f5921e';

    L.marker([truckLat, truckLon], {
        icon: L.divIcon({
           className: 'custom-map-icon',
           html: `<div class="truck-marker" style="background-color:${color}"><ion-icon name="bus-outline"></ion-icon></div>`,
           iconSize: [48, 48],
           iconAnchor: [24, 24]
        })
    }).addTo(this.map).bindPopup(`<b>Transporteur</b><br>${livraison.chauffeur || 'En route'}`);

    // Follow truck if GPS is active or it's the first plot
    if (gpsActif) {
        this.map.panTo([truckLat, truckLon], { animate: true });
    }
  }

  getStatusKey(statut: string): string {
    const map: Record<string, string> = {
      NON_CONFIRME: 'pending',
      NON_PLANIFIE: 'pending',
      EN_ATTENTE: 'pending',
      PLANIFIE: 'ready',
      CHARGE: 'ready',
      EN_COURS_DE_LIVRAISON: 'transit',
      EN_LIVRAISON: 'transit',
      LIVRE: 'done',
      FIN: 'done'
    };
    return map[statut] || 'pending';
  }

  getStatusLabel(statut: string): string {
    const labels: any = {
      'NON_PLANIFIE': 'En attente',
      'PLANIFIE': 'Planifié',
      'EN_COURS_DE_LIVRAISON': 'En livraison',
      'LIVRE': 'Livré',
      'FIN': 'Terminé'
    };
    return labels[statut] || statut;
  }

  goToNotifications() {
    this.navCtrl.navigateForward('/notifications');
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  replotRoute() {
    if (this.selectedLivraison && this.map) {
      this.geocodeAndPlot(this.selectedLivraison);
    }
  }

  logout() {
    this.navCtrl.navigateRoot('/login');
  }
}


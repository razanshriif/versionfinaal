import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { OrdreService } from '../ordre.service';
import { NotificationService } from '../notification.service';
import { Observable } from 'rxjs';
import * as L from 'leaflet';


@Component({
  selector: 'app-ordre',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NgbModule
  ],
  templateUrl: './ordre.component.html',
  styleUrls: ['./ordre.component.css']
})
export class OrdreComponent implements OnInit {
  isModalOpen = false;
  isMapModalOpen = false;
  selectedOrdreForMap: any = null;
  map: any = null;
  truckMarker: any = null;
  trailPolyline: any = null;
  // reference points to avoid disappearing during refresh
  refCoords = { lat1: 0, lon1: 0, lat2: 0, lon2: 0 };
  simulationLine: any = null;
  routeGlow: any = null;
  routeTraveledLayer: any = null;
  routeRemainingLayer: any = null;
  routeTraveledGlow: any = null;
  routeRemainingGlow: any = null;
  totalDistance: string = '--';
  private refreshInterval: any;

  // Animation Properties
  private animationFrameId: any = null;
  private routeCoords: L.LatLngTuple[] = [];
  private cumulativeDistances: number[] = [];
  private totalRouteLength = 0;
  private currentSimDistance = 0;
  public isSimulationActive = false;

  // Live GPS Transition
  private lastKnownCoords: L.LatLngTuple | null = null;
  private targetGpsCoords: L.LatLngTuple | null = null;
  private gpsInterpolationT = 0;

  dateDebut: string = this.getTodayDate();
  dateFin: string = this.getTodayDate();
  filtreClient: any;
  filtreSite: string = '';
  filtreStatut: string = "";
  filtreChauffeur: string = "";
  filtreDestination: string = "";
  filtreSource: string = "";
  statutOptions: string[] = ["PLANIFIE", "NON_PLANIFIE", "EN_COURS_DE_CHARGEMENT", "CHARGE", "EN_COURS_DE_LIVRAISON", "LIVRE"];
  siteOptions: string[] = [
    'BAR', 'SAL', 'BKS', 'SFX', 'TUN',
    'GAB', 'GAS', 'BSL', 'JER', 'BIZ', 'NAS'
  ];

  email = {
    to: "",
    subject: "",
    body: ""
  };

  sms = {
    mobile: '',
    message: ''
  };
  ordresFiltres: any[] = [];
  ordres: any[] = [];
  ordresPlanifies: any[] = [];
  // Define statutMap as a class property
  statutMap: { [key: string]: number } = {
    'PLANIFIE': 0,
    'Départ': 0,
    'Chargement': 1,
    'Chargé': 2,
    'Livraison': 3,
    'Livré': 4,
    'Fin': 5
  };
  eventCount: number = 0;

  constructor(
    private modalService: NgbModal, 
    private service: OrdreService, 
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Initial fetch
    this.filtrerParDate();
    
    // Set up periodic refresh (every 30 seconds)
    this.refreshInterval = setInterval(() => {
      this.filtrerParDate();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.stopAnimation();
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal(event?: MouseEvent) {
    this.isModalOpen = false;
  }

  detail(ordre: any) {
    this.service.detail = ordre;
    this.router.navigate(['/material/ordredetail']);
  }

  onSubmit() {
    this.service.sendEmail(this.email).subscribe(
      response => {
        this.notificationService.showSuccess('Email envoyé avec succès');
      },
      error => {
        this.notificationService.showError('Erreur lors de l\'envoi de l\'email');
      }
    );
    this.closeModal();
  }

  getEmail(clientId: number): void {
    console.log('get email')
    this.service.getEmail(clientId).subscribe(
      response => {
        this.email.to = response;
      },
      error => {
        this.notificationService.showError('Erreur lors de la récupération de l\'email');
      }
    );
  }

  getTelephone(clientId: number): Observable<string> {
    return this.service.gettelephone(clientId);
  }

  sendSms(clientId: number, ordre: any) {
    this.getTelephone(clientId).subscribe(
      (telephone: string) => {
        this.sms.mobile = telephone;
        this.sms.message = `Bonjour, votre voyage est : ${ordre.statut}`;

        this.service.sendSms(this.sms.mobile, this.sms.message).subscribe(
          response => {
            this.notificationService.showSuccess('SMS envoyé avec succès');
          },
          error => {
            this.notificationService.showError("Erreur lors de l'envoi du SMS");
          }
        );
      },
      error => {
        console.error("Erreur lors de la récupération du téléphone", error);
      }
    );
  }


  afficher() {
    this.service.afficher().subscribe(ordres => {
      this.ordres = ordres;
      this.ordresFiltres = this.ordres;
      this.sortEvents();
      this.cdr.detectChanges();
    });
  }

  public isFollowingTruck = true;
  public isTimelineCollapsed = false;

  toggleTimeline() {
    this.isTimelineCollapsed = !this.isTimelineCollapsed;
  }

  hasEvent(step: string): boolean {
    if (!this.selectedOrdreForMap) return false;
    const statut = this.selectedOrdreForMap.statut;
    const allSteps = ['NON_PLANIFIE', 'PLANIFIE', 'EN_COURS_DE_CHARGEMENT', 'CHARGE', 'EN_COURS_DE_LIVRAISON', 'EN_LIVRAISON', 'LIVRE', 'FIN'];
    let currentNorm = statut;
    if (statut === 'EN_LIVRAISON') currentNorm = 'EN_COURS_DE_LIVRAISON';
    if (statut === 'FIN') currentNorm = 'LIVRE';
    let stepNorm = step;
    if (step === 'EN_LIVRAISON') stepNorm = 'EN_COURS_DE_LIVRAISON';
    if (step === 'FIN') stepNorm = 'LIVRE';
    const currentIndex = allSteps.indexOf(currentNorm);
    const targetIndex = allSteps.indexOf(stepNorm);
    return currentIndex >= targetIndex;
  }

  voirMap(ordre: any) {
    this.isFollowingTruck = true;
    // 1. Arrêter TOUT rafraîchissement en arrière-plan
    if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
    }
    this.selectedOrdreForMap = ordre;
    this.isMapModalOpen = true;
    this.initMap();
  }

  closeMapModal() {
    this.stopAnimation();
    this.isMapModalOpen = false;
    this.selectedOrdreForMap = null;
    this.truckMarker = null;
    this.trailPolyline = null;
    this.simulationLine = null;
    this.totalDistance = '--';
    this.lastKnownCoords = null;
    this.targetGpsCoords = null;
    this.isSimulationActive = false;

    if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
    }
    
    // Restart the general refresh
    this.refreshInterval = setInterval(() => this.filtrerParDate(), 30000);
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  initMap() {
    setTimeout(() => {
      if (this.map) {
         this.map.remove();
      }

      this.map = L.map('osm-map', {
        zoomControl: true,
        attributionControl: true
      }).setView([33.8869, 9.5375], 6);

      this.isFollowingTruck = true;
      this.map.on('dragstart', () => {
        this.isFollowingTruck = false;
      });

      // Premium Google Maps Default tiles for better clarity
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        attribution: '&copy; Google Maps'
      }).addTo(this.map);

      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 300);
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 600);

      if (this.selectedOrdreForMap) {
         // Initialize ref coords to 0
         this.refCoords = { lat1: 0, lon1: 0, lat2: 0, lon2: 0 };

         // If order is delivered, show the full trail
         if (this.selectedOrdreForMap.statut === 'LIVRE') {
             this.fetchTrail(this.selectedOrdreForMap.id);
         }
         
         this.geocodeAndPlot(this.selectedOrdreForMap.chargementVille, this.selectedOrdreForMap.livraisonVille);

         // LIVE TRACKING: Secure refresh ONLY if NOT delivered
         const currentOrderNumber = this.selectedOrdreForMap.orderNumber;
         if (this.refreshInterval) clearInterval(this.refreshInterval);
         
         if (this.selectedOrdreForMap.statut !== 'LIVRE') {
             this.refreshInterval = setInterval(() => {
             this.service.search({orderNumber: currentOrderNumber}).subscribe(res => {
                 // Only update if it's EXACTLY the same order
                 const updatedOrder = res.find((o: any) => o.orderNumber === currentOrderNumber);
                 if (updatedOrder && this.selectedOrdreForMap) {
                     this.selectedOrdreForMap.currentLat = updatedOrder.currentLat;
                     this.selectedOrdreForMap.currentLon = updatedOrder.currentLon;
                     this.plotTruck(this.refCoords.lat1, this.refCoords.lon1, this.refCoords.lat2, this.refCoords.lon2);
                 }
             });
             }, 10000);
         }
      }
    }, 300);
  }

  geocodeAndPlot(sourceCity: string, destCity: string) {
    // Stop any running animation BEFORE resetting arrays to prevent stale closure crashes
    this.stopAnimation();
    this.isSimulationActive = false;
    if (!sourceCity || !destCity) return;
    const urlBase = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=';
    
    // Geocode Source
    this.http.get<any[]>(urlBase + encodeURIComponent(sourceCity + ', Tunisia')).subscribe(res1 => {
        let lat1 = 36.8065, lon1 = 10.1815; // default Tunis
        if(res1 && res1.length > 0) {
            lat1 = parseFloat(res1[0].lat);
            lon1 = parseFloat(res1[0].lon);
        }

        L.marker([lat1, lon1], {
            icon: L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.16));">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#ff9e4f" />
                      <stop offset="100%" stop-color="#f5921e" />
                    </linearGradient>
                  </defs>
                  <path d="M18 2C10.268 2 4 8.268 4 16c0 10.5 14 18 14 18s14-7.5 14-18c0-7.732-6.268-14-14-14z" fill="url(#orangeGrad)"/>
                  <circle cx="18" cy="16" r="6" fill="#ffffff" />
                  <circle cx="18" cy="16" r="3" fill="#f5921e" />
                </svg>
              </div>`,
              iconSize: [36, 36],
              iconAnchor: [18, 34]
            })
        }).addTo(this.map);

        // Geocode Destination
        this.http.get<any[]>(urlBase + encodeURIComponent(destCity + ', Tunisia')).subscribe(res2 => {
            let lat2 = 34.7398, lon2 = 10.7600; // default Sfax
            if(res2 && res2.length > 0) {
                lat2 = parseFloat(res2[0].lat);
                lon2 = parseFloat(res2[0].lon);
            }

            L.marker([lat2, lon2], {
                icon: L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.16));">
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#10b981" />
                          <stop offset="100%" stop-color="#059669" />
                        </linearGradient>
                      </defs>
                      <path d="M18 2C10.268 2 4 8.268 4 16c0 10.5 14 18 14 18s14-7.5 14-18c0-7.732-6.268-14-14-14z" fill="url(#greenGrad)"/>
                      <path d="M14 11h7a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-7v5h-2V11h2z" fill="#ffffff"/>
                    </svg>
                  </div>`,
                  iconSize: [36, 36],
                  iconAnchor: [18, 34]
                })
            }).addTo(this.map);

            this.refCoords = { lat1, lon1, lat2, lon2 };

            // Fetch real road coordinates from OSRM
            this.routeCoords = [[lat1, lon1], [lat2, lon2]];
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson&alternatives=true`;
            this.http.get<any>(osrmUrl).subscribe({
              next: (res) => {
                if (res && res.routes && res.routes.length > 0) {
                  let shortestRoute = res.routes[0];
                  for (let i = 1; i < res.routes.length; i++) {
                    if (res.routes[i].distance < shortestRoute.distance) {
                      shortestRoute = res.routes[i];
                    }
                  }
                  this.routeCoords = shortestRoute.geometry.coordinates.map((c: any) => [c[1], c[0]] as L.LatLngTuple);
                  this.totalDistance = (shortestRoute.distance / 1000).toFixed(1);
                } else {
                  this.totalDistance = (L.latLng(lat1, lon1).distanceTo(L.latLng(lat2, lon2)) / 1000).toFixed(1);
                }
                this.drawRouteAndStart(lat1, lon1, lat2, lon2);
              },
              error: (err) => {
                console.error("OSRM routing failed, falling back to straight line:", err);
                this.totalDistance = (L.latLng(lat1, lon1).distanceTo(L.latLng(lat2, lon2)) / 1000).toFixed(1);
                this.drawRouteAndStart(lat1, lon1, lat2, lon2);
              }
            });
        });
    });
  }

  private drawRouteAndStart(lat1: number, lon1: number, lat2: number, lon2: number) {
    if (this.simulationLine) { this.simulationLine.remove(); this.simulationLine = null; }
    if (this.routeGlow) { this.routeGlow.remove(); this.routeGlow = null; }
    if (this.routeTraveledLayer) { this.routeTraveledLayer.remove(); this.routeTraveledLayer = null; }
    if (this.routeRemainingLayer) { this.routeRemainingLayer.remove(); this.routeRemainingLayer = null; }
    if (this.routeTraveledGlow) { this.routeTraveledGlow.remove(); this.routeTraveledGlow = null; }
    if (this.routeRemainingGlow) { this.routeRemainingGlow.remove(); this.routeRemainingGlow = null; }

    // Draw full remaining route (will be replaced dynamically as truck moves)
    this.routeRemainingGlow = L.polyline(this.routeCoords, {
      color: '#64748b', weight: 9, opacity: 0.18, lineCap: 'round', lineJoin: 'round'
    }).addTo(this.map);

    this.routeRemainingLayer = L.polyline(this.routeCoords, {
      color: '#94a3b8', weight: 5, opacity: 0.7, dashArray: '10, 12', lineCap: 'round', lineJoin: 'round'
    }).addTo(this.map);

    // Compute cumulative distances for path-based animation
    this.cumulativeDistances = [0];
    this.totalRouteLength = 0;
    for (let i = 0; i < this.routeCoords.length - 1; i++) {
      const pt1 = L.latLng(this.routeCoords[i]);
      const pt2 = L.latLng(this.routeCoords[i + 1]);
      this.totalRouteLength += pt1.distanceTo(pt2);
      this.cumulativeDistances.push(this.totalRouteLength);
    }

    this.plotTruck(lat1, lon1, lat2, lon2);
  }

  plotTruck(lat1: number, lon1: number, lat2: number, lon2: number) {
      if (!this.selectedOrdreForMap || !this.map) return;
      const statut = this.selectedOrdreForMap.statut;
      
      let truckLat = 0;
      let truckLon = 0;
      let gpsActif = false;

      // 1. Priorité absolue : Les VRAIES coordonnées envoyées par le boîtier GPS matériel
      if (this.selectedOrdreForMap.currentLat && this.selectedOrdreForMap.currentLon) {
          truckLat = this.selectedOrdreForMap.currentLat;
          truckLon = this.selectedOrdreForMap.currentLon;
          gpsActif = true;
      } else {
          // 2. Mode Dégradé (Simulation Visuelle) si pas de GPS installé
          let ratio = 0.5; // default center
          if (['NON_PLANIFIE', 'PLANIFIE'].includes(statut)) ratio = 0.05;
          else if (['EN_COURS_DE_CHARGEMENT', 'CHARGE'].includes(statut)) ratio = 0.15;
          else if (['EN_COURS_DE_LIVRAISON'].includes(statut)) ratio = 0.6;
          else if (['LIVRE', 'Fin', 'FIN'].includes(statut)) ratio = 1.0;
          
          const targetDist = this.totalRouteLength * ratio;
          const pt = this.getPointAtDistance(this.routeCoords, targetDist, this.cumulativeDistances);
          if (pt) {
            truckLat = pt.lat;
            truckLon = pt.lon;
          } else {
            truckLat = lat1 + (lat2 - lat1) * ratio;
            truckLon = lon1 + (lon2 - lon1) * ratio;
          }
      }

      // Zoom and center on the truck the first time it is plotted
      if (!this.truckMarker) {
        this.map.setView([truckLat, truckLon], 13, { animate: false });
      }

      // Blue if Live GPS, Orange if simulation/traçage
      const color = gpsActif ? '#3b82f6' : '#f97316';
      const gpsLabel = gpsActif ? "<br><span style='color:#3b82f6; font-weight:bold;'>Connexion GPS Live ✓</span>" : "<br><span style='color:#f97316; font-weight:bold;'>Traçage Simulé</span>";
      
      const speed = this.selectedOrdreForMap.speed || 0;
      const truckInfo = this.selectedOrdreForMap.camion ? `<br><b>Camion:</b> ${this.selectedOrdreForMap.camion}` : '';

      const popupContent = `
          <div style="font-family: Arial, sans-serif; min-width: 150px;">
              <b style="color:#2563eb; font-size:14px;">Ordre: ${this.selectedOrdreForMap.orderNumber}</b>
              ${truckInfo}
              <br><b>Chauffeur:</b> ${this.selectedOrdreForMap.chauffeur || 'Non assigné'}
              <br><b>Vitesse:</b> <span style="color:${speed > 0 ? 'green' : 'red'}; font-weight:bold;">${speed} km/h</span>
              <hr style="margin: 5px 0;">
              ${gpsLabel}
          </div>
      `;

      if (gpsActif) {
        this.isSimulationActive = false;
        this.startGpsInterpolation([truckLat, truckLon], color, popupContent);
      } else {
        this.isSimulationActive = true;
        this.startSimulatedMovement(color, popupContent);
      }
  }

  private stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Manually toggle between Traçage Simulé and Live GPS mode.
   * Useful when the user clicks the Traçage button on the map overlay.
   */
  toggleSimulation() {
    if (!this.selectedOrdreForMap || !this.map) return;
    const { lat1, lon1, lat2, lon2 } = this.refCoords;
    if (lat1 === 0 && lon1 === 0) return; // route not yet loaded

    this.stopAnimation();

    if (this.isSimulationActive) {
      // Switch to Live GPS mode (or degrade gracefully)
      this.isSimulationActive = false;
      const color = '#3b82f6';
      const popupContent = `<div style="font-family:Arial,sans-serif;min-width:150px;">
        <b style="color:#2563eb;font-size:14px;">Ordre: ${this.selectedOrdreForMap.orderNumber}</b>
        <br><span style='color:#3b82f6;font-weight:bold;'>Connexion GPS Live ✓</span>
      </div>`;
      const target: L.LatLngTuple = this.selectedOrdreForMap.currentLat
        ? [this.selectedOrdreForMap.currentLat, this.selectedOrdreForMap.currentLon]
        : [lat1, lon1];
      this.startGpsInterpolation(target, color, popupContent);
    } else {
      // Switch to Simulation mode
      this.isSimulationActive = true;
      this.currentSimDistance = 0;
      const color = '#f97316';
      const popupContent = `<div style="font-family:Arial,sans-serif;min-width:150px;">
        <b style="color:#2563eb;font-size:14px;">Ordre: ${this.selectedOrdreForMap.orderNumber}</b>
        <br><span style='color:#f97316;font-weight:bold;'>Traçage Simulé</span>
      </div>`;
      this.startSimulatedMovement(color, popupContent);
    }
  }

  private startGpsInterpolation(targetCoords: L.LatLngTuple, color: string, popupContent: string) {
    this.stopAnimation();

    if (!this.lastKnownCoords) {
      this.lastKnownCoords = targetCoords;
      this.updateTruckMarker(targetCoords, 0, color, popupContent);
      return;
    }

    this.targetGpsCoords = targetCoords;
    this.gpsInterpolationT = 0;

    const animateGps = () => {
      if (!this.map || !this.lastKnownCoords || !this.targetGpsCoords) return;

      this.gpsInterpolationT += 0.02; // interpolation over ~50 frames
      if (this.gpsInterpolationT >= 1) this.gpsInterpolationT = 1;

      const currentLat = this.lastKnownCoords[0] + (this.targetGpsCoords[0] - this.lastKnownCoords[0]) * this.gpsInterpolationT;
      const currentLon = this.lastKnownCoords[1] + (this.targetGpsCoords[1] - this.lastKnownCoords[1]) * this.gpsInterpolationT;
      const bearing = this.calculateBearing(this.lastKnownCoords[0], this.lastKnownCoords[1], this.targetGpsCoords[0], this.targetGpsCoords[1]);

      this.updateTruckMarker([currentLat, currentLon], bearing, color, popupContent);

      if (this.gpsInterpolationT < 1) {
        this.animationFrameId = requestAnimationFrame(animateGps);
      } else {
        this.lastKnownCoords = this.targetGpsCoords;
        this.targetGpsCoords = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animateGps);
  }

  private startSimulatedMovement(color: string, popupContent: string) {
    this.stopAnimation();
    if (this.routeCoords.length < 2) return;

    this.currentSimDistance = 0;
    const stepSpeed = this.totalRouteLength / 3600; // Complete entire trip in ~60 seconds at 60fps

    const animateSim = () => {
      if (!this.map || !this.isSimulationActive) return;
      // Safety guard: if route arrays were reset, stop gracefully
      if (this.routeCoords.length < 2 || this.cumulativeDistances.length < 2) return;

      this.currentSimDistance += stepSpeed;
      if (this.currentSimDistance >= this.totalRouteLength) {
        this.currentSimDistance = this.totalRouteLength;
        const pt = this.getPointAtDistance(this.routeCoords, this.currentSimDistance, this.cumulativeDistances);
        if (pt) this.updateTruckMarker([pt.lat, pt.lon], pt.bearing, color, popupContent);
        
        setTimeout(() => {
          if (this.isSimulationActive && this.map) {
            this.currentSimDistance = 0;
            this.animationFrameId = requestAnimationFrame(animateSim);
          }
        }, 2500);
        return;
      }

      const pt = this.getPointAtDistance(this.routeCoords, this.currentSimDistance, this.cumulativeDistances);
      if (pt) {
        this.updateTruckMarker([pt.lat, pt.lon], pt.bearing, color, popupContent);
      }

      this.animationFrameId = requestAnimationFrame(animateSim);
    };

    this.animationFrameId = requestAnimationFrame(animateSim);
  }

  private updateTruckMarker(coords: L.LatLngTuple, bearing: number, color: string, popupContent: string) {
    if (!this.map) return;

    const isLive = !this.isSimulationActive;
    const currentSpeed = isLive ? (this.selectedOrdreForMap?.speed || 0) : 75;

    const pulseHtml = isLive ? `
      <div style="position:absolute;top:-12px;left:5px;width:50px;height:50px;border-radius:50%;background:rgba(59,130,246,0.4);animation:web-pulse 1.8s infinite ease-out;pointer-events:none;z-index:-1;"></div>
      <div style="position:absolute;top:8px;left:25px;width:10px;height:10px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 0 6px rgba(59,130,246,0.8);z-index:10;"></div>
    ` : '';

    const speedBadgeHtml = `
      <div class="truck-speed-badge" style="
        position: absolute;
        top: -24px;
        left: 12px;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        color: white;
        padding: 2px 8px;
        border-radius: 20px;
        font-family: 'Inter', sans-serif;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.05em;
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 4px;
        pointer-events: none;
      ">
        <span style="
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: ${isLive ? '#3b82f6' : '#f97316'};
          display: inline-block;
          animation: ${isLive ? 'web-pulse 1.5s infinite ease-out' : 'none'};
        "></span>
        <span>${currentSpeed} km/h</span>
      </div>
    `;

    if (this.truckMarker) {
      this.truckMarker.setLatLng(coords);
      this.truckMarker.setPopupContent(popupContent);
      const element = this.truckMarker.getElement();
      if (element) {
        const iconWrapper = element.querySelector('.truck-icon-wrapper') as HTMLElement;
        if (iconWrapper) iconWrapper.style.transform = `rotate(${bearing}deg)`;
        const svgs = element.querySelectorAll('.truck-cabin, .truck-strip');
        svgs.forEach((svg: any) => svg.setAttribute('fill', color));
        const pw = element.querySelector('.pulse-wrapper') as HTMLElement;
        if (pw) pw.innerHTML = pulseHtml;
        const speedBadge = element.querySelector('.truck-speed-badge') as HTMLElement;
        if (speedBadge) {
          speedBadge.outerHTML = speedBadgeHtml;
        }
      }
    } else {
      this.truckMarker = L.marker(coords, {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="pulse-wrapper" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;">${pulseHtml}</div>
            ${speedBadgeHtml}
            <div class="truck-icon-wrapper" style="transform:rotate(${bearing}deg);transition:transform 0.1s linear;display:inline-block;filter:drop-shadow(0px 3px 4px rgba(0,0,0,0.4));">
              <svg width="60" height="25" viewBox="0 0 68 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="46" height="20" rx="1.5" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
                <rect x="4" y="6" width="42" height="16" rx="1" fill="#ffffff" stroke="#e2e8f0" stroke-width="0.5"/>
                <rect class="truck-strip" x="12" y="12" width="26" height="4" rx="1" fill="${color}"/>
                <rect x="48" y="12" width="4" height="4" fill="#475569"/>
                <rect class="truck-cabin" x="51" y="5" width="14" height="18" rx="2.5" fill="${color}"/>
                <path d="M57 6h5.5a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1 -1.5 1.5h-5.5l-2-8 2-8z" fill="#1e293b"/>
                <rect x="52" y="8" width="5" height="12" rx="1" fill="rgba(255,255,255,0.2)"/>
                <rect x="52" y="3" width="2" height="3" rx="0.5" fill="#334155"/>
                <rect x="52" y="22" width="2" height="3" rx="0.5" fill="#334155"/>
                <path d="M64 6h1v3h-1z" fill="#fde047"/>
                <path d="M64 19h1v3h-1z" fill="#fde047"/>
              </svg>
            </div>`,
          iconSize: [60, 25],
          iconAnchor: [30, 12]
        })
      }).bindPopup(popupContent).addTo(this.map);
    }

    this.updateRouteDrawing(coords[0], coords[1], isLive);

    if (this.isFollowingTruck && this.map) {
      this.map.setView(coords, this.map.getZoom(), { animate: false });
    }
  }

  private getClosestRouteIndex(truckCoords: L.LatLngTuple): number {
    if (this.routeCoords.length === 0) return 0;
    let minDist = Infinity, closestIdx = 0;
    const truckPt = L.latLng(truckCoords);
    for (let i = 0; i < this.routeCoords.length; i++) {
      const d = truckPt.distanceTo(L.latLng(this.routeCoords[i]));
      if (d < minDist) { minDist = d; closestIdx = i; }
    }
    return closestIdx;
  }

  private updateRouteDrawing(truckLat: number, truckLon: number, isLive: boolean) {
    if (!this.map || this.routeCoords.length < 2) return;
    if (this.routeTraveledLayer) { this.routeTraveledLayer.remove(); this.routeTraveledLayer = null; }
    if (this.routeRemainingLayer) { this.routeRemainingLayer.remove(); this.routeRemainingLayer = null; }
    if (this.routeTraveledGlow) { this.routeTraveledGlow.remove(); this.routeTraveledGlow = null; }
    if (this.routeRemainingGlow) { this.routeRemainingGlow.remove(); this.routeRemainingGlow = null; }

    const closestIdx = this.getClosestRouteIndex([truckLat, truckLon]);
    const traveledCoords = [...this.routeCoords.slice(0, closestIdx + 1), [truckLat, truckLon] as L.LatLngTuple];
    const remainingCoords = [[truckLat, truckLon] as L.LatLngTuple, ...this.routeCoords.slice(closestIdx + 1)];

    if (isLive) {
      // ── LIVE GPS mode: Digital Blue ──
      this.routeTraveledGlow = L.polyline(traveledCoords, {
        color: '#1e3a8a', weight: 9, opacity: 0.3, lineCap: 'round', lineJoin: 'round'
      }).addTo(this.map);
      this.routeTraveledLayer = L.polyline(traveledCoords, {
        color: '#2563eb', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round'
      }).addTo(this.map);
      this.routeRemainingGlow = L.polyline(remainingCoords, {
        color: '#64748b', weight: 9, opacity: 0.15, lineCap: 'round', lineJoin: 'round'
      }).addTo(this.map);
      this.routeRemainingLayer = L.polyline(remainingCoords, {
        color: '#93c5fd', weight: 4, opacity: 0.75, dashArray: '8, 12', lineCap: 'round', lineJoin: 'round'
      }).addTo(this.map);
    } else {
      // ── SIMULATION mode: Alert Amber traveled, gray dashed remaining ──
      if (traveledCoords.length >= 2) {
        this.routeTraveledGlow = L.polyline(traveledCoords, {
          color: '#78350f', weight: 9, opacity: 0.28, lineCap: 'round', lineJoin: 'round'
        }).addTo(this.map);
        this.routeTraveledLayer = L.polyline(traveledCoords, {
          color: '#f97316', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round'
        }).addTo(this.map);
      }
      if (remainingCoords.length >= 2) {
        this.routeRemainingGlow = L.polyline(remainingCoords, {
          color: '#64748b', weight: 9, opacity: 0.14, lineCap: 'round', lineJoin: 'round'
        }).addTo(this.map);
        this.routeRemainingLayer = L.polyline(remainingCoords, {
          color: '#94a3b8', weight: 4, opacity: 0.7, dashArray: '10, 12', lineCap: 'round', lineJoin: 'round'
        }).addTo(this.map);
      }
    }
  }

  private getPointAtDistance(coords: L.LatLngTuple[], distance: number, cumulativeDistances: number[]) {
    if (!coords || coords.length === 0) return null;
    if (!cumulativeDistances || cumulativeDistances.length === 0) return null;
    if (coords.length !== cumulativeDistances.length) return null;
    if (coords.length === 1 || distance <= 0) return { lat: coords[0][0], lon: coords[0][1], bearing: 0 };
    if (distance >= cumulativeDistances[cumulativeDistances.length - 1]) {
      const last = coords[coords.length - 1];
      const prev = coords[coords.length - 2];
      return {
        lat: last[0],
        lon: last[1],
        bearing: this.calculateBearing(prev[0], prev[1], last[0], last[1])
      };
    }

    let i = 0;
    while (i < cumulativeDistances.length - 2 && cumulativeDistances[i + 1] < distance) {
      i++;
    }

    const p1 = coords[i];
    const p2 = coords[i + 1];
    const d1 = cumulativeDistances[i];
    const d2 = cumulativeDistances[i + 1];

    const t = (distance - d1) / (d2 - d1);
    const lat = p1[0] + (p2[0] - p1[0]) * t;
    const lon = p1[1] + (p2[1] - p1[1]) * t;
    const bearing = this.calculateBearing(p1[0], p1[1], p2[0], p2[1]);

    return { lat, lon, bearing };
  }

  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng - 90 + 360) % 360;
  }

  fetchTrail(ordreId: number) {
      this.http.get<any[]>(`http://localhost:8090/api/v1/ordres/${ordreId}/parcours`).subscribe(points => {
          if (points && points.length > 1) {
              const latlngs: L.LatLngExpression[] = points.map(p => [p.lat, p.lng]);
              
              if (this.trailPolyline) this.map.removeLayer(this.trailPolyline);
              if (this.simulationLine) this.map.removeLayer(this.simulationLine);
              
              // 1. Calcul de la distance totale
              let dist = 0;
              for (let i = 0; i < latlngs.length - 1; i++) {
                  const p1 = L.latLng(latlngs[i] as L.LatLngTuple);
                  const p2 = L.latLng(latlngs[i+1] as L.LatLngTuple);
                  dist += p1.distanceTo(p2);
              }
              this.totalDistance = (dist / 1000).toFixed(2);

              // 2. Tracé professionnel
              this.trailPolyline = L.polyline(latlngs, {
                  color: '#2563eb', // Bleu royal
                  weight: 5,
                  opacity: 0.8,
                  smoothFactor: 1
              }).addTo(this.map);

              this.map.fitBounds(this.trailPolyline.getBounds(), { padding: [50, 50] });
              
              // 3. Icônes personnalisées
              const warehouseIcon = L.divIcon({
                  html: '<div class="map-marker-pro start"><i class="fa fa-warehouse"></i></div>',
                  className: 'custom-div-icon', iconSize: [30, 30], iconAnchor: [15, 15]
              });

              const flagIcon = L.divIcon({
                  html: '<div class="map-marker-pro end"><i class="fa fa-flag-checkered"></i></div>',
                  className: 'custom-div-icon', iconSize: [30, 30], iconAnchor: [15, 15]
              });

              L.marker(latlngs[0], {icon: warehouseIcon}).bindPopup('<b>Départ Réel</b><br>Heure: ' + new Date(points[0].date).toLocaleString()).addTo(this.map);
              L.marker(latlngs[latlngs.length - 1], {icon: flagIcon}).bindPopup('<b>Arrivée Réelle</b><br>Heure: ' + new Date(points[points.length-1].date).toLocaleString()).addTo(this.map);

              // 4. Points de passage (vitesse) - tous les 10 points pour ne pas surcharger
              for (let i = 5; i < points.length - 5; i += 15) {
                  L.circleMarker([points[i].lat, points[i].lng], {radius: 3, color: '#ffffff', fillColor: '#2563eb', fillOpacity: 1, weight: 1})
                  .bindTooltip(`Vitesse: ${points[i].speed} km/h<br>Heure: ${new Date(points[i].date).toLocaleTimeString()}`)
                  .addTo(this.map);
              }
          }
      });
  }

  sortEvents() {
    for (let ordre of this.ordres) {
      if (ordre.events) {
        ordre.events.sort((a: string, b: string) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
      }
    }
  }


  getTimelineClass(index: number, events: any[], statut: string): string {
    let eventCount = events ? events.filter(event => event !== null && event !== undefined).length : 0;

    // Fallback if events are empty: use the status to estimate progress
    if (eventCount === 0) {
      if (statut === 'EN_COURS_DE_LIVRAISON') eventCount = 4;
      else if (statut === 'CHARGE') eventCount = 3;
      else if (statut === 'EN_COURS_DE_CHARGEMENT') eventCount = 2;
      else if (statut === 'PLANIFIE') eventCount = 1;
      else if (statut === 'LIVRE' || statut === 'Fin') eventCount = 6;
    }

    if (statut === 'NON_PLANIFIE' && eventCount === 0) return 'inactive';

    if (index < eventCount) {
      if (index === eventCount - 1 && eventCount < 6) return 'pending';
      return 'completed';
    }

    return 'inactive';
  }

  getTimelineClassLine(index: number, events: any[], statut: string): string {
    let eventCount = events ? events.filter(event => event !== null && event !== undefined).length : 0;
    
    // Fallback
    if (eventCount === 0) {
      if (statut === 'EN_COURS_DE_LIVRAISON') eventCount = 4;
      else if (statut === 'CHARGE') eventCount = 3;
      else if (statut === 'EN_COURS_DE_CHARGEMENT') eventCount = 2;
      else if (statut === 'PLANIFIE') eventCount = 1;
      else if (statut === 'LIVRE' || statut === 'Fin') eventCount = 6;
    }

    if (index < eventCount - 1) return 'active';
    return 'inactive';
  }


  autoRefreshPage(): void {
    // Legacy method, kept for compatibility if needed, but periodic fetch is better
  }


  filtrerParDate() {
    const params = {
      client: this.filtreClient,
      statut: this.filtreStatut,
      startDate: this.dateDebut,
      endDate: this.dateFin,
      site: this.filtreSite,
      chauffeur: this.filtreChauffeur,
      destination: this.filtreDestination
    };

    this.service.search(params).subscribe(ordres => {
      this.ordresFiltres = ordres.filter(o => {
        const matchesSource = !this.filtreSource || 
          (o.chargementVille && o.chargementVille.toLowerCase().includes(this.filtreSource.toLowerCase()));
        return o.statut !== 'NON_CONFIRME' && matchesSource;
      });
      this.cdr.detectChanges();
    });
  }



  resetFiltre() {
    this.dateDebut = this.getTodayDate();
    this.dateFin = this.getTodayDate();
    this.filtreClient = "";
    this.filtreSite = "";
    this.filtreStatut = "";
    this.filtreChauffeur = "";
    this.filtreDestination = "";
    this.filtreSource = "";

    this.filtrerParDate();
  }


  exporterExcel() {
    const headers = [
      'dateSaisie', 'livraisonDate', 'orderNumber', 'client', 'siteclient',
      'statut', 'chauffeur', 'camion', 'datevoy'
    ];

    const filename = `suivi_ordres_${new Date().getTime()}.csv`;
    this.service.exportToCsv(this.ordresFiltres, filename, headers);
  }



}




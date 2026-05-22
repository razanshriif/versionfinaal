import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonIcon, IonSpinner, ToastController } from '@ionic/angular/standalone';
import { NavController, ViewDidEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, notificationsOutline, logOutOutline, busOutline, analyticsOutline, locationOutline, businessOutline, homeOutline, cubeOutline, navigateOutline, checkmarkDoneOutline, flagOutline, chevronForwardOutline, chevronBackOutline, speedometerOutline, location, flag } from 'ionicons/icons';
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
  map: L.Map | null = null;
  isLoading = false;
  isExpanded = false; 
  totalDistance: string = '0';
  private timeouts: any[] = [];
  private truckMarker: L.Marker | null = null;
  private markerSource: L.Marker | null = null;
  private markerDest: L.Marker | null = null;
  private routeLayer: L.Polyline | null = null;
  private routeGlow: L.Polyline | null = null;
  private refreshInterval: any = null;
  private refCoords: any = null;
  private coordsCache: Map<string, {lat: number, lon: number}> = new Map();

  // Animation Properties
  private animationFrameId: any = null;
  private routeCoords: L.LatLngTuple[] = [];
  private cumulativeDistances: number[] = [];
  private totalRouteLength = 0;
  private currentSimDistance = 0;
  private isSimulationActive = false;
  public isFollowingTruck = true;
  public isTimelineCollapsed = false;

  toggleTimeline() {
    this.isTimelineCollapsed = !this.isTimelineCollapsed;
  }

  // Live GPS Transition
  private lastKnownCoords: L.LatLngTuple | null = null;
  private targetGpsCoords: L.LatLngTuple | null = null;
  private gpsInterpolationT = 0;

  constructor(
    public navCtrl: NavController,
    private route: ActivatedRoute,
    private livraisonService: LivraisonService,
    private http: HttpClient,
    private toastCtrl: ToastController
  ) {
    addIcons({ arrowBackOutline, notificationsOutline, logOutOutline, busOutline, analyticsOutline, locationOutline, businessOutline, homeOutline, cubeOutline, navigateOutline, checkmarkDoneOutline, flagOutline, chevronForwardOutline, chevronBackOutline, speedometerOutline, location, flag });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = params['livraisonId'];
      if (id) {
        this.loadLivraison(+id);
        this.startLiveTracking(+id);
      }
    });
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private cleanup() {
    this.stopAnimation();
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts = [];
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.truckMarker = null;
    this.markerSource = null;
    this.markerDest = null;
    this.routeLayer = null;
    this.routeGlow = null;
  }

  ionViewDidEnter() {
    // Force immediate size calculation
    if (this.map) {
      setTimeout(() => {
        this.map?.invalidateSize();
        console.log('🔄 Map size invalidated');
      }, 100);
      
      // Secondary check for slow mobile renders
      setTimeout(() => this.map?.invalidateSize(), 500);
      setTimeout(() => this.map?.invalidateSize(), 1500);
    } else if (this.selectedLivraison) {
      this.initMap(this.selectedLivraison);
    }
  }

  loadLivraison(id: number) {
    this.isLoading = true;
    this.livraisonService.getLivraisonById(id).subscribe({
      next: (livraison: LivraisonSimple) => {
        this.selectedLivraison = livraison;
        if (!this.map) {
          this.initMap(livraison);
        } else {
          this.geocodeAndPlot(livraison);
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement livraison:', err);
        this.isLoading = false;
      }
    });
  }

  startLiveTracking(id: number) {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      this.livraisonService.getLivraisonById(id).subscribe(updated => {
        if (this.selectedLivraison) {
          this.selectedLivraison.currentLat = updated.currentLat;
          this.selectedLivraison.currentLon = updated.currentLon;
          this.selectedLivraison.speed = updated.speed;
          this.selectedLivraison.statut = updated.statut;
          this.selectedLivraison.camion = updated.camion;
          
          if (this.map && this.refCoords) {
             // Efficient update without re-calculating geocoding
             this.plotTruck(this.selectedLivraison, this.refCoords.lat1, this.refCoords.lon1, this.refCoords.lat2, this.refCoords.lon2);
          }
        }
      });
    }, 15000); // 15s to reduce mobile load
  }

  hasEvent(step: string): boolean {
    if (!this.selectedLivraison) return false;
    const statut = this.selectedLivraison.statut;
    const allSteps = ['NON_PLANIFIE', 'PLANIFIE', 'EN_COURS_DE_CHARGEMENT', 'CHARGE', 'EN_COURS_DE_LIVRAISON', 'EN_LIVRAISON', 'LIVRE', 'FIN'];
    
    // Normalize current status
    let currentNorm = statut;
    if (statut === 'EN_LIVRAISON') currentNorm = 'EN_COURS_DE_LIVRAISON';
    if (statut === 'FIN') currentNorm = 'LIVRE';
    
    // Normalize target step
    let stepNorm = step;
    if (step === 'EN_LIVRAISON') stepNorm = 'EN_COURS_DE_LIVRAISON';
    if (step === 'FIN') stepNorm = 'LIVRE';

    const currentIndex = allSteps.indexOf(currentNorm);
    const targetIndex = allSteps.indexOf(stepNorm);
    
    return currentIndex >= targetIndex;
  }

  initMap(livraison: LivraisonSimple) {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Initialize with CartoDB Positron light gray style tiles (Glovo theme)
    this.map = L.map('osm-map', {
      zoomControl: false,
      attributionControl: false
    }).setView([33.8869, 9.5375], 6);

    this.isFollowingTruck = true;
    this.map.on('dragstart', () => {
      this.isFollowingTruck = false;
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Initial resize to fix tiling during UI transitions
    setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 200);
    setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 600);

    this.geocodeAndPlot(livraison);
  }

  async geocodeAndPlot(livraison: LivraisonSimple) {
    const sourceCity = livraison.chargementVille || '';
    const destCity = livraison.livraisonVille || '';
    if (!this.map || !sourceCity || !destCity) return;

    const getCoords = async (city: string) => {
      if (!city) return null;
      const cacheKey = `${city}, Tunisia`;
      if (this.coordsCache.has(cacheKey)) return this.coordsCache.get(cacheKey)!;
      
      const searchQueries = [
        `${city}, Tunisia`,
        city,
        city.split(' ').pop() + ', Tunisia'
      ];

      for (const query of searchQueries) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
          const res = await this.http.get<any[]>(url).toPromise();
          if (res && res.length > 0) {
            const coords = { lat: parseFloat(res[0].lat), lon: parseFloat(res[0].lon) };
            this.coordsCache.set(cacheKey, coords);
            console.log(`✅ Geocoded [${query}] ->`, coords);
            return coords;
          }
        } catch (e) { console.error(`Geocoding error for [${query}]`, e); }
      }
      return null;
    };

    const c1 = await getCoords(sourceCity) || { lat: 36.8065, lon: 10.1815 };
    const c2 = await getCoords(destCity) || { lat: 34.7398, lon: 10.7600 };

    console.log('📍 Map Plotting:', { source: sourceCity, c1, dest: destCity, c2 });

    if (!this.map) return;

    // Marker Source (Glovo Style: Yellow Teardrop Pin)
    if (this.markerSource) this.markerSource.remove();
    this.markerSource = L.marker([c1.lat, c1.lon], {
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

    // Marker Destination (Glovo Style: Green Flag/Pin)
    if (this.markerDest) this.markerDest.remove();
    this.markerDest = L.marker([c2.lat, c2.lon], {
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

    this.refCoords = { lat1: c1.lat, lon1: c1.lon, lat2: c2.lat, lon2: c2.lon };
    
    // Fetch real road coordinates from OSRM
    this.routeCoords = [[c1.lat, c1.lon], [c2.lat, c2.lon]];
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${c1.lon},${c1.lat};${c2.lon},${c2.lat}?overview=full&geometries=geojson`;
      const res = await this.http.get<any>(osrmUrl).toPromise();
      if (res && res.routes && res.routes.length > 0) {
        this.routeCoords = res.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as L.LatLngTuple);
        this.totalDistance = (res.routes[0].distance / 1000).toFixed(1);
        console.log(`🛣️ OSRM route loaded: ${this.routeCoords.length} points, ${this.totalDistance} km`);
      } else {
        const p1 = L.latLng(c1.lat, c1.lon);
        const p2 = L.latLng(c2.lat, c2.lon);
        this.totalDistance = (p1.distanceTo(p2) / 1000).toFixed(1);
      }
    } catch (e) {
      console.error("OSRM routing failed, using straight line fallback:", e);
      const p1 = L.latLng(c1.lat, c1.lon);
      const p2 = L.latLng(c2.lat, c2.lon);
      this.totalDistance = (p1.distanceTo(p2) / 1000).toFixed(1);
    }

    // Polyline (Royal Blue with Glow)
    if (this.routeLayer) this.routeLayer.remove();
    if (this.routeGlow) this.routeGlow.remove();

    this.routeGlow = L.polyline(this.routeCoords, {
      color: '#1e3a8a', weight: 8, opacity: 0.5, lineCap: 'round', lineJoin: 'round'
    }).addTo(this.map);

    this.routeLayer = L.polyline(this.routeCoords, {
      color: '#3b82f6', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round'
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

    this.plotTruck(livraison, c1.lat, c1.lon, c2.lat, c2.lon);
  }

  plotTruck(livraison: any, lat1: number, lon1: number, lat2: number, lon2: number) {
    if (!this.map) return;
    const statut = livraison.statut;
    let truckLat = 0, truckLon = 0, gpsActif = false;

    console.log('🚛 Plotting Truck for:', livraison.orderNumber || livraison.id, { currentLat: livraison.currentLat, currentLon: livraison.currentLon, statut });

    if (livraison.currentLat && livraison.currentLon && livraison.currentLat !== 0) {
        truckLat = livraison.currentLat;
        truckLon = livraison.currentLon;
        gpsActif = true;
    } else {
        // Mode Dégradé from Frontend
        let ratio = 0.5;
        if (['NON_PLANIFIE', 'PLANIFIE'].includes(statut)) ratio = 0.05; // Start
        else if (['EN_COURS_DE_CHARGEMENT', 'CHARGE'].includes(statut)) ratio = 0.15;
        else if (['EN_COURS_DE_LIVRAISON', 'EN_LIVRAISON'].includes(statut)) ratio = 0.6;
        else if (['LIVRE', 'Fin', 'FIN'].includes(statut)) ratio = 1.0;
        
        // Find approximate position along our OSRM routeCoords based on ratio
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

    // Sanity check
    if (!truckLat || !truckLon || isNaN(truckLat) || isNaN(truckLon)) {
      console.warn('❌ Invalid truck coordinates, using center of route');
      truckLat = (lat1 + lat2) / 2;
      truckLon = (lon1 + lon2) / 2;
    }

    // Zoom and center on the truck the first time it is plotted
    if (!this.truckMarker) {
      this.map.setView([truckLat, truckLon], 13, { animate: false });
    }

    const color = gpsActif ? '#10b981' : '#f5921e';
    const gpsLabel = gpsActif ? "<br><span style='color:green; font-weight:bold;'>Connexion GPS Live ✓</span>" : "<br><span style='color:orange;'>Position Estimée (Pas de Signal)</span>";
    const speed = livraison.speed || 0;
    const truckInfo = (livraison.matricule || livraison.camion) ? `<br><b>Camion:</b> ${livraison.matricule || livraison.camion}` : '';

    const popupContent = `
        <div style="font-family: Arial, sans-serif; min-width: 150px;">
            <b style="color:#2563eb; font-size:14px;">Ordre: ${livraison.orderNumber || livraison.id}</b>
            ${truckInfo}
            <br><b>Chauffeur:</b> ${livraison.chauffeur || 'Non assigné'}
            <br><b>Vitesse:</b> <span style="color:${speed > 0 ? 'green' : 'red'}; font-weight:bold;">${speed} km/h</span>
            <hr style="margin: 5px 0;">
            ${gpsLabel}
        </div>
    `;

    if (gpsActif) {
      // Live GPS Mode: smooth interpolation between updates
      this.isSimulationActive = false;
      this.startGpsInterpolation([truckLat, truckLon], color, popupContent);
    } else {
      // Simulation / Off-line Mode: continuously loop truck driving along the full path
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

      this.gpsInterpolationT += 0.02; // Interpolate over ~50 frames (approx 0.8 seconds)
      if (this.gpsInterpolationT >= 1) {
        this.gpsInterpolationT = 1;
      }

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

      this.currentSimDistance += stepSpeed;
      if (this.currentSimDistance >= this.totalRouteLength) {
        // Pause for 2.5s at destination, then restart
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

    if (this.truckMarker) {
      this.truckMarker.setLatLng(coords);
      this.truckMarker.setPopupContent(popupContent);
      
      const element = this.truckMarker.getElement();
      if (element) {
        const iconWrapper = element.querySelector('.truck-icon-wrapper') as HTMLElement;
        if (iconWrapper) {
          iconWrapper.style.transform = `rotate(${bearing}deg)`;
        }
      }
    } else {
      this.truckMarker = L.marker(coords, {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="truck-icon-wrapper" style="transform: rotate(${bearing}deg); transition: transform 0.1s linear; display: inline-block; filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.4));">
            <svg width="60" height="25" viewBox="0 0 68 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="4" width="46" height="20" rx="1.5" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
              <rect x="4" y="6" width="42" height="16" rx="1" fill="#ffffff" stroke="#e2e8f0" stroke-width="0.5"/>
              <rect x="12" y="12" width="26" height="4" rx="1" fill="#f97316"/>
              <rect x="48" y="12" width="4" height="4" fill="#475569"/>
              <rect x="51" y="5" width="14" height="18" rx="2.5" fill="#f97316"/>
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
    
    if (this.isFollowingTruck && this.map) {
      this.map.setView(coords, this.map.getZoom(), { animate: false });
    }
  }

  private getPointAtDistance(coords: L.LatLngTuple[], distance: number, cumulativeDistances: number[]) {
    if (coords.length === 0) return null;
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
    // Align FA truck (which points right) to move forward along the bearing direction
    return (brng - 90 + 360) % 360;
  }

  getStatusKey(statut: string): string {
    const mapStatuses: Record<string, string> = {
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
    return mapStatuses[statut] || 'pending';
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
    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 300);
  }

  async replotRoute() {
    if (this.selectedLivraison && this.map) {
      console.log('🔄 Replotting route (exact frontend style)...');
      this.geocodeAndPlot(this.selectedLivraison);
      
      const toast = await this.toastCtrl.create({
        message: 'Mise à jour du tracé...',
        duration: 1500,
        position: 'top',
        color: 'primary',
        cssClass: 'custom-toast'
      });
      toast.present();
    }
  }

  logout() {
    this.navCtrl.navigateRoot('/login');
  }
}



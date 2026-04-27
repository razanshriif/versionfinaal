import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrdreService } from '../ordre.service';
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

  constructor(private modalService: NgbModal, private service: OrdreService, private http: HttpClient) { }

  ngOnInit(): void {
    this.filtrerParDate();
    this.autoRefreshPage();
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  openModal() {
    console.log('open')
    this.isModalOpen = true;
  }

  closeModal(event?: MouseEvent) {
    this.isModalOpen = false;
  }

  onSubmit() {
    this.service.sendEmail(this.email).subscribe(
      response => {
        console.log('Email envoyé avec succès', response);
      },
      error => {
        console.error('Error sending email', error);
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
        console.error('Error fetching email:', error);
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
            console.log('SMS envoyé avec succès', response);
          },
          error => {
            console.error("Erreur lors de l'envoi du SMS", error);
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
    });
  }

  voirMap(ordre: any) {
    this.selectedOrdreForMap = ordre;
    this.isMapModalOpen = true;
    console.log('Ouverture de la carte pour l\'ordre:', ordre.orderNumber);
    this.initMap();
  }

  closeMapModal() {
    this.isMapModalOpen = false;
    this.selectedOrdreForMap = null;
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

      // Initialize map on the osm-map div
      this.map = L.map('osm-map').setView([33.8869, 9.5375], 6); // Center of Tunisia

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      if (this.selectedOrdreForMap) {
         this.geocodeAndPlot(this.selectedOrdreForMap.chargementVille, this.selectedOrdreForMap.livraisonVille);
      }
    }, 300); // Wait for modal animation
  }

  geocodeAndPlot(sourceCity: string, destCity: string) {
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
              html: "<div style='background-color:#10b981; color:white; border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; box-shadow:0 0 10px rgba(0,0,0,0.5);'><i class='fa fa-arrow-up'></i></div>",
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })
        }).bindPopup('Départ: ' + sourceCity).addTo(this.map);

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
                  html: "<div style='background-color:#ef4444; color:white; border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; box-shadow:0 0 10px rgba(0,0,0,0.5);'><i class='fa fa-arrow-down'></i></div>",
                  iconSize: [30, 30],
                  iconAnchor: [15, 15]
                })
            }).bindPopup('Destination: ' + destCity).addTo(this.map);

            // Draw connecting dashed line
            const latlngs: L.LatLngTuple[] = [ [lat1, lon1], [lat2, lon2] ];
            const polyline = L.polyline(latlngs, {color: '#3b82f6', weight: 4, dashArray: '5, 10'}).addTo(this.map);
            
            // Adjust bounds to fit both points
            this.map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

            // Place dynamic truck marker
            this.plotTruck(lat1, lon1, lat2, lon2);
        });
    });
  }

  plotTruck(lat1: number, lon1: number, lat2: number, lon2: number) {
      if (!this.selectedOrdreForMap) return;
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
          
          if (['NON_PLANIFIE', 'PLANIFIE'].includes(statut)) ratio = 0.0;
          else if (['EN_COURS_DE_CHARGEMENT', 'CHARGE'].includes(statut)) ratio = 0.1;
          else if (['LIVRE', 'Fin'].includes(statut)) ratio = 1.0;
          
          truckLat = lat1 + (lat2 - lat1) * ratio;
          truckLon = lon1 + (lon2 - lon1) * ratio;
      }

      // Couleur Verte si GPS Réel, Orange si Simulation (pour différencier à l'écran)
      const color = gpsActif ? '#10b981' : '#f5921e';
      const gpsLabel = gpsActif ? "<br><span style='color:green; font-weight:bold;'>Connexion GPS Actuelle ✓</span>" : "<br><span style='color:orange;'>Position Estimée (Pas de Signal)</span>";

      L.marker([truckLat, truckLon], {
          icon: L.divIcon({
             className: 'custom-div-icon',
             html: `<div style='background-color:${color}; color:white; border-radius:5px; padding:5px; font-size:16px; border:2px solid white; box-shadow:0 0 10px rgba(0,0,0,0.5);'><i class='fa fa-truck'></i></div>`,
             iconSize: [36, 36],
             iconAnchor: [18, 18]
          })
      }).bindPopup('<b>Camion en cours</b><br>Conducteur: ' + (this.selectedOrdreForMap.chauffeur || 'Non assigné') + gpsLabel).addTo(this.map);
  }

  detail(ordre: any) {
    this.service.detail = ordre;
    console.log(this.service.detail);
  }

  sortEvents() {
    for (let ordre of this.ordres) {
      if (ordre.events) {
        ordre.events.sort((a: string, b: string) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
      }
    }
  }


  getTimelineClass(index: number, events: any[], statut: string): string {
    const eventCount = events ? events.filter(event => event !== null && event !== undefined).length : 0;

    if (statut === 'NON_PLANIFIE') return 'inactive';

    if (statut === 'PLANIFIE') {
      return index === 0 ? 'pending' : 'inactive';
    }
    
    // index is 0..5
    if (index < eventCount) {
      // If it's the last recorded event, it might be the "current" one (pending)
      // or if all 6 are done, it's completed.
      if (index === eventCount - 1 && eventCount < 6) return 'pending';
      return 'completed';
    }

    return 'inactive';
  }

  getTimelineClassLine(index: number, events: any[], statut: string): string {
    const eventCount = events ? events.filter(event => event !== null && event !== undefined).length : 0;
    if (index < eventCount) return 'active';
    return 'inactive';
  }


  autoRefreshPage(): void {
    setInterval(() => {
      this.ordres.forEach(ordre => {
        if (ordre.statut === 'Fin' && !ordre.events[5]) {
          ordre.events[5] = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
      });
    }, 3 * 60 * 1000); // 3 minutes
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




import { Component, OnInit } from '@angular/core';
import { OrdreService } from '../ordre.service';
import { ClientService } from '../client.service';
import { ArticleService } from '../services/article.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ClientSearchDialogComponent } from '../client-search-dialog/client-search-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ordrenonconform',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatRadioModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './ordrenonconform.component.html',
  styleUrls: ['./ordrenonconform.component.css']
})
export class OrdrenonconformComponent implements OnInit {

  articles: any[] = [];          // tous les articles
  filteredArticles: any[] = [];
  // Site options for the dropdown
  villesTunisie: string[] = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte',
    'Beja', 'Jendouba', 'Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia',
    'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabes', 'Medenine',
    'Tataouine', 'Gafsa', 'Tozeur', 'Kebili'
  ];

  filteredVilles: string[] = [];

  articleOptions: any[] = [];
  siteOptions: string[] = [
    'BAR',
    'SAL',
    'BKS',
    'SFX',
    'TUN',
    'GAB',
    'GAS',
    'BSL',
    'JER',
    'BIZ',
    'NAS'
  ];

  // Properties for datetime picker
  hours: string[] = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')); // 00 to 23
  minutes: string[] = ['00', '15', '30', '45']; // 15-minute increments
  chargementDate: Date | null = null;
  livraisonDate: Date | null = null;
  chargementTime: { hour: string, minute: string } = { hour: '00', minute: '00' };
  livraisonTime: { hour: string, minute: string } = { hour: '00', minute: '00' };

  constructor(
    private service: OrdreService,
    private clientService: ClientService,
    private articleservice: ArticleService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  user = {
    id: 0,
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: ""
  };

  ordre: any = {
    id: 0,
    matricule: "",
    client: '',
    nomclient: '',
    siteclient: '',
    idedi: '',
    codeclientcharg: "",
    chargementNom: "",
    chargementAdr1: "",
    chargementAdr2: "",
    chargementVille: "",
    chargementDate: null, // Changed to null to match Date type
    codeclientliv: "",
    livraisonNom: "",
    livraisonAdr1: "",
    livraisonAdr2: "",
    codepostalliv: "",
    livraisonVille: "",
    livraisonDate: null, // Changed to null to match Date type
    codeArticle: "",
    designation: "",
    poids: 0.0,
    volume: 0.0,
    nombrePalettes: 0,
    nombreColis: 0,
    longueur: 0.0,
    dateSaisie: null,
    statut: "NON_CONFIRME",
    commentaires: []
  };

  client: any;
  article: any;
  commentaire = "";
  optionsCommentaire = {
    typeVoyage: '',
    typeCamion: '',
    typeSemi: '',
    typeCargo: '',
    commentaireLibre: ''
  };

  ngOnInit() {
    this.loadArticles();
    console.log(this.ordre);
    this.filteredVilles = [...this.villesTunisie];

    // Charger tous les codes articles au démarrage
    this.articleservice.getArticles().subscribe(
      (data) => {
        this.articles = data;
        this.filteredArticles = data;
      },
      (error) => console.error('Erreur de chargement des articles', error)
    );
  }


  loadArticles(): void {
    this.articleservice.getArticles().subscribe(
      (data) => {
        this.articleOptions = data;  // Assigne la liste reçue depuis l'API
      },
      (error) => {
        console.error('Erreur lors du chargement des articles', error);
      }
    );
  }

  filterVilles(searchValue: string) {
    const search = searchValue?.toLowerCase() || '';
    this.filteredVilles = this.villesTunisie.filter(ville =>
      ville.toLowerCase().includes(search)
    );
  }

  ajouter() {
    this.service.ajouter(this.ordre).subscribe({
      next: (res) => {
        this.snackBar.open('✅ Ordre créé avec succès !', '', {
          duration: 8000,
          panelClass: ['centered-snackbar']
        });

        // Réinitialisation
        this.ordre = {
          id: 0,
          matricule: "",
          client: '',
          nomclient: '',
          siteclient: '',
          idedi: '',
          codeclientcharg: "",
          chargementNom: "",
          chargementAdr1: "",
          chargementAdr2: "",
          chargementVille: "",
          chargementDate: null,
          codeclientliv: "",
          livraisonNom: "",
          livraisonAdr1: "",
          livraisonAdr2: "",
          codepostalliv: "",
          livraisonVille: "",
          livraisonDate: null,
          codeArticle: "",
          designation: "",
          poids: 0.0,
          volume: 0.0,
          nombrePalettes: 0,
          nombreColis: 0,
          longueur: 0.0,
          dateSaisie: null,
          statut: "NON_CONFIRME",
          commentaires: []
        };
        this.chargementDate = null;
        this.livraisonDate = null;
        this.chargementTime = { hour: '00', minute: '00' };
        this.livraisonTime = { hour: '00', minute: '00' };
      },
      error: () => {
        this.snackBar.open('❌ Erreur lors de la création !', '', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['custom-snackbar', 'error-snackbar']
        });
      }
    });
  }



  openClientSearchDialog(field: string): void {
    const dialogRef = this.dialog.open(ClientSearchDialogComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (field === 'client') {
          this.ordre.client = result.codeclient;
          this.ordre.nomclient = result.nom;
          this.ordre.siteclient = result.siteExploitation;
          this.ordre.idedi = result.idEdi;
        } else if (field === 'chargement') {
          this.ordre.codeclientcharg = result.codeclient;
          this.ordre.chargementNom = result.nom;
          this.ordre.chargementAdr1 = result.adresse;
          this.ordre.chargementVille = result.ville;
        } else if (field === 'livraison') {
          this.ordre.codeclientliv = result.codeclient;
          this.ordre.livraisonNom = result.nom;
          this.ordre.livraisonAdr1 = result.adresse;
          this.ordre.livraisonVille = result.ville;
          this.ordre.codepostalliv = result.codepostal;
        }
      }
    });
  }


  onArticleCodeChange(clientCode: any): void {
    if (clientCode) {
      this.ordre.codeArticle = clientCode.toUpperCase();
      this.articleservice.searchByCodeArticle(clientCode).subscribe(
        (article) => {
          this.ordre.designation = article.label;
        },
        (error) => {
          console.error('Error fetching client details', error);
        }
      );
    } else {
      this.ordre.designation = '';
    }
  }

  getArticleIcon(codeArticle: string): { icon: string, color: string } {
    const defaultIcon = { icon: 'fa-box', color: '#6c757d' };
    if (!codeArticle) return defaultIcon;
    
    const article = this.articleOptions.find(a => a.codeArticle === codeArticle);
    if (!article) return defaultIcon;
    
    const label = (article.label || '').toUpperCase();
    
    // ❄️ Froid / Température
    if (label.includes('-22°C') || label.includes('SURGELE')) return { icon: 'fa-icicles', color: '#0056b3' };
    if (label.includes('4°C') || label.includes('FRAIS')) return { icon: 'fa-snowflake', color: '#00a8ff' };
    if (label.includes('12°C') || label.includes('CONTRÔLÉ')) return { icon: 'fa-thermometer-half', color: '#007bff' };
    if (label.includes('FRIGORIFIQUE')) return { icon: 'fa-snowflake', color: '#00a8ff' };
    
    // ☀️ Logistique & Stockage
    if (label.includes('AMBIANT')) return { icon: 'fa-sun', color: '#e1b12c' };
    if (label.includes('STATIONNEMENT')) return { icon: 'fa-parking', color: '#e84118' };
    if (label.includes('ENTREPOT') || label.includes('DEPOT') || label.includes('INTER-SITE') || label.includes('INTER DEPOT')) return { icon: 'fa-warehouse', color: '#8c7ae6' };
    if (label.includes('MAGASIN')) return { icon: 'fa-store', color: '#8c7ae6' };
    
    // 🔄 Mouvements spéciaux
    if (label.includes('RETOUR')) return { icon: 'fa-undo', color: '#e84118' };
    if (label.includes('SPOT') || label.includes('SPECIAL')) return { icon: 'fa-bolt', color: '#fbc531' };
    if (label.includes('PERSONNEL')) return { icon: 'fa-users', color: '#0097e6' };
    if (label.includes('DECHARGEMENT')) return { icon: 'fa-dolly', color: '#e1b12c' };
    if (label.includes('DISPATCHING') || label.includes('TRANSIT')) return { icon: 'fa-route', color: '#44bd32' };
    
    // 💳 Achats & Facturation
    if (label.includes('ACHAT')) return { icon: 'fa-shopping-cart', color: '#4cd137' };
    if (label.includes('FACTURE')) return { icon: 'fa-file-invoice-dollar', color: '#44bd32' };
    if (label.includes('NON FACTU')) return { icon: 'fa-file-alt', color: '#7f8fa6' };
    
    // 🔧 Technique & Maintenance
    if (label.includes('REPARATION') || label.includes('MECA') || label.includes('PNEUM')) return { icon: 'fa-wrench', color: '#718093' };
    if (label.includes('LAVAGE') || label.includes('VIDANGE')) return { icon: 'fa-oil-can', color: '#2f3640' };
    if (label.includes('VISITE TECHNIQUE') || label.includes('TECHNIQUE') || label.includes('SAV')) return { icon: 'fa-tools', color: '#e1b12c' };
    if (label.includes('TRACTAGE') || label.includes('PARC')) return { icon: 'fa-truck-moving', color: '#353b48' };
    
    // 📦 Spécifiques
    if (label.includes('FRUIT')) return { icon: 'fa-apple-alt', color: '#e84118' };
    if (label.includes('LILAS')) return { icon: 'fa-leaf', color: '#9c88ff' };
    if (label.includes('CATALOGUE')) return { icon: 'fa-book', color: '#8c7ae6' };
    if (label.includes('EMBALLAGE')) return { icon: 'fa-box-open', color: '#e1b12c' };
    
    // 🚛 Défaut
    return { icon: 'fa-truck', color: '#7f8fa6' };
  }

  chargement(clientCode: string): void {
    if (clientCode) {
      this.clientService.getClientDetails(clientCode).subscribe(
        (client) => {
          this.ordre.chargementNom = client.nom;
          this.ordre.chargementAdr1 = client.adresse;
          this.ordre.chargementVille = client.ville;
        },
        (error) => {
          console.error('Error fetching client details', error);
        }
      );
    } else {
      this.ordre.chargementNom = '';
      this.ordre.chargementAdr1 = '';
      this.ordre.chargementVille = '';
    }
  }

  livraison(clientCode: string): void {
    if (clientCode) {
      this.clientService.getClientDetails(clientCode).subscribe(
        (client) => {
          this.ordre.livraisonNom = client.nom;
          this.ordre.livraisonAdr1 = client.adresse;
          this.ordre.livraisonVille = client.ville;
          this.ordre.codepostalliv = client.codepostal;
        },
        (error) => {
          console.error('Error fetching client details', error);
        }
      );
    } else {
      this.ordre.livraisonNom = '';
      this.ordre.livraisonAdr1 = '';
      this.ordre.livraisonVille = '';
      this.ordre.codepostalliv = '';
    }
  }


  /****************************************************  encien commantaire
  ajoutercommentaire(i: any) {
    this.ordre.commentaires.push(i);
    this.commentaire = "";
  }

  updateCommentaire() {
    const parts = [];
    if (this.optionsCommentaire.typeVoyage) {
      parts.push(this.optionsCommentaire.typeVoyage);
    }
    if (this.optionsCommentaire.typeCamion) {
      parts.push(this.optionsCommentaire.typeCamion);
      if (this.optionsCommentaire.typeCamion === 'Semi' && this.optionsCommentaire.typeSemi) {
        parts.push(`(${this.optionsCommentaire.typeSemi})`);
      }
    }
    this.commentaire = parts.join(', ');
  }

  */


  /************************************************Nouveau commentaire */

  ajoutercommentaire(i: any) {
    if (i && i.trim() !== '') {
      this.ordre.commentaires.push(i);
      this.commentaire = "";
      this.optionsCommentaire.commentaireLibre = ""; // on réinitialise le champ libre
    }
  }

  updateCommentaire() {
    const parts = [];

    if (this.optionsCommentaire.typeVoyage) {
      parts.push(this.optionsCommentaire.typeVoyage);
    }

    if (this.optionsCommentaire.typeCamion) {
      parts.push(this.optionsCommentaire.typeCamion);
      if (
        this.optionsCommentaire.typeCamion === 'Semi' &&
        this.optionsCommentaire.typeSemi
      ) {
        parts.push(`(${this.optionsCommentaire.typeSemi})`);
      }
      if (
        this.optionsCommentaire.typeCamion === 'Cargo' &&
        this.optionsCommentaire.typeCargo
      ) {
        parts.push(`(${this.optionsCommentaire.typeCargo})`);
      }
    }

    // ✅ ajout du commentaire libre
    if (this.optionsCommentaire.commentaireLibre) {
      parts.push(this.optionsCommentaire.commentaireLibre);
    }

    this.commentaire = parts.join(', ');
  }


  updateChargementDate(): void {
    setTimeout(() => {
      if (this.chargementDate) {
        const date = new Date(this.chargementDate);
        date.setHours(parseInt(this.chargementTime.hour, 10));
        date.setMinutes(parseInt(this.chargementTime.minute, 10));
        this.ordre.chargementDate = date;
      } else {
        this.ordre.chargementDate = null;
      }
    }, 0);
  }

  updateLivraisonDate(): void {
    setTimeout(() => {
      if (this.livraisonDate) {
        const date = new Date(this.livraisonDate);
        date.setHours(parseInt(this.livraisonTime.hour, 10));
        date.setMinutes(parseInt(this.livraisonTime.minute, 10));
        this.ordre.livraisonDate = date;
      } else {
        this.ordre.livraisonDate = null;
      }
    }, 0);
  }
}




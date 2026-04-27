import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdreService } from '../ordre.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-ajouterordre',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule
  ],
  templateUrl: './ajouterordre.component.html',
  styleUrl: './ajouterordre.component.css'
})
export class AjouterordreComponent implements OnInit {


  constructor(private service: OrdreService, private snackBar: MatSnackBar) { };


  ordre = {
    id: 0,
    orderNumber: "",
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
    chargementDate: "",
    codeclientliv: "",
    livraisonNom: "",
    livraisonAdr1: "",
    livraisonAdr2: "",
    codepostalliv: "",
    livraisonVille: "",
    livraisonDate: "",
    codeArticle: "",
    designation: "",
    poids: 0.0,
    volume: 0.0,
    nombrePalettes: 0,
    nombreColis: 0,
    longueur: 0.0,
    dateSaisie: "",
    statut: "NON_CONFIRME",
    commentaires: []
  }

  ordres: any[] = [];
  ordrenconf: any[] = [];

  // Duplication modal
  isDuplicateModalOpen = false;
  duplicateCount = 1;
  ordreToDuplicate: any = null;

  // Multi-select
  allSelected: boolean = false;
  selectedCount: number = 0;

  ngOnInit(): void {
    this.afficher();
    console.log(this.ordres)
  }

  // Méthode pour afficher ou masquer le formulaire d'ajout de tâche

  afficher() {
    this.service.afficher().subscribe(ordres => {
      this.ordres = ordres;
      this.ordrenconf = [];
      for (let i of ordres) {
        if (i.statut == 'NON_CONFIRME') {
          // Initialize selected property
          this.ordrenconf.push({ ...i, selected: false });
        }
      }
      this.updateSelectionCount();
    });
  }
  ajouter() {
    this.service.ajouter(this.ordre).subscribe((res) => {
      console.log(res);

    });
  }
  isModalOpen = false;



  consulter(i: any) {

    this.ordre = i;
    this.openModal();
  }
  openModal() {
    this.isModalOpen = true;

  }

  closeModal(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isModalOpen = false;
  }

  onSubmit() {
    // Handle form submission, e.g., save the ordre object

    this.ajouter();
    console.log('Ordre saved:', this.ordre);
    this.closeModal();
  }

  openDuplicateModal(ordre: any) {
    this.ordreToDuplicate = ordre;
    this.duplicateCount = 1;
    this.isDuplicateModalOpen = true;
  }

  closeDuplicateModal(event?: Event) {
    if (event) event.stopPropagation();
    this.isDuplicateModalOpen = false;
    this.ordreToDuplicate = null;
  }

  submitDuplicate() {
    if (!this.ordreToDuplicate || this.duplicateCount < 1) return;

    this.service.dupliquerMultiple(this.ordreToDuplicate.id, this.duplicateCount).subscribe(
      (copies) => {
        console.log(`${copies.length} copies créées`);
        this.closeDuplicateModal();
        this.afficher();
        window.location.reload();
      },
      (error) => {
        console.error('Erreur duplication', error);
      }
    );
  }


  confirmer(i: any) {

    this.service.confirmer(i).subscribe((res) => {
      window.location.reload();
    });
  } supprimer(id: number): void {
    this.service.supprimer(id).subscribe(
      response => {
        console.log('Ordre supprimé avec succès!', response);
        window.location.reload();

        // Rediriger ou rafraîchir la liste après suppression
        // Remplacez cette ligne selon vos besoins
      },
      error => {
        console.error('Erreur lors de la suppression de l\'ordre', error);
      }
    );
  }

  dupliquerOrdre(ordre: any): void {
    this.openDuplicateModal(ordre);
  }

  // ═══════════════════════════════════════
  // Multi-select Actions
  // ═══════════════════════════════════════

  toggleSelectAll() {
    this.ordrenconf.forEach(o => o.selected = this.allSelected);
    this.updateSelectionCount();
  }

  updateSelectionCount() {
    this.selectedCount = this.ordrenconf.filter(o => o.selected).length;
    this.allSelected = this.ordrenconf.length > 0 && this.ordrenconf.every(o => o.selected);
  }

  getSelectedOrdres(): any[] {
    return this.ordrenconf.filter(o => o.selected);
  }

  deleteSelected() {
    const selected = this.getSelectedOrdres();
    if (selected.length === 0) return;
    if (!confirm(`Supprimer ${selected.length} ordre(s) sélectionné(s) ?`)) return;

    let completed = 0;
    selected.forEach(o => {
      this.service.supprimer(o.id).subscribe(() => {
        completed++;
        if (completed === selected.length) {
          this.afficher();
        }
      });
    });
  }

  confirmerSelected() {
    const selected = this.getSelectedOrdres();
    if (selected.length === 0) return;
    if (!confirm(`Confirmer/Valider ${selected.length} ordre(s) sélectionné(s) ?`)) return;

    const ids = selected.map(o => o.id);
    this.service.confirmerMultiple(ids).subscribe({
      next: () => {
        this.snackBar.open('✅ Ordres confirmés et fichier PLA généré !', 'Fermer', {
          duration: 3000
        });
        this.afficher();
      },
      error: (err) => {
        console.error('Erreur lors de la confirmation multiple', err);
        this.snackBar.open('❌ Erreur lors de la confirmation.', 'Fermer', {
          duration: 3000
        });
      }
    });
  }


  exporterSelectedCsv() {
    const selected = this.getSelectedOrdres();
    if (selected.length === 0) return;

    const headers = [
      'id', 'orderNumber', 'client', 'nomclient', 'siteclient',
      'chargementNom', 'chargementVille', 'chargementDate',
      'livraisonNom', 'livraisonVille', 'livraisonDate',
      'codeArticle', 'designation', 'poids', 'volume', 'statut'
    ];

    const filename = `ordres_non_confirmes_${new Date().getTime()}.csv`;
    this.service.exportToCsv(selected, filename, headers);
  }

  deselectAll() {
    this.ordrenconf.forEach(o => o.selected = false);
    this.allSelected = false;
    this.selectedCount = 0;
  }

}




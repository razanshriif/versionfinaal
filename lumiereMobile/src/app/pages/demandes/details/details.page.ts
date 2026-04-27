import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController, NavController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DemandeService } from '../../../services/demande.service';
import { Demande } from '../../../models/demande.model';
import { addIcons } from 'ionicons';
import { arrowBackOutline, downloadOutline, printOutline, timeOutline, locationOutline, cubeOutline, personOutline, shareOutline, pricetagOutline, barbellOutline, layersOutline, businessOutline, logOutOutline } from 'ionicons/icons';
// Removed static imports for performance optimization
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class DetailsPage implements OnInit {
  ordre: Demande | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private demandeService: DemandeService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    public navCtrl: NavController
  ) {
    addIcons({ arrowBackOutline, downloadOutline, printOutline, timeOutline, locationOutline, cubeOutline, personOutline, shareOutline, pricetagOutline, barbellOutline, layersOutline, businessOutline, logOutOutline });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.loadOrdreDetails(params['id']);
      } else {
        this.router.navigate(['/demandes/list']);
      }
    });
  }

  loadOrdreDetails(id: number) {
    this.isLoading = true;
    this.demandeService.getDemandeById(id).subscribe({
      next: (data) => {
        this.ordre = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading details', err);
        this.isLoading = false;
        this.showToast('Erreur lors du chargement des détails', 'danger');
      }
    });
  }

  async generatePDF() {
    const loading = await this.loadingController.create({
      message: 'Génération du PDF...',
    });
    await loading.present();

    try {
      const data = document.getElementById('print-section');
      if (!data) {
        throw new Error('Element not found');
      }

      // Dynamic import of large libraries to reduce initial bundle size
      const [jsPDF, html2canvas] = await Promise.all([
        import('jspdf').then(m => m.default),
        import('html2canvas').then(m => m.default)
      ]);

      const canvas = await html2canvas(data, { scale: 2 });
      const imgWidth = 208;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const contentDataURL = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      pdf.save(`Ordre_${this.ordre?.id}.pdf`);

      // For mobile, saving might need File Opener or similar, but save() works in browser and some contexts
      // Ideally use Filesystem plugin for better android support later if needed.

      await loading.dismiss();
      this.showToast('PDF téléchargé avec succès', 'success');

    } catch (error) {
      console.error('Error generating PDF', error);
      await loading.dismiss();
      this.showToast('Erreur lors de la génération du PDF', 'danger');
    }
  }

  goToNotifications() {
    this.navCtrl.navigateForward('/notifications');
  }

  logout() {
    this.navCtrl.navigateRoot('/login');
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}


import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IonicModule, NavController } from '@ionic/angular';
import { ToastService } from '../../../services/toast.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DemandeService } from '../../../services/demande.service';
import { Demande } from '../../../models/demande.model';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  barbellOutline,
  businessOutline,
  closeOutline,
  cubeOutline,
  documentTextOutline,
  downloadOutline,
  layersOutline,
  locationOutline,
  logOutOutline,
  personOutline,
  pricetagOutline,
  printOutline,
  shareOutline,
  timeOutline,
} from 'ionicons/icons';

import { LumLogoBarComponent } from '../../../components/lum-logo-bar/lum-logo-bar.component';

type Html2CanvasFn = typeof import('html2canvas').default;
type JsPDFCtor = typeof import('jspdf').default;

interface PdfCacheEntry {
  previewDataUrl: string;
  blob: Blob;
  objectUrl: string;
}

const PDF_TEMPLATE_WIDTH_PX = 800;
const PDF_PREVIEW_JPEG_QUALITY = 0.72;
const PDF_PAGE_IMG_WIDTH_MM = 208;

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, LumLogoBarComponent]
})
export class DetailsPage implements OnInit, OnDestroy {
  ordre: Demande | null = null;
  isLoading = true;
  today = new Date();

  isPdfPreviewOpen = false;
  isPdfGenerating = false;
  isPdfPreviewLoading = false;
  pdfPreviewImageUrl: string | null = null;
  pdfPreviewSafeUrl: SafeResourceUrl | null = null;
  pdfPreviewError: string | null = null;

  canDownloadPdf = false;

  private pdfBlob: Blob | null = null;
  private pdfObjectUrl: string | null = null;
  private pdfGenerationPromise: Promise<void> | null = null;

  private pdfCacheOrdreId: number | null = null;
  private pdfCacheFingerprint = '';
  private pdfCacheEntry: PdfCacheEntry | null = null;

  private static pdfLibsPromise: Promise<{ html2canvas: Html2CanvasFn; jsPDF: JsPDFCtor }> | null =
    null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private demandeService: DemandeService,
    private toastService: ToastService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    public navCtrl: NavController
  ) {
    addIcons({
      arrowBackOutline,
      barbellOutline,
      businessOutline,
      closeOutline,
      cubeOutline,
      documentTextOutline,
      downloadOutline,
      layersOutline,
      locationOutline,
      logOutOutline,
      personOutline,
      pricetagOutline,
      printOutline,
      shareOutline,
      timeOutline,
    });
  }

  ngOnDestroy(): void {
    this.invalidatePdfCache();
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
        const nextFingerprint = this.buildOrdrePdfFingerprint(data);
        if (
          this.pdfCacheOrdreId === data.id &&
          this.pdfCacheFingerprint &&
          this.pdfCacheFingerprint !== nextFingerprint
        ) {
          this.invalidatePdfCache();
        }
        this.ordre = data;
        this.isLoading = false;
        DetailsPage.loadPdfLibs().catch(() => undefined);
      },
      error: (err) => {
        console.error('Error loading details', err);
        this.isLoading = false;
        this.showToast('Erreur lors du chargement des détails', 'danger');
      }
    });
  }

  async generatePDF() {
    if (!this.ordre) {
      return;
    }

    const template = document.getElementById('professional-pdf-template');
    if (!template) {
      this.showToast('Modèle de document introuvable', 'danger');
      return;
    }

    const fingerprint = this.buildOrdrePdfFingerprint(this.ordre);
    if (
      this.pdfCacheEntry &&
      this.pdfCacheOrdreId === this.ordre.id &&
      this.pdfCacheFingerprint === fingerprint
    ) {
      this.applyPdfCacheToUi();
      this.isPdfPreviewOpen = true;
      this.runChangeDetection();
      return;
    }

    this.isPdfGenerating = true;
    this.runChangeDetection();

    this.isPdfPreviewOpen = false;
    this.isPdfPreviewLoading = false;
    this.pdfPreviewError = null;
    this.canDownloadPdf = false;
    this.clearPreviewImage();

    try {
      const { html2canvas, jsPDF } = await DetailsPage.loadPdfLibs();
      await this.waitForTemplateImages(template);

      const canvas = await this.captureTemplateCanvas(html2canvas, template);
      if (!canvas.width || !canvas.height) {
        throw new Error('Canvas capture returned empty dimensions');
      }
      if (this.isCanvasMostlyBlank(canvas)) {
        throw new Error('Canvas capture returned blank content');
      }

      const previewDataUrl = canvas.toDataURL('image/jpeg', PDF_PREVIEW_JPEG_QUALITY);
      if (!previewDataUrl || previewDataUrl.length < 100) {
        throw new Error('Preview image data is empty');
      }

      this.setPreviewImage(previewDataUrl);

      this.pdfGenerationPromise = this.buildAndCachePdfBlob(
        previewDataUrl,
        canvas.width,
        canvas.height,
        jsPDF,
        this.ordre.id,
        fingerprint
      );
      try {
        await this.pdfGenerationPromise;
      } catch (pdfError) {
        console.error('Error building PDF file', pdfError);
        this.canDownloadPdf = false;
        await this.showToast(
          'Aperçu affiché, mais le fichier PDF n\'a pas pu être préparé',
          'warning'
        );
      }

      this.isPdfPreviewOpen = true;
      this.runChangeDetection();
    } catch (error) {
      console.error('Error generating PDF preview', error);
      this.pdfPreviewError =
        'Impossible de générer l\'aperçu. Réessayez ou téléchargez plus tard.';
      this.clearPreviewImage();
      this.isPdfPreviewOpen = true;
      this.runChangeDetection();
      await this.showToast('Erreur lors de la génération du PDF', 'danger');
    } finally {
      this.pdfGenerationPromise = null;
      this.isPdfGenerating = false;
      this.runChangeDetection();
    }
  }

  closePdfPreview(): void {
    this.isPdfPreviewOpen = false;
    this.isPdfPreviewLoading = false;
    this.pdfPreviewError = null;
    this.clearPreviewImage();
  }

  async downloadPdf(): Promise<void> {
    if (this.pdfGenerationPromise) {
      try {
        await this.pdfGenerationPromise;
      } catch {
        await this.showToast('Impossible de préparer le PDF', 'danger');
        return;
      }
    }

    if (!this.pdfBlob || this.pdfBlob.size < 100 || !this.ordre) {
      await this.showToast('Document pas encore prêt', 'warning');
      return;
    }

    const fileName = this.getPdfFileName();

    if (Capacitor.isNativePlatform()) {
      try {
        if (navigator.share && navigator.canShare?.({
          files: [new File([this.pdfBlob], fileName, { type: 'application/pdf' })],
        })) {
          const file = new File([this.pdfBlob], fileName, { type: 'application/pdf' });
          await navigator.share({ files: [file], title: fileName });
          await this.showToast('PDF partagé', 'success');
          return;
        }
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') {
          return;
        }
        console.warn('Native share failed, falling back to download link', error);
      }
    }

    try {
      const downloadUrl = this.pdfObjectUrl ?? URL.createObjectURL(this.pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (!this.pdfObjectUrl) {
        URL.revokeObjectURL(downloadUrl);
      }

      await this.showToast('Téléchargement démarré', 'success');
    } catch (error) {
      console.error('PDF download failed', error);
      await this.showToast('Échec du téléchargement', 'danger');
    }
  }

  private static loadPdfLibs(): Promise<{ html2canvas: Html2CanvasFn; jsPDF: JsPDFCtor }> {
    if (!DetailsPage.pdfLibsPromise) {
      DetailsPage.pdfLibsPromise = Promise.all([import('html2canvas'), import('jspdf')]).then(
        ([html2canvasMod, jsPDFMod]) => ({
          html2canvas: html2canvasMod.default,
          jsPDF: jsPDFMod.default,
        })
      );
    }
    return DetailsPage.pdfLibsPromise;
  }

  private async buildAndCachePdfBlob(
    previewDataUrl: string,
    canvasWidth: number,
    canvasHeight: number,
    jsPDF: JsPDFCtor,
    ordreId: number,
    fingerprint: string
  ): Promise<void> {
    const imgHeight = (canvasHeight * PDF_PAGE_IMG_WIDTH_MM) / canvasWidth;
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(previewDataUrl, 'JPEG', 1, 1, PDF_PAGE_IMG_WIDTH_MM, imgHeight);

    const blob = pdf.output('blob');
    this.revokePreviousPdfCacheEntry();

    const objectUrl = URL.createObjectURL(blob);
    this.pdfCacheOrdreId = ordreId;
    this.pdfCacheFingerprint = fingerprint;
    this.pdfCacheEntry = {
      previewDataUrl,
      blob,
      objectUrl,
    };

    this.pdfBlob = blob;
    this.pdfObjectUrl = objectUrl;
    this.canDownloadPdf = true;
  }

  private applyPdfCacheToUi(): void {
    if (!this.pdfCacheEntry) {
      return;
    }
    this.setPreviewImage(this.pdfCacheEntry.previewDataUrl);
    this.pdfBlob = this.pdfCacheEntry.blob;
    this.pdfObjectUrl = this.pdfCacheEntry.objectUrl;
    this.canDownloadPdf = true;
    this.isPdfPreviewLoading = false;
    this.pdfPreviewError = null;
    this.runChangeDetection();
  }

  private setPreviewImage(dataUrl: string): void {
    this.pdfPreviewImageUrl = dataUrl;
    this.pdfPreviewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
  }

  private clearPreviewImage(): void {
    this.pdfPreviewImageUrl = null;
    this.pdfPreviewSafeUrl = null;
  }

  private detachActivePdfFromUi(): void {
    this.pdfBlob = null;
    this.pdfObjectUrl = null;
    this.canDownloadPdf = false;
    this.clearPreviewImage();
  }

  private revokePreviousPdfCacheEntry(): void {
    if (this.pdfCacheEntry?.objectUrl) {
      URL.revokeObjectURL(this.pdfCacheEntry.objectUrl);
    }
    this.pdfCacheEntry = null;
    this.pdfCacheOrdreId = null;
    this.pdfCacheFingerprint = '';
  }

  private invalidatePdfCache(): void {
    this.revokePreviousPdfCacheEntry();
    this.detachActivePdfFromUi();
  }

  private async waitForTemplateImages(template: HTMLElement): Promise<void> {
    const images = Array.from(template.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );
  }

  private async captureTemplateCanvas(html2canvas: Html2CanvasFn, template: HTMLElement) {
    template.classList.add('pdf-capture-active');
    await this.yieldToUi();
    await this.yieldToUi();

    const templateHeight = Math.max(
      template.scrollHeight,
      template.offsetHeight,
      template.getBoundingClientRect().height,
      400
    );

    try {
      return await html2canvas(template, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: PDF_TEMPLATE_WIDTH_PX,
        windowWidth: PDF_TEMPLATE_WIDTH_PX,
        height: templateHeight,
        windowHeight: templateHeight,
        scrollX: 0,
        scrollY: 0,
      });
    } finally {
      template.classList.remove('pdf-capture-active');
    }
  }

  private isCanvasMostlyBlank(canvas: HTMLCanvasElement): boolean {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return true;
    }
    const sampleW = Math.min(80, canvas.width);
    const sampleH = Math.min(80, canvas.height);
    const { data } = ctx.getImageData(0, 0, sampleW, sampleH);
    let nonWhitePixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 248 || data[i + 1] < 248 || data[i + 2] < 248) {
        nonWhitePixels++;
      }
    }
    return nonWhitePixels < 8;
  }

  private runChangeDetection(): void {
    this.ngZone.run(() => this.cdr.detectChanges());
  }

  private buildOrdrePdfFingerprint(ordre: Demande): string {
    const todayKey = new Date().toISOString().slice(0, 10);
    const parts = [
      todayKey,
      ordre.statut,
      ordre.dateSaisie,
      ordre.nomclient,
      ordre.client,
      ordre.chargementNom,
      ordre.chargementAdr1,
      ordre.chargementVille,
      ordre.chargementDate,
      ordre.livraisonNom,
      ordre.livraisonAdr1,
      ordre.livraisonVille,
      ordre.livraisonDate,
      ordre.codeArticle,
      ordre.designation,
      ordre.poids,
      ordre.nombreColis,
      (ordre.commentaires ?? []).join('|'),
    ];
    return parts.join('\x1e');
  }

  private yieldToUi(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    });
  }

  private getPdfFileName(): string {
    const id = this.ordre?.id ?? 'document';
    const status = (this.ordre?.statut ?? '').toString().toUpperCase();
    const isDraft = status === 'NON_CONFIRME' || status === 'BROUILLON';
    const prefix = isDraft ? 'brouillon' : 'ordre';
    return `suivi-${prefix}-${id}.pdf`;
  }

  goToNotifications() {
    this.navCtrl.navigateForward('/notifications');
  }

  logout() {
    this.navCtrl.navigateRoot('/login');
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    await this.toastService.show(message, color);
  }
}

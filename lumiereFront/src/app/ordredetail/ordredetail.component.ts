import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdreService } from '../ordre.service';
import html2canvas from 'html2canvas';
// @ts-ignore
import jsPDF from 'jspdf';

@Component({
  selector: 'app-ordredetail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ordredetail.component.html',
  styleUrl: './ordredetail.component.css',
})
export class OrdredetailComponent implements OnInit {
  ordre: any = null;
  isLoading = true;
  loadError: string | null = null;

  constructor(
    private service: OrdreService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.queryParamMap.get('id');
    const id = idParam ? Number(idParam) : null;

    if (this.service.detail && (!id || this.service.detail.id === id)) {
      this.ordre = this.service.detail;
      this.isLoading = false;
      return;
    }

    if (!id || Number.isNaN(id)) {
      this.isLoading = false;
      this.loadError = 'Ordre introuvable.';
      return;
    }

    this.service.getById(id).subscribe({
      next: (data) => {
        this.ordre = data;
        this.service.detail = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.loadError = 'Impossible de charger les détails de l\'ordre.';
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/material/ordres']);
  }

  public generatePDF(): void {
    const DATA: any = document.getElementById('htmlData');
    if (!DATA) {
      return;
    }
    html2canvas(DATA).then((canvas) => {
      const fileWidth = 155;
      const fileHeight = (canvas.height * fileWidth) / canvas.width;
      const FILEURI = canvas.toDataURL('image/png');
      const PDF = new jsPDF('p', 'mm', 'a4');
      const position = 0;
      PDF.addImage(FILEURI, 'PNG', 0, position, fileWidth, fileHeight);

      const blob = PDF.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }
}

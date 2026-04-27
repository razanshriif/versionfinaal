import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdreService } from '../ordre.service';
import html2canvas from 'html2canvas';
// @ts-ignore
import jsPDF from 'jspdf';

@Component({
  selector: 'app-ordredetail',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './ordredetail.component.html',
  styleUrl: './ordredetail.component.css'
})
export class OrdredetailComponent {
  constructor(private service: OrdreService) { }
  ordre: any = this.service.detail;


  public generatePDF(): void {
    const DATA: any = document.getElementById('htmlData');
    html2canvas(DATA).then((canvas) => {
      const fileWidth = 155;
      const fileHeight = (canvas.height * fileWidth) / canvas.width;
      const FILEURI = canvas.toDataURL('image/png');
      const PDF = new jsPDF('p', 'mm', 'a4');
      const position = 0;
      PDF.addImage(FILEURI, 'PNG', 0, position, fileWidth, fileHeight);
      PDF.save('angular-demo.pdf');
    });
  }
}




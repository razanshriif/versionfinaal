import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
    selector: 'app-report-view',
    standalone: true,
    imports: [CommonModule, DatePipe, RouterModule],
    template: `
    <div class="report-page">
      <!-- ─── NAV / ACTIONS (HIDDEN ON PRINT) ─── -->
      <div class="report-nav no-print">
        <button class="btn-back" (click)="goBack()">
          <i class="fa fa-arrow-left"></i> Retour
        </button>
        <button class="btn-print" (click)="printReport()">
          <i class="fa fa-print"></i> Imprimer
        </button>
      </div>

      <!-- ─── REPORT CONTENT ─── -->
      <div class="report-content" id="printable-area">
        
        <!-- Enterprise Header (Styled like Excel) -->
        <header class="report-header">
          <div class="orange-banner">
            <img src="assets/otflow-horizontal.png" alt="OTFLOW" class="report-logo">
          </div>
          <div class="header-divider"></div>
          <div class="header-info">
            <h1>{{ title }}</h1>
            <div class="meta-row">
              <span class="meta-item"><strong>Date :</strong> {{ today | date:'dd/MM/yyyy' }}</span>
              <span class="meta-item"><strong>Généré par :</strong> OTFLOW TRANSPORT</span>
            </div>
          </div>
        </header>

        <!-- Data Table -->
        <main class="report-main">
          <table class="report-table">
            <thead>
              <tr>
                <th *ngFor="let col of columns">{{ col.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of data; let i = index" [class.stripe]="i % 2 !== 0">
                <td *ngFor="let col of columns">
                  {{ getCellValue(row, col.key) }}
                </td>
              </tr>
            </tbody>
          </table>
        </main>

        <!-- Footer -->
        <footer class="report-footer">
          <p>© {{ today | date:'yyyy' }} OTFLOW TRANSPORT - Document Professionnel</p>
          <p class="page-number">Page 1 / 1</p>
        </footer>
      </div>
    </div>
  `,
    styles: [`
    .report-page { background: #f4f7f6; min-height: 100vh; padding: 20px; font-family: 'Inter', sans-serif; }
    
    .report-nav { display: flex; justify-content: space-between; max-width: 1000px; margin: 0 auto 20px; }
    .btn-back, .btn-print { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: 0.2s; }
    .btn-back { background: #e2e8f0; color: #475569; }
    .btn-print { background: #ea580c; color: white; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25); }
    .btn-back:hover { background: #cbd5e1; }
    .btn-print:hover { background: #c2410c; transform: translateY(-1px); }

    .report-content { background: white; max-width: 1000px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden; }

    /* Header styling matching Excel */
    .report-header { text-align: center; }
    .orange-banner { background: #ea580c; padding: 30px 0; display: flex; justify-content: center; }
    .report-logo { height: 100px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
    .header-divider { height: 8px; background: #0f172a; margin-bottom: 30px; }
    .header-info { padding: 0 40px 30px; }
    .header-info h1 { margin: 0; font-size: 2rem; color: #0f172a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .meta-row { margin-top: 15px; display: flex; justify-content: center; gap: 40px; color: #64748b; font-size: 1rem; }

    /* Table styling matching Excel */
    .report-main { padding: 0 40px 60px; }
    .report-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .report-table th { background: #0f172a; color: white; padding: 14px; text-align: left; font-size: 0.85rem; text-transform: uppercase; font-weight: 700; border: 1px solid #1e293b; }
    .report-table td { padding: 12px 14px; border: 1px solid #e2e8f0; font-size: 0.95rem; color: #334155; }
    .stripe { background-color: #f8fafc; }

    /* Footer */
    .report-footer { padding: 30px 40px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; color: #94a3b8; font-size: 0.85rem; }

    @media print {
      .no-print { display: none !important; }
      .report-page { padding: 0; background: white; }
      .report-content { box-shadow: none; border: none; width: 100%; max-width: 100%; }
      .report-table th { background: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
      .stripe { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
      .orange-banner { background: #ea580c !important; -webkit-print-color-adjust: exact; }
      .header-divider { background: #0f172a !important; -webkit-print-color-adjust: exact; }
    }
  `]
})
export class ReportViewComponent implements OnInit {
    title: string = 'Rapport';
    columns: { key: string, label: string }[] = [];
    data: any[] = [];
    today = new Date();

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        // We receive the data via the state passed in the router
        const state = window.history.state;
        if (state && state.data) {
            this.title = state.title || 'Rapport sans titre';
            this.columns = state.columns || [];
            this.data = state.data || [];
        }
    }

    getCellValue(row: any, key: string): any {
        return row[key] !== null && row[key] !== undefined ? row[key] : '-';
    }

    printReport(): void {
        window.print();
    }

    goBack(): void {
        window.history.back();
    }
}




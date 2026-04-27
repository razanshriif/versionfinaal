import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Article } from '../models/article.model';
import { Subscription } from 'rxjs';
import { ArticleService } from '../services/article.service';
import { AuthService } from '../auth.service';
import { NotificationService } from '../notification.service';
import { ExportService } from '../export.service';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.css']
})
export class ArticleComponent implements OnInit, OnDestroy {
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  searchTerm: string = '';
  article: Article = {};
  mode: 'list' | 'create' | 'edit' | 'detail' = 'list';
  private subscription: Subscription = new Subscription();

  constructor(
    private articleService: ArticleService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private ser: NotificationService,
    private exportService: ExportService
  ) { }

  user = {
    id: 0,
    firstname: "",
    lastname: "",
    email: "",
    passwd: "",
    role: ""
  }

  profile() {
    this.authService.profile().subscribe(
      (data) => this.user = data,
      (error) => console.error('Erreur lors du chargement du profil', error)
    );
  }

  ngOnInit(): void {
    this.loadArticles();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        if (this.mode === 'edit' || this.mode === 'detail') {
          this.loadArticle(Number(id));
        }
      }
    });

    this.profile();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadArticles(): void {
    this.subscription.add(this.articleService.getArticles().subscribe(data => {
      this.articles = data;
      this.searchArticles();
      this.mode = 'list';
    }));
  }

  loadArticle(id: number): void {
    this.subscription.add(this.articleService.getArticle(id).subscribe(data => {
      this.article = data;
      this.mode = 'detail';
    }));
  }

  createArticle(): void {
    if (this.article) {
      this.subscription.add(this.articleService.createArticle(this.article).subscribe(() => {
        this.mode = 'list';
        this.loadArticles();

        this.ser.notification.type = "Article";
        this.ser.notification.message = "Création d'un nouveau Article :" + this.article.id + " par :" + this.user.firstname + " " + this.user.lastname;
        this.ser.ajouternotification(this.ser.notification);
      }));
    }
  }

  updateArticle(): void {
    if (this.article) {
      this.subscription.add(this.articleService.createArticle(this.article).subscribe(() => {
        this.mode = 'list';
        this.loadArticles();
      }));
    }
  }

  deleteArticle(id: number): void {
    this.subscription.add(this.articleService.deleteArticle(id).subscribe(() => {
      this.mode = 'list';
      this.loadArticles();
      this.ser.notification.type = "Article";
      this.ser.notification.message = "Suppression d'un Article :" + id + " par :" + this.user.firstname + " " + this.user.lastname;
      this.ser.ajouternotification(this.ser.notification);
    }));
  }

  onCreate(): void {
    this.article = {
      codeArticle: '',
      label: '',
      type: '',
      typeDeMarchandise: 0,
      typeDeRemorque: '',
      unite: '',
      quantiteMinimum: 0,
      prixUnitaire: 0,
      vente: 0,
      achat: 0
    };
    this.mode = 'create';
  }

  onEdit(i: any): void {
    this.article = i;
    this.mode = 'edit';
  }

  onDetail(i: any): void {
    this.article = i;
    this.mode = 'detail';
  }

  onBack(): void {
    this.router.navigate(['/articles']);
    this.mode = 'list';
  }

  searchArticles() {
    this.filteredArticles = this.articles.filter(a =>
      (a.label ? a.label.toLowerCase().includes(this.searchTerm.toLowerCase()) : false) ||
      (a.codeArticle ? a.codeArticle.toLowerCase().includes(this.searchTerm.toLowerCase()) : false)
    );
  }

  exportToExcel() {
    const columns = [
      { header: 'Code Article', key: 'codeArticle' },
      { header: 'Libellé', key: 'label' },
      { header: 'Type', key: 'type' },
      { header: 'Unité', key: 'unite' },
      { header: 'Quantité Min', key: 'quantiteMinimum' },
      { header: 'Prix Unitaire', key: 'prixUnitaire' }
    ];

    const data = this.filteredArticles.map(a => ({
      codeArticle: a.codeArticle,
      label: a.label,
      type: a.type,
      unite: a.unite,
      quantiteMinimum: a.quantiteMinimum,
      prixUnitaire: a.prixUnitaire
    }));

    this.exportService.exportExcel(data, 'Liste des Articles', 'Articles_Export', columns);
  }
}




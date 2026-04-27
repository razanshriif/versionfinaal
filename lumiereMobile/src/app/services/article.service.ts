import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Article } from '../models/article.model';

@Injectable({
    providedIn: 'root'
})
export class ArticleService {

    private api = `${environment.apiUrl}/v1/articles`;

    constructor(private http: HttpClient) { }

    private authHeaders() {
        return {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        };
    }

    private static readonly ARTICLES: any[] = [
        { codeArticle: 'T001', label: 'TRANSPORT TRANSIT', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T002', label: 'TRANSPORT FRAIS GRP // 4°C', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T003', label: 'TRANSPORT CONTRÖLÈ // 12°C', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T004', label: 'TRANSPORT AMBIANT', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T005', label: 'TRANSPORT CATALOGUE', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T006', label: 'TRANSPORT SUR ACHAT', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T007', label: 'TRANSPORT DU FRAIS // 4°C', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T008', label: 'TRANSPORT SURGELE // -22°C', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T009', label: 'STATIONNEMENT', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T010', label: 'TRNSPORT OCT', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T011', label: 'TRANSPORT FRUIT', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T012', label: 'TRANSPORT LILAS', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T013', label: 'TRANSPORT RETOUR', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T014', label: 'TRANSPORT TECHNIQUE', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T015', label: 'TRANSFERT INTER DEPOT FACTURE', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T016', label: 'TRANSFER INTER MAGASIN', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T017', label: 'TRANSPORT SPOT', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T019', label: 'TRANSPORT RETOUR EMBALLAGE', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T020', label: 'TRANSPORT TOURNE SPECIAL', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T022', label: 'LAVAGE-GRAISSAGE-VIDANGE', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T023', label: 'TRANSPORT-TRACTAGE', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T024', label: 'REPARATION-MECA-ELECT-PNEUM', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T025', label: 'DISPATCHING', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T026', label: 'TRANSFERT EMBALLAGE INTER-SITE', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T027', label: 'TRANSPORT PERSONNEL', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T028', label: 'TRANFERT INTER DEPOT NON FACTU', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T029', label: 'TRANSPORT SAV', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T030', label: 'VISITE TECHNIQUE', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T031', label: 'REPARATION-FRIGORIFIQUE', vente: 'TN', achat: 'AT' },
        { codeArticle: 'T032', label: 'TRANSPORT MISSION PARC', vente: 'TN', achat: 'TN' },
        { codeArticle: 'T033', label: 'TRANSPORT INTER DEPOT ANNEXE', vente: 'TN', achat: 'TN' },
        { codeArticle: 'T034', label: 'Missions de déchargement.', vente: 'TN', achat: 'AT' }
    ];

    getArticles(): Observable<any> {
        // Returning static list as observable
        return new Observable(observer => {
            observer.next(ArticleService.ARTICLES);
            observer.complete();
        });
    }

    getArticle(id: number): Observable<any> {
        return new Observable(observer => {
            const art = ArticleService.ARTICLES.find(a => a.id === id);
            observer.next(art);
            observer.complete();
        });
    }

    searchByCode(code: string): Observable<any[]> {
        return new Observable(observer => {
            const results = ArticleService.ARTICLES.filter(a =>
                a.codeArticle.toLowerCase().includes(code.toLowerCase())
            );
            observer.next(results);
            observer.complete();
        });
    }
}


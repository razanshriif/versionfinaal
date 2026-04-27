export interface Article {
    id: number;
    codeArticle: string;
    label: string;
    type?: string;
    typeDeMarchandise?: number;
    typeDeRemorque?: string;
    unite?: string;
    quantiteMinimum?: number;
    prixUnitaire?: number;
    vente?: number;
    achat?: number;
}


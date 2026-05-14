export class Article {
    constructor(
        public id?: number,
        public codeArticle?: string,
        public label?: string,
        public type?: string,
        public typeDeMarchandise?: number,
        public typeDeRemorque?: string,
        public unite?: string,
        public quantiteMinimum?: number,
        public prixUnitaire?: number,
        public vente?: number,
        public achat?: number
    ) {}
}




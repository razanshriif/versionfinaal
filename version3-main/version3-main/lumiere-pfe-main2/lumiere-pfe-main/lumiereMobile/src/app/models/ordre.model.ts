
export interface Ordre {
    id?: number;
    orderNumber?: string;
    client?: string;
    nomclient?: string;
    matricule?: string;
    siteclient?: string;
    idedi?: string;
    codeclientcharg?: string;
    chargementNom?: string;
    chargementAdr1?: string;
    chargementAdr2?: string;
    chargementVille?: string;
    codepostalcharg?: string;
    chargementDate?: string | Date;
    codeclientliv?: string;
    livraisonNom?: string;
    livraisonAdr1?: string;
    livraisonAdr2?: string;
    codepostalliv?: string;
    livraisonVille?: string;
    livraisonDate?: string | Date;
    codeArticle?: string;
    designation?: string;
    poids?: number;
    volume?: number;
    nombrePalettes: number;
    nombreColis?: number;
    longueur?: number;
    statut?: string;
    commentaires?: string[];
    dateSaisie?: string | Date;
}


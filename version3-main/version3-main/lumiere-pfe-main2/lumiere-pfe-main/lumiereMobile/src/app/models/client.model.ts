export interface Client {
  id?: number;
  code?: number;
  codeclient?: string;

  civilite?: string;
  type?: string;
  statut?: string;
  sType?: string;
  confiere?: boolean;

  societeFacturation?: string;
  siteExploitation?: string;
  service?: string;

  nom?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  codepostal?: number;

  client?: string;
  idEdi?: string;
  idTva?: string;
  siret?: string;
  codeIso?: number;

  contact?: string;
  numeroPortable?: string;
  telephone?: string;
  fax?: string;
  email?: string;
}


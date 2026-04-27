-- Seed articles (INSERT IGNORE = safe to run on every restart, no duplicates)
INSERT IGNORE INTO `article` (`id`, `label`, `achat`, `code_article`, `prix_unitaire`, `quantite_minimum`, `type`, `type_de_marchandise`, `type_de_remorque`, `unite`, `vente`)
VALUES
  (16, 'Marchandise Température Ambiante',    0, 'T-001', 0, 1, 'Logistique', 1, 'Standard', 'Palette', 0),
  (17, 'Marchandise Réfrigérée (0°C à 4°C)',  0, 'T-002', 0, 1, 'Logistique', 1, 'Frigo',    'Palette', 0),
  (18, 'Marchandise Surgelée (-25°C à -18°C)',0, 'T-003', 0, 1, 'Logistique', 1, 'Frigo',    'Palette', 0),
  (19, 'Marchandise Fragile',                 0, 'T-004', 0, 1, 'Logistique', 2, 'Standard', 'Colis',  0),
  (20, 'Marchandise Industrielle Lourde',     0, 'T-005', 0, 1, 'Logistique', 3, 'Plateau',  'Palette', 0),
  (21, 'Marchandise ADR (Dangereuse)',         0, 'T-006', 0, 1, 'Logistique', 4, 'ADR',      'Colis',  0);

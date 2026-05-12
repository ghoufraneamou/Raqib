// ── Regulatory Document Catalog ─────────────────────────────────
// Based on Circulaire N° 771 D/DMP/18 du 25 octobre 2023
// and AMMPS cosmetic product registration requirements

export type EntityType = "societe" | "cooperative";
export type ActivityType = "ImF" | "ImV" | "FL" | "FE";
export type RequestType = "nouvel-enregistrement" | "renouvellement" | "modification" | "visa-publicite";

export interface DocumentRequirement {
  document_id: string;
  name: string;
  mandatory: boolean;
  /** Only required under certain conditions */
  conditional: boolean;
  allowed_formats: string[];
  /** Which entity types this applies to */
  entity_types?: EntityType[];
  /** Which activity types this applies to (ImF, ImV, FL, FE) */
  activity_types?: ActivityType[];
  /** Only for specific request types */
  request_types?: RequestType[];
  /** Only for cannabis products */
  cannabis_only?: boolean;
  /** Only for modification requests */
  modification_only?: boolean;
  /** Acceptability criteria per circulaire */
  criteria: string[];
}

// ═══════════════════════════════════════════════════════════════
// SECTION A: Cooperative Declaration Documents (1-9)
// ═══════════════════════════════════════════════════════════════

export const COOPERATIVE_DOCUMENTS: DocumentRequirement[] = [
  {
    document_id: "COOP_01_FORMULAIRE",
    name: "Formulaire de déclaration",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    entity_types: ["cooperative"],
    criteria: [
      "Formulaire officiel en vigueur",
      "Toutes les rubriques renseignées sans omission",
      "Activité déclarée clairement précisée (fabrication, exportation)",
      "Informations cohérentes avec les autres documents du dossier",
      "Daté",
      "Signé par le représentant légal",
      "Cacheté par la coopérative",
      "Document lisible, sans ratures",
    ],
  },
  {
    document_id: "COOP_02_PLAN_ARCHI",
    name: "Plan architectural",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf", "jpg", "png"],
    entity_types: ["cooperative"],
    criteria: [
      "Plan architectural joint au dossier",
      "Plan clair, lisible",
      "Identification du local (adresse ou référence) conforme aux autres pièces du dossier",
      "Cohérence du plan avec l'activité déclarée (fabrication et/ou stockage)",
      "Signé et cacheté par le représentant légal de la coopérative",
      "Présentation des différentes zones de la coopérative",
    ],
  },
  {
    document_id: "COOP_03_PERSONNEL",
    name: "Liste du personnel",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf", "xlsx"],
    entity_types: ["cooperative"],
    criteria: [
      "Liste du personnel jointe au dossier",
      "Document clair et lisible",
      "Mention du nom et prénom de chaque employé",
      "Mention de la fonction et du poste occupé au sein de la coopérative",
      "Liste cohérente avec l'activité déclarée de la coopérative",
      "Document signé et cacheté par le représentant légal de la coopérative",
    ],
  },
  {
    document_id: "COOP_04_STATUT",
    name: "Copie scannée de l'original du statut de la coopérative (approuvé par le tribunal)",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    entity_types: ["cooperative"],
    criteria: [
      "Une copie scannée lisible du statut complet",
      "Le cachet d'approbation du tribunal compétent",
      "Les signatures légales requises",
      "La dénomination exacte de la coopérative (identique aux autres pièces du dossier)",
      "La mention claire de toutes les activités objet de la déclaration (fabrication, exportation)",
      "La date d'approbation par le tribunal",
    ],
  },
  {
    document_id: "COOP_05_PV_AG",
    name: "Copie du dernier PV de l'assemblée générale spécifiant le responsable légal",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    entity_types: ["cooperative"],
    criteria: [
      "Copie scannée lisible et complète",
      "PV le plus récent",
      "Nom exact de la coopérative",
      "Nom et prénom du responsable légal",
      "Fonction clairement précisée (Président, Gérant, …)",
      "Signatures obligatoires",
    ],
  },
  {
    document_id: "COOP_06_ARRETE_CREATION",
    name: "Copie de l'arrêté de création de la coopérative ou attestation de dépôt au Tribunal",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    entity_types: ["cooperative"],
    criteria: [
      "Copie scannée lisible",
      "Document officiel délivré par l'autorité compétente / Tribunal",
      "Nom exact de la coopérative",
      "Date de création ou date de dépôt du dossier",
      "Numéro d'enregistrement ou de dépôt",
      "Cachet et/ou signature de l'autorité émettrice",
    ],
  },
  {
    document_id: "COOP_07_ANRAC",
    name: "Copie de l'autorisation de l'ANRAC (produits à base d'extraits de cannabis)",
    mandatory: false,
    conditional: true,
    cannabis_only: true,
    allowed_formats: ["pdf"],
    entity_types: ["cooperative"],
    criteria: [
      "Copie de l'autorisation jointe au dossier",
      "Document lisible",
      "Autorisation délivrée par l'ANRAC",
      "Autorisation encore valide",
      "Le domaine d'activité mentionné correspond à l'activité déclarée par la coopérative",
      "Correspondance entre la raison sociale figurant sur l'autorisation et celle du dossier",
    ],
  },
  {
    document_id: "COOP_08_DECL_INITIALE",
    name: "Copie de la déclaration initiale",
    mandatory: false,
    conditional: true,
    modification_only: true,
    allowed_formats: ["pdf"],
    entity_types: ["cooperative"],
    criteria: [
      "Copie de la déclaration initiale jointe au dossier",
      "Document clair et lisible",
      "Déclaration datée",
      "Contenu concordant avec l'activité déclarée actuelle",
      "Même raison sociale et adresse que dans le reste du dossier",
    ],
  },
  {
    document_id: "COOP_09_JUSTIF_MODIF",
    name: "Justificatif de la modification",
    mandatory: false,
    conditional: true,
    modification_only: true,
    allowed_formats: ["pdf", "docx"],
    entity_types: ["cooperative"],
    criteria: [
      "Justificatif de modification joint au dossier",
      "Document clair et lisible",
      "La modification concernée est identifiée (changement d'adresse, d'activité, de représentant, etc.)",
      "Le document correspond réellement à l'élément modifié déclaré",
      "Date du document cohérente avec la demande",
      "Concordance avec les autres pièces mises à jour du dossier",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// SECTION B: General Cosmetic Product Documents
// ═══════════════════════════════════════════════════════════════

export const GENERAL_DOCUMENTS: DocumentRequirement[] = [
  {
    document_id: "GEN_LETTRE_DEMANDE",
    name: "Lettre de demande signée par le représentant légal, adressée au Directeur de l'AMMPS",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    activity_types: ["ImF", "ImV", "FL", "FE"],
    criteria: [
      "Signée et cachetée par le représentant légal",
      "Adressée formellement au Directeur de l'AMMPS",
      "Sur papier à en-tête officiel",
    ],
  },
  {
    document_id: "GEN_FICHE_SIGNALETIQUE",
    name: "Fiche signalétique (conforme au modèle annexe )",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    activity_types: ["ImF", "ImV", "FL", "FE"],
    criteria: [
      "Toutes les rubriques remplies",
      "Conforme au modèle officiel",
      "Signée par le représentant légal",
    ],
  },
  {
    document_id: "GEN_ATTESTATION_DECLARATION",
    name: "Copie de l'attestation de déclaration de la société précisant le type d'activité",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    activity_types: ["ImF", "ImV", "FL", "FE"],
    criteria: [
      "Copie lisible et en cours de validité",
      "Mention explicite du type d'activité (importation, fabrication, etc.)",
    ],
  },
  {
    document_id: "GEN_ATTESTATION_FABRICANT",
    name: "Attestation originale ou certifiée conforme du fabricant autorisant la commercialisation",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    activity_types: ["ImF", "ImV", "FL", "FE"],
    criteria: [
      "Document original ou copie certifiée conforme",
      "Contresigné par le représentant légal de l'établissement marocain",
    ],
  },
  {
    document_id: "GEN_MAQUETTE_CONDITIONNEMENT",
    name: "Maquette du modèle vente des conditionnements primaire et secondaire (fr/ar)",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf", "jpg", "png"],
    activity_types: ["ImF", "ImV", "FL", "FE"],
    criteria: [
      "Projet d'étiquetage conforme",
      "Charte graphique complète",
      "Dimensions et couleurs définitives",
      "Aucune modification sans validation AMMPS",
    ],
  },
  {
    document_id: "GEN_PHOTO_EMBALLAGE",
    name: "Photographie en couleur recto-verso avec emballage",
    mandatory: true,
    conditional: false,
    allowed_formats: ["jpg", "png", "pdf"],
    activity_types: ["ImF", "ImV", "FL", "FE"],
    criteria: [
      "Photographie nette, couleurs fidèles",
      "Montre l'emballage complet",
    ],
  },
  {
    document_id: "GEN_NOTICE_UTILISATION",
    name: "Copie de la notice d'utilisation en langue française et/ou arabe",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    activity_types: ["ImF", "ImV", "FL", "FE"],
    criteria: [
      "Notice claire, conforme au produit",
      "En langue exigée (français et/ou arabe)",
    ],
  },
  {
    document_id: "GEN_ACCUSE_CAPM",
    name: "Accusé de réception de la fiche de sécurité déposée auprès du CAPM",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    activity_types: ["ImF", "ImV", "FL", "FE"],
    criteria: [
      "Accusé officiel du Centre Antipoison et de Pharmacovigilance Marocain (CAPM)",
      "Correspondance avec la formule déclarée",
    ],
  },
  {
    document_id: "GEN_CERT_VENTE_LIBRE",
    name: "Certificat de vente libre original ou certifié conforme",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    activity_types: ["ImF", "ImV", "FL", "FE"],
    criteria: [
      "Document daté, signé, et cacheté",
      "Validité non expirée",
      "Contresigné par le représentant légal marocain",
    ],
  },
  {
    document_id: "GEN_CONTRAT_SOUS_TRAITANCE",
    name: "Copie du contrat de sous-traitance entre la société marocaine et le fabricant",
    mandatory: false,
    conditional: true,
    allowed_formats: ["pdf"],
    activity_types: ["ImV", "FE"],
    criteria: [
      "Contrat signé par les deux parties",
      "Précisant les responsabilités et modalités de fabrication",
    ],
  },
  {
    document_id: "GEN_CERT_OMPIC",
    name: "Certificat d'enregistrement à l'OMPIC (le cas échéant)",
    mandatory: false,
    conditional: true,
    allowed_formats: ["pdf"],
    activity_types: ["ImF", "ImV", "FL", "FE"],
    criteria: [
      "Certificat lisible, valide",
      "Correspondant à la marque déposée",
    ],
  },
  {
    document_id: "GEN_AUTORISATION_FABRICANT",
    name: "Autorisation d'exercice du fabricant dans le pays d'origine ou équivalent",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    activity_types: ["ImF", "ImV"],
    criteria: [
      "Copie certifiée conforme à l'original",
      "Document valide",
    ],
  },
  {
    document_id: "GEN_CERT_BPF",
    name: "Certificat de Bonnes Pratiques de Fabrication (BPF) ou équivalent",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    activity_types: ["ImF", "ImV", "FL", "FE"],
    criteria: [
      "Certificat conforme à ISO 22716 ou BPF",
      "Valide à la date du dépôt",
    ],
  },
  {
    document_id: "GEN_DECLARATION_HONNEUR",
    name: "Déclaration sur l'honneur légalisée attestant du développement selon les normes internationales",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf"],
    activity_types: ["ImF", "ImV", "FL", "FE"],
    criteria: [
      "Datée, signée, légalisée",
      "Atteste qualité, sécurité, efficacité",
      "Mentionne l'archivage du dossier technique",
    ],
  },
  {
    document_id: "GEN_DECL_NON_MODIF",
    name: "Déclaration sur l'honneur attestant qu'aucune modification n'a été apportée depuis le dernier enregistrement",
    mandatory: true,
    conditional: true,
    allowed_formats: ["pdf"],
    request_types: ["renouvellement"],
    criteria: [
      "Signée, datée, cachetée par le représentant légal",
    ],
  },
  {
    document_id: "GEN_CERT_ENREGISTREMENT_RENOUV",
    name: "Copie du certificat d'enregistrement (pour renouvellement quinquennal)",
    mandatory: true,
    conditional: true,
    allowed_formats: ["pdf"],
    request_types: ["renouvellement"],
    criteria: [
      "Copie lisible du certificat précédent",
    ],
  },
  {
    document_id: "GEN_USB_FICHIERS",
    name: "Fichiers numérisés (format électronique)",
    mandatory: true,
    conditional: false,
    allowed_formats: ["pdf", "zip"],
    activity_types: ["ImF", "ImV", "FL", "FE"],
    criteria: [
      "Fichiers numérotés, clairement identifiés",
      "Complets selon le module AMMPS",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// SECTION C: Cannabis-specific Documents
// ═══════════════════════════════════════════════════════════════

export const CANNABIS_DOCUMENTS: DocumentRequirement[] = [
  {
    document_id: "CANN_AUTORISATION_ANRAC",
    name: "Autorisation délivrée par l'ANRAC précisant le type d'activité",
    mandatory: true,
    conditional: true,
    cannabis_only: true,
    allowed_formats: ["pdf"],
    criteria: [
      "Autorisation valide et spécifique à l'activité déclarée",
    ],
  },
  {
    document_id: "CANN_FICHE_TECHNIQUE_MP",
    name: "Fiche technique de la matière première contenant le dérivé du cannabis",
    mandatory: true,
    conditional: true,
    cannabis_only: true,
    allowed_formats: ["pdf"],
    criteria: [
      "Doit préciser la composition et la concentration du dérivé du cannabis",
    ],
  },
  {
    document_id: "CANN_FDS_MP",
    name: "Fiche de sécurité de la matière première contenant le dérivé du cannabis",
    mandatory: true,
    conditional: true,
    cannabis_only: true,
    allowed_formats: ["pdf"],
    criteria: [
      "Conforme au format international (FDS)",
      "Signée par le fournisseur",
    ],
  },
  {
    document_id: "CANN_ANALYSE_CBD_THC",
    name: "Bulletin d'analyse du produit fini précisant le dosage du CBD et du THC",
    mandatory: true,
    conditional: true,
    cannabis_only: true,
    allowed_formats: ["pdf"],
    criteria: [
      "Délivré par un laboratoire reconnu par l'ANRAC",
      "Daté, signé, cacheté",
    ],
  },
  {
    document_id: "CANN_ANALYSE_CBD",
    name: "Bulletin d'analyse de l'extrait du cannabis (cannabidiol) précisant le dosage du CBD",
    mandatory: true,
    conditional: true,
    cannabis_only: true,
    allowed_formats: ["pdf"],
    criteria: [
      "Délivré par un laboratoire reconnu par l'ANRAC",
      "Daté, signé, cacheté",
    ],
  },
  {
    document_id: "CANN_DECL_THC_ZERO",
    name: "Déclaration sur l'honneur légalisée attestant que la teneur en THC est égale à zéro",
    mandatory: true,
    conditional: true,
    cannabis_only: true,
    allowed_formats: ["pdf"],
    criteria: [
      "Datée, signée, légalisée par le représentant légal",
    ],
  },
  {
    document_id: "CANN_STABILITE",
    name: "Rapport d'étude de stabilité du produit fini",
    mandatory: true,
    conditional: true,
    cannabis_only: true,
    allowed_formats: ["pdf"],
    criteria: [
      "Signé par le responsable légal",
      "Inclut protocole, méthodes, résultats et conclusion",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// Combined catalog with filtering helpers
// ═══════════════════════════════════════════════════════════════

export const ALL_DOCUMENTS = [
  ...COOPERATIVE_DOCUMENTS,
  ...GENERAL_DOCUMENTS,
  ...CANNABIS_DOCUMENTS,
];

export function getApplicableDocuments(
  entityType: EntityType,
  activityTypes: ActivityType[],
  requestType: RequestType,
  hasCannabis: boolean,
  isModification: boolean,
): DocumentRequirement[] {
  return ALL_DOCUMENTS.filter(doc => {
    // Entity type filter
    if (doc.entity_types && !doc.entity_types.includes(entityType)) return false;

    // Activity type filter
    if (doc.activity_types && doc.activity_types.length > 0) {
      if (!activityTypes.some(at => doc.activity_types!.includes(at))) return false;
    }

    // Request type filter
    if (doc.request_types && !doc.request_types.includes(requestType)) return false;

    // Cannabis filter
    if (doc.cannabis_only && !hasCannabis) return false;

    // Modification filter
    if (doc.modification_only && !isModification) return false;

    return true;
  });
}

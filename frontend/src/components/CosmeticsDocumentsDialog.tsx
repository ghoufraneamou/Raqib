import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Building2,
  Package,
  ClipboardList,
  Settings,
  ListOrdered,
  Edit,
  Leaf,
  Search,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  Coins,
  Sparkles,
} from "lucide-react";

import CosmeticsRegistrationForm from "./cosmetics/CosmeticsRegistrationForm";

interface CosmeticsDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DocItem = {
  title: string;
  applies?: string;
  criteria: string[];
  conditional?: boolean;
  cannabis?: boolean;
};

type SectionItem = {
  value: string;
  letter: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeType?: "default" | "green" | "amber";
  icon: any;
  iconClass: string;
  docs?: DocItem[];
  custom?: "modification" | "format" | "order";
};

const sections: SectionItem[] = [
  {
    value: "section-coop",
    letter: "A",
    title: "Déclaration d'une Coopérative",
    subtitle:
      "Documents requis pour la déclaration d'une coopérative de fabrication et d'exportation des produits cosmétiques et d'hygiène corporelle.",
    badge: "Circulaire N° 771",
    icon: Building2,
    iconClass: "bg-emerald-100 text-emerald-700",
    docs: [
      {
        title: "Formulaire de déclaration",
        criteria: [
          "Formulaire officiel en vigueur",
          "Toutes les rubriques renseignées sans omission",
          "Activité déclarée clairement précisée",
          "Informations cohérentes avec les autres documents",
          "Daté, signé et cacheté",
          "Document lisible, sans ratures",
        ],
      },
      {
        title: "Plan architectural",
        criteria: [
          "Plan clair et lisible",
          "Identification du local conforme",
          "Cohérence avec l'activité déclarée",
          "Signé et cacheté",
          "Présentation des différentes zones",
        ],
      },
      {
        title: "Liste du personnel",
        criteria: [
          "Document clair et lisible",
          "Nom, prénom, fonction et poste de chaque employé",
          "Liste cohérente avec l'activité déclarée",
          "Signé et cacheté",
        ],
      },
      {
        title: "Copie scannée du statut de la coopérative approuvé par le tribunal",
        criteria: [
          "Copie lisible du statut complet",
          "Cachet d'approbation du tribunal",
          "Signatures légales requises",
          "Dénomination exacte",
          "Mention claire des activités",
          "Date d'approbation",
        ],
      },
      {
        title: "Copie du dernier PV de l'assemblée générale",
        criteria: [
          "PV le plus récent",
          "Nom exact de la coopérative",
          "Nom du responsable légal",
          "Fonction clairement précisée",
          "Signatures obligatoires",
        ],
      },
      {
        title: "Copie de l'arrêté de création ou attestation de dépôt au Tribunal",
        criteria: [
          "Document officiel délivré par l'autorité compétente",
          "Nom exact de la coopérative",
          "Date ou numéro d'enregistrement",
          "Cachet et/ou signature de l'autorité émettrice",
        ],
      },
      {
        title: "Autorisation de l'ANRAC",
        criteria: [
          "Autorisation ANRAC valide",
          "Domaine d'activité correspondant",
          "Raison sociale conforme au dossier",
        ],
        conditional: true,
        cannabis: true,
      },
    ],
    custom: "modification",
  },
  {
    value: "section-general",
    letter: "B",
    title: "Documents Généraux du Produit",
    subtitle:
      "Documents requis selon le type d'activité : ImF, ImV, FL ou FE.",
    badge: "ImF / ImV / FL / FE",
    icon: Package,
    iconClass: "bg-blue-100 text-blue-700",
    docs: [
      {
        title: "Lettre de demande signée, adressée au Directeur de l'AMMPS",
        applies: "ImF / ImV / FL / FE",
        criteria: ["Signée, cachetée, sur papier à en-tête officiel"],
      },
      {
        title: "Fiche signalétique conforme au modèle annexe ",
        applies: "ImF / ImV / FL / FE",
        criteria: ["Toutes rubriques remplies, conforme au modèle officiel"],
      },
      {
        title: "Attestation de déclaration de la société précisant le type d'activité",
        applies: "ImF / ImV / FL / FE",
        criteria: ["Copie lisible, valide, mention explicite de l'activité"],
      },
      {
        title: "Attestation du fabricant autorisant la commercialisation",
        applies: "ImF / ImV / FL / FE",
        criteria: ["Original ou copie certifiée conforme, contresignée"],
      },
      {
        title: "Maquette des conditionnements primaire et secondaire",
        applies: "ImF / ImV / FL / FE",
        criteria: ["Étiquetage conforme, charte graphique complète"],
      },
      {
        title: "Photographie en couleur recto-verso avec emballage",
        applies: "ImF / ImV / FL / FE",
        criteria: ["Photo nette, couleurs fidèles, emballage complet"],
      },
      {
        title: "Notice d'utilisation en français et/ou arabe",
        applies: "ImF / ImV / FL / FE",
        criteria: ["Notice claire et conforme au produit"],
      },
      {
        title: "Accusé de réception de la fiche de sécurité CAPM",
        applies: "ImF / ImV / FL / FE",
        criteria: ["Accusé officiel du CAPM"],
      },
      {
        title: "Certificat de vente libre original ou certifié conforme",
        applies: "ImF / ImV / FL / FE",
        criteria: ["Daté, signé, cacheté, validité non expirée"],
      },
      {
        title: "Contrat de sous-traitance",
        applies: "ImV / FE",
        criteria: ["Signé par les deux parties"],
      },
      {
        title: "Certificat d'enregistrement OMPIC",
        applies: "Le cas échéant",
        criteria: ["Certificat lisible et correspondant à la marque"],
        conditional: true,
      },
      {
        title: "Autorisation d'exercice du fabricant",
        applies: "ImF / ImV",
        criteria: ["Copie certifiée conforme, document valide"],
      },
      {
        title: "Certificat BPF ou ISO 22716",
        applies: "ImF / ImV / FL / FE",
        criteria: ["Conforme à ISO 22716 ou BPF"],
      },
      {
        title: "Déclaration sur l'honneur légalisée",
        applies: "ImF / ImV / FL / FE",
        criteria: ["Datée, signée, légalisée"],
      },
      {
        title: "Fichiers numérisés",
        applies: "ImF / ImV / FL / FE",
        criteria: ["Fichiers numérotés, identifiés et complets"],
      },
    ],
  },
  {
    value: "section-renewal",
    letter: "C",
    title: "Documents pour Renouvellement",
    badge: "Renouvellement",
    icon: ClipboardList,
    iconClass: "bg-amber-100 text-amber-700",
    docs: [
      {
        title:
          "Déclaration sur l'honneur attestant qu'aucune modification n'a été apportée",
        criteria: ["Signée, datée, cachetée par le représentant légal"],
      },
      {
        title: "Copie du certificat d'enregistrement",
        criteria: ["Copie lisible du certificat précédent"],
      },
    ],
  },
  {
    value: "section-cannabis",
    letter: "D",
    title: "Documents Spécifiques — Cannabis",
    subtitle:
      "Documents supplémentaires requis uniquement pour les produits à base d'extraits de cannabis.",
    badge: "Conditionnel",
    badgeType: "green",
    icon: Leaf,
    iconClass: "bg-green-100 text-green-700",
    docs: [
      {
        title: "Autorisation ANRAC précisant le type d'activité",
        criteria: ["Autorisation valide et spécifique à l'activité déclarée"],
        cannabis: true,
      },
      {
        title: "Fiche technique de la matière première",
        criteria: ["Composition et concentration du dérivé"],
        cannabis: true,
      },
      {
        title: "Fiche de sécurité de la matière première",
        criteria: ["Conforme au format international"],
        cannabis: true,
      },
      {
        title: "Bulletin d'analyse du produit fini",
        criteria: ["Dosage CBD et THC, daté, signé, cacheté"],
        cannabis: true,
      },
      {
        title: "Bulletin d'analyse de l'extrait du cannabis",
        criteria: ["Délivré par un laboratoire reconnu"],
        cannabis: true,
      },
      {
        title: "Déclaration sur l'honneur attestant THC = 0",
        criteria: ["Datée, signée, légalisée"],
        cannabis: true,
      },
      {
        title: "Rapport d'étude de stabilité du produit fini",
        criteria: ["Protocole, méthodes, résultats et conclusion"],
        cannabis: true,
      },
    ],
  },
  
  {
    value: "section-order",
    letter: "F",
    title: "Ordre de Dépôt sur la Plateforme",
    badge: "Guide",
    icon: ListOrdered,
    iconClass: "bg-teal-100 text-teal-700",
    custom: "order",
  },
];

const CosmeticsDocumentsDialog = ({
  open,
  onOpenChange,
}: CosmeticsDocumentsDialogProps) => {
  const [activeTab, setActiveTab] = useState("info");
  const [query, setQuery] = useState("");



  const filteredSections = sections;

  const requiredDocsCount = sections.reduce(
    (acc, section) =>
      acc + (section.docs?.filter((d) => !d.conditional).length || 0),
    0
  );

  const conditionalDocsCount = sections.reduce(
    (acc, section) =>
      acc + (section.docs?.filter((d) => d.conditional || d.cannabis).length || 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[92vh] max-h-[92vh] p-0 overflow-hidden rounded-3xl border-emerald-100">
        <div className="relative flex h-full flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-100/60 rounded-full blur-3xl" />

          <DialogHeader className="relative px-7 pt-7 pb-4 border-b border-emerald-100">
            <DialogTitle className="text-2xl md:text-3xl font-extrabold text-emerald-800 flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-700" />
              </span>
              Produits Cosmétiques & Hygiène Corporelle
            </DialogTitle>

            <p className="text-sm text-slate-600 mt-2">
              Consultez les documents requis ou déposez une demande pour analyse
              automatique du dossier.
            </p>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col px-7 py-5">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-emerald-100/50 p-1 h-12">
                <TabsTrigger
                  value="info"
                  className="rounded-xl gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Documents Requis
                </TabsTrigger>

                <TabsTrigger
                  value="form"
                  className="rounded-xl gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Edit className="w-4 h-4" />
                  Déposer une Demande
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-5 min-h-0 flex-1 overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <SummaryCard
                    icon={CheckCircle2}
                    label="Documents obligatoires"
                    value={requiredDocsCount}
                  />
                  <SummaryCard
                    icon={Leaf}
                    label="Documents conditionnels"
                    value={conditionalDocsCount}
                  />
                  <SummaryCard
                    icon={Coins}
                    label="Frais"
                    value="2 500 DH"
                  />
                  <SummaryCard
                    icon={ShieldCheck}
                    label="Formats acceptés"
                    value="PDF / JPG / PNG"
                  />
                </div>

                <ScrollArea className="h-[calc(92vh-285px)] pr-4">
                  <Accordion type="multiple" className="w-full space-y-3">
                    {filteredSections.map((section) => (
                      <SectionBlock key={section.value} section={section} />
                    ))}
                  </Accordion>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="form" className="mt-5 min-h-0 flex-1 overflow-hidden">
                <div className="h-2" />

                <ScrollArea className="h-[calc(92vh-270px)] pr-4 pb-4">
                  <CosmeticsRegistrationForm />
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-emerald-700" />
        </span>

        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="font-extrabold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ section }: { section: SectionItem }) {
  const Icon = section.icon;
  const docCount = section.docs?.length || 0;

  return (
    <AccordionItem
      value={section.value}
      className="rounded-2xl border border-emerald-100 bg-white/90 px-4 shadow-sm overflow-hidden"
    >
      <AccordionTrigger className="hover:no-underline py-5">
        <div className="flex items-center gap-4 text-left">
          <span
            className={`w-11 h-11 rounded-2xl flex items-center justify-center ${section.iconClass}`}
          >
            <Icon className="w-5 h-5" />
          </span>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-900">
                {section.letter}. {section.title}
              </h3>

              {section.badge && (
                <Badge
                  variant="outline"
                  className={
                    section.badgeType === "green"
                      ? "border-green-300 text-green-700 bg-green-50"
                      : "border-emerald-200 text-emerald-700 bg-emerald-50"
                  }
                >
                  {section.badge}
                </Badge>
              )}

              {docCount > 0 && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                  {docCount} document(s)
                </Badge>
              )}
            </div>

            {section.subtitle && (
              <p className="text-sm text-slate-500 mt-1">{section.subtitle}</p>
            )}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pb-5">
        {section.docs && section.docs.length > 0 && (
          <div className="space-y-3">
            {section.docs.map((doc, index) => (
              <DocCard key={`${doc.title}-${index}`} index={index + 1} doc={doc} />
            ))}
          </div>
        )}

        {section.custom === "modification" && <ModificationBlock />}

      </AccordionContent>
    </AccordionItem>
  );
}

function DocCard({ doc, index }: { doc: DocItem; index: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 hover:bg-emerald-50/50 hover:border-emerald-100 transition-all">
      <div className="flex items-start gap-3">
        <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold shrink-0">
          {index}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h4 className="font-semibold text-sm text-slate-900">{doc.title}</h4>

            {doc.applies && (
              <Badge variant="secondary" className="text-xs bg-white">
                {doc.applies}
              </Badge>
            )}

            {doc.conditional && (
              <Badge className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">
                Conditionnel
              </Badge>
            )}

            {doc.cannabis && (
              <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                <Leaf className="w-3 h-3 mr-1" />
                Cannabis
              </Badge>
            )}
          </div>

          <ul className="space-y-1">
            {doc.criteria.map((criterion, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                {criterion}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ModificationBlock() {
  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-bold text-amber-800 mb-3">
        En cas de modification — fournir en plus :
      </p>

      <div className="grid md:grid-cols-2 gap-3">
        <DocCard
          index={8}
          doc={{
            title: "Copie de la déclaration initiale",
            criteria: [
              "Document clair, lisible et daté",
              "Contenu concordant avec l'activité actuelle",
              "Même raison sociale et même adresse",
            ],
          }}
        />

        <DocCard
          index={9}
          doc={{
            title: "Justificatif de la modification",
            criteria: [
              "Modification clairement identifiée",
              "Document correspondant à l'élément modifié",
              "Date cohérente avec la demande",
            ],
          }}
        />
      </div>
    </div>
  );
}



function OrderBlock() {
  const steps = [
    "Création du compte opérateur",
    "Validation du compte par l’AMMPS",
    "Dépôt du dossier de demande",
    "Paiement des frais réglementaires",
    "Réception de l’accusé de réception",
    "Suivi du traitement via l’espace personnel",
    "Dépôt des compléments si demandés",
    "Réception du certificat final",
  ];

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
      <div className="grid md:grid-cols-2 gap-3">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-3 bg-white rounded-xl p-3">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-extrabold">
              {index + 1}
            </span>
            <span className="text-sm font-medium text-slate-700">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CosmeticsDocumentsDialog;
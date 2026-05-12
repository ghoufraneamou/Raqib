import { useState } from "react";
import { Search, Filter, CheckCircle, Mail, Users, MessageSquare, FileText, AlertTriangle, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const dossiers = [
  {
    id: "AMM-2025-001",
    produit: "Paracétamol 500mg",
    laboratoire: "Pharma Plus",
    type: "Nouvelle AMM",
    statut: "En évaluation",
    dateDepot: "05/01/2025",
    modules: [
      { num: 1, nom: "Administratif", fichiers: 12, complet: true },
      { num: 2, nom: "Résumé", fichiers: 3, complet: true },
      { num: 3, nom: "Qualité", fichiers: 45, complet: true },
      { num: 4, nom: "Non clinique", fichiers: 28, complet: true },
      { num: 5, nom: "Clinique", fichiers: 15, complet: false },
    ],
    iaSuggestions: [
      "Rapport d'étude clinique phase III manquant",
      "Dossier similaire approuvé: AMM-2023-456",
    ],
  },
  {
    id: "AMM-2025-005",
    produit: "Ibuprofène 400mg",
    laboratoire: "MedLab",
    type: "Nouvelle AMM",
    statut: "Complément requis",
    dateDepot: "04/01/2025",
    modules: [
      { num: 1, nom: "Administratif", fichiers: 10, complet: true },
      { num: 2, nom: "Résumé", fichiers: 3, complet: true },
      { num: 3, nom: "Qualité", fichiers: 38, complet: false },
      { num: 4, nom: "Non clinique", fichiers: 20, complet: true },
      { num: 5, nom: "Clinique", fichiers: 22, complet: true },
    ],
    iaSuggestions: [
      "Spécifications de stabilité manquantes dans Module 3",
    ],
  },
];

const Dossiers = () => {
  const [selectedDossier, setSelectedDossier] = useState(dossiers[0]);
  const [activeTab, setActiveTab] = useState("documents");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Traitement des Dossiers</h1>
          <p className="text-muted-foreground">{dossiers.length} dossiers en cours de traitement</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un dossier..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtrer
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Dossier List */}
        <div className="space-y-3">
          {dossiers.map((dossier) => (
            <button
              key={dossier.id}
              onClick={() => setSelectedDossier(dossier)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedDossier.id === dossier.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-primary">{dossier.id}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  dossier.statut === "Complément requis"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {dossier.statut}
                </span>
              </div>
              <p className="font-medium text-foreground">{dossier.produit}</p>
              <p className="text-sm text-muted-foreground">{dossier.laboratoire}</p>
            </button>
          ))}
        </div>

        {/* Dossier Detail */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">DOSSIER {selectedDossier.id}</h2>
                <p className="text-muted-foreground">
                  Produit: {selectedDossier.produit} | Laboratoire: {selectedDossier.laboratoire}
                </p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-5">
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="evaluation">Évaluation</TabsTrigger>
              <TabsTrigger value="historique">Historique</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Type de demande</p>
                  <p className="font-medium">{selectedDossier.type}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Date de dépôt</p>
                  <p className="font-medium">{selectedDossier.dateDepot}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <h3 className="font-semibold text-foreground">📄 DOCUMENTS SOUMIS:</h3>
              <div className="space-y-3">
                {selectedDossier.modules.map((module) => (
                  <div
                    key={module.num}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      module.complet ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={module.complet ? "text-green-600" : "text-amber-600"}>
                        {module.complet ? "✅" : "⚠️"}
                      </span>
                      <span className="font-medium">
                        Module {module.num} - {module.nom}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({module.fichiers} fichiers)
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Suggestions */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">💡 IA SUGGÈRE:</span>
                </div>
                <ul className="space-y-2">
                  {selectedDossier.iaSuggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm text-blue-700">
                      - {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="evaluation">
              <p className="text-muted-foreground">Évaluation scientifique en cours...</p>
            </TabsContent>

            <TabsContent value="historique">
              <p className="text-muted-foreground">Historique du dossier...</p>
            </TabsContent>

            <TabsContent value="communication">
              <p className="text-muted-foreground">Messages échangés...</p>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="p-5 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-3">ACTIONS:</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-2" onClick={() => toast.success("Complétude validée")}>
                <CheckCircle className="w-4 h-4" />
                ✅ Valider complétude
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => toast.info("Demande de complément envoyée")}>
                <Mail className="w-4 h-4" />
                📧 Demander complément
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                👥 Assigner évaluateur
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                📝 Ajouter commentaire
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dossiers;

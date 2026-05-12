import { useState } from "react";
import { Settings, Save, Copy, Power, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const procedures = [
  {
    id: 1,
    nom: "Nouvelle AMM médicament",
    code: "AMM-MED-001",
    delai: 90,
    tarif: 5000,
    documents: [
      "Formulaire administratif",
      "Certificat fabricant",
      "Dossier CTD (5 modules)",
      "Rapport d'analyse",
    ],
    workflow: [
      "Réception → Contrôle complétude",
      "Évaluation scientifique",
      "Commission si nécessaire",
      "Décision finale",
      "Génération document",
    ],
    active: true,
  },
  {
    id: 2,
    nom: "Renouvellement AMM",
    code: "AMM-REN-001",
    delai: 60,
    tarif: 3000,
    documents: [
      "Formulaire de renouvellement",
      "Rapport de pharmacovigilance",
      "Attestation de vente",
    ],
    workflow: [
      "Réception → Vérification antécédents",
      "Évaluation rapide",
      "Décision finale",
    ],
    active: true,
  },
];

const Parametrage = () => {
  const [selectedProcedure, setSelectedProcedure] = useState(procedures[0]);

  const handleSave = () => {
    toast.success("Paramètres enregistrés");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">⚙️ PARAMÉTRAGE SYSTÈME</h1>
          <p className="text-muted-foreground">Configuration des procédures et workflows</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle procédure
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Procedure List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">GESTION DES PROCÉDURES:</h3>
          {procedures.map((procedure) => (
            <button
              key={procedure.id}
              onClick={() => setSelectedProcedure(procedure)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedProcedure.id === procedure.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground">{procedure.nom}</span>
                <span className={`w-2 h-2 rounded-full ${procedure.active ? "bg-green-500" : "bg-muted"}`} />
              </div>
              <p className="text-sm text-muted-foreground">{procedure.code}</p>
            </button>
          ))}
        </div>

        {/* Procedure Detail */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Détails de la procédure</h3>
            <span className={`px-3 py-1 rounded-full text-sm ${
              selectedProcedure.active
                ? "bg-green-100 text-green-700"
                : "bg-muted text-muted-foreground"
            }`}>
              {selectedProcedure.active ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Procédure</Label>
                <Input value={selectedProcedure.nom} readOnly className="mt-1" />
              </div>
              <div>
                <Label>Code</Label>
                <Input value={selectedProcedure.code} readOnly className="mt-1" />
              </div>
              <div>
                <Label>Délai réglementaire (jours)</Label>
                <Input value={selectedProcedure.delai} type="number" className="mt-1" />
              </div>
              <div>
                <Label>Tarif (DH)</Label>
                <Input value={selectedProcedure.tarif} type="number" className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Documents requis:</Label>
              <div className="space-y-2">
                {selectedProcedure.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <span className="text-green-600">✓</span>
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Workflow:</Label>
              <div className="space-y-2">
                {selectedProcedure.workflow.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button className="gap-2" onClick={handleSave}>
                <Save className="w-4 h-4" />
                Enregistrer
              </Button>
              <Button variant="outline" className="gap-2">
                <Copy className="w-4 h-4" />
                Dupliquer
              </Button>
              <Button variant="outline" className="gap-2">
                <Power className="w-4 h-4" />
                Désactiver
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametrage;

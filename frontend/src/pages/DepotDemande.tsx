import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Upload, CheckCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const typesDemande = [
  { id: "nouvelle-amm", label: "Nouvelle AMM", tarif: 5000 },
  { id: "renouvellement", label: "Renouvellement AMM", tarif: 3000 },
  { id: "modification", label: "Modification AMM", tarif: 2000 },
  { id: "visa-pub", label: "Visa de publicité", tarif: 1500 },
  { id: "importation", label: "Autorisation d'importation", tarif: 2500 },
  { id: "certificat-bpf", label: "Certificat BPF", tarif: 4000 },
];

const formesPharmaceutiques = [
  "Comprimé",
  "Gélule",
  "Sirop",
  "Solution injectable",
  "Pommade",
  "Crème",
  "Suppositoire",
  "Collyre",
];

const modules = [
  { id: 1, name: "Module 1: Administratif", required: true },
  { id: 2, name: "Module 2: Résumé", required: true },
  { id: 3, name: "Module 3: Qualité", required: true },
  { id: 4, name: "Module 4: Non clinique", required: false },
  { id: 5, name: "Module 5: Clinique", required: false },
];

const DepotDemande = () => {
  const [step, setStep] = useState(1);
  const [typeDemande, setTypeDemande] = useState("");
  const [formData, setFormData] = useState({
    nomProduit: "",
    dci: "",
    formePharmaceutique: "",
    dosage: "",
  });
  const [uploadedModules, setUploadedModules] = useState<Record<number, File[]>>({});

  const selectedType = typesDemande.find((t) => t.id === typeDemande);

  const handleFileUpload = (moduleId: number, files: FileList | null) => {
    if (files) {
      setUploadedModules((prev) => ({
        ...prev,
        [moduleId]: [...(prev[moduleId] || []), ...Array.from(files)],
      }));
    }
  };

  const handleSubmit = () => {
    toast.success("Demande déposée avec succès! Référence: AMM-2025-" + Math.floor(Math.random() * 1000));
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container-gov">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="container-gov py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Déposer une Demande
            </h1>
            <p className="text-muted-foreground">
              Soumettez vos dossiers de manière dématérialisée
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8 text-sm">
            {["Type", "Formulaire", "Documents", "Paiement"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                    step > i + 1
                      ? "bg-green-500 text-white"
                      : step === i + 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > i + 1 ? <CheckCircle className="w-5 h-5" /> : i + 1}
                </div>
                <span className={step === i + 1 ? "text-primary font-medium" : "text-muted-foreground"}>
                  {label}
                </span>
                {i < 3 && <div className={`w-8 h-0.5 ${step > i + 1 ? "bg-green-500" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          {step === 4 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Demande déposée avec succès!
              </h2>
              <p className="text-muted-foreground mb-2">
                Votre dossier a été enregistré et sera traité dans les meilleurs délais.
              </p>
              <p className="text-primary font-medium mb-6">
                Référence: AMM-2025-{Math.floor(Math.random() * 1000).toString().padStart(3, '0')}
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/">
                  <Button variant="outline">Retour à l'accueil</Button>
                </Link>
                <Link to="/suivi">
                  <Button>Suivre ma demande</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-6 md:p-8">
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Sélectionnez le type de demande
                  </h2>
                  <div className="grid gap-3">
                    {typesDemande.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setTypeDemande(type.id)}
                        className={`flex items-center justify-between p-4 rounded-lg border text-left transition-all ${
                          typeDemande === type.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <span className="font-medium">{type.label}</span>
                        <span className="text-primary font-semibold">{type.tarif.toLocaleString()} DH</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-primary/5 rounded-lg p-4 mb-6">
                    <h2 className="text-lg font-semibold text-primary">
                      DEMANDE D'AMM - MÉDICAMENT HUMAIN
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedType?.label}
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="nomProduit">Nom du produit *</Label>
                      <Input
                        id="nomProduit"
                        value={formData.nomProduit}
                        onChange={(e) => setFormData({ ...formData, nomProduit: e.target.value })}
                        placeholder="Nom commercial du produit"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dci">DCI (Dénomination Commune Internationale) *</Label>
                      <Input
                        id="dci"
                        value={formData.dci}
                        onChange={(e) => setFormData({ ...formData, dci: e.target.value })}
                        placeholder="Ex: Paracétamol"
                      />
                    </div>
                    <div>
                      <Label>Forme pharmaceutique *</Label>
                      <Select
                        value={formData.formePharmaceutique}
                        onValueChange={(value) => setFormData({ ...formData, formePharmaceutique: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une forme" />
                        </SelectTrigger>
                        <SelectContent>
                          {formesPharmaceutiques.map((forme) => (
                            <SelectItem key={forme} value={forme}>
                              {forme}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dosage">Dosage *</Label>
                      <Input
                        id="dosage"
                        value={formData.dosage}
                        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                        placeholder="Ex: 500mg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Téléverser les documents
                  </h2>
                  <div className="space-y-4">
                    {modules.map((module) => (
                      <div
                        key={module.id}
                        className="border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📋</span>
                            <span className="font-medium">{module.name}</span>
                            {module.required && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                Obligatoire
                              </span>
                            )}
                          </div>
                          {uploadedModules[module.id]?.length > 0 && (
                            <span className="text-sm text-green-600">
                              {uploadedModules[module.id].length} fichier(s)
                            </span>
                          )}
                        </div>
                        <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            id={`module-${module.id}`}
                            onChange={(e) => handleFileUpload(module.id, e.target.files)}
                          />
                          <label
                            htmlFor={`module-${module.id}`}
                            className="cursor-pointer flex flex-col items-center gap-2"
                          >
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Téléverser fichiers
                            </span>
                          </label>
                        </div>
                        {uploadedModules[module.id]?.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            {file.name}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                {step > 1 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    Précédent
                  </Button>
                )}
                <div className={`flex items-center gap-4 ${step === 1 ? "ml-auto" : ""}`}>
                  {step === 3 && selectedType && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Montant à payer</p>
                      <p className="text-xl font-bold text-primary">
                        {selectedType.tarif.toLocaleString()} DH
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={() => (step === 3 ? handleSubmit() : setStep(step + 1))}
                    disabled={step === 1 && !typeDemande}
                  >
                    {step === 3 ? (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Payer maintenant
                      </>
                    ) : (
                      "Suivant"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DepotDemande;

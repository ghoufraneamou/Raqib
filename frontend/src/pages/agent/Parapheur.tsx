import { CheckCircle, Clock, Pause, FileText, Eye, XCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const circuitValidation = [
  {
    nom: "Dr. Benali",
    role: "Évaluateur",
    date: "10/01/25",
    statut: "valide",
    commentaire: "Avis favorable",
  },
  {
    nom: "Dr. Alami",
    role: "Chef de service",
    date: null,
    statut: "en_attente",
    commentaire: null,
  },
  {
    nom: "M. Tazi",
    role: "Directeur",
    date: null,
    statut: "non_demarre",
    commentaire: null,
  },
];

const documentsASigner = [
  { id: 1, nom: "Décision_AMM_2025_001.pdf", type: "Décision AMM", dossier: "AMM-2025-001" },
  { id: 2, nom: "Certificat_BPF_2025_012.pdf", type: "Certificat BPF", dossier: "BPF-2025-012" },
  { id: 3, nom: "Autorisation_Import_2025_003.pdf", type: "Autorisation", dossier: "IMP-2025-003" },
];

const Parapheur = () => {
  const handleAction = (action: string) => {
    if (action === "viser") {
      toast.success("Document visé avec succès");
    } else if (action === "refuser") {
      toast.error("Document refusé");
    } else {
      toast.info("Délégation envoyée");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">🖊️ E-PARAPHEUR</h1>
        <p className="text-muted-foreground">Circuit de validation électronique</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Documents à signer */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Documents en attente de signature</h3>
          </div>
          <div className="p-5 space-y-4">
            {documentsASigner.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{doc.nom}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.type} • {doc.dossier}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Circuit de validation */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">CIRCUIT DE VALIDATION:</h3>
            <p className="text-sm text-muted-foreground">Dossier: AMM-2025-001</p>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {circuitValidation.map((etape, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        etape.statut === "valide"
                          ? "bg-green-100"
                          : etape.statut === "en_attente"
                          ? "bg-amber-100"
                          : "bg-muted"
                      }`}
                    >
                      {etape.statut === "valide" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : etape.statut === "en_attente" ? (
                        <Clock className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Pause className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    {index < circuitValidation.length - 1 && (
                      <div className={`w-0.5 h-12 ${
                        etape.statut === "valide" ? "bg-green-300" : "bg-muted"
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {etape.statut === "valide" ? "✅" : etape.statut === "en_attente" ? "⏳" : "⏸️"} {etape.nom}
                        </p>
                        <p className="text-sm text-muted-foreground">({etape.role})</p>
                      </div>
                      {etape.date && (
                        <span className="text-sm text-muted-foreground">{etape.date}</span>
                      )}
                    </div>
                    {etape.commentaire && (
                      <p className="text-sm text-primary mt-1">"{etape.commentaire}"</p>
                    )}
                    {etape.statut === "en_attente" && (
                      <p className="text-sm text-amber-600 mt-1">En attente de validation</p>
                    )}
                    {etape.statut === "non_demarre" && (
                      <p className="text-sm text-muted-foreground mt-1">Non démarré</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">📄 Document à signer:</p>
              <p className="font-medium text-foreground">"Décision_AMM_2025_001.pdf"</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button className="gap-2" onClick={() => handleAction("viser")}>
                <CheckCircle className="w-4 h-4" />
                Viser
              </Button>
              <Button variant="destructive" className="gap-2" onClick={() => handleAction("refuser")}>
                <XCircle className="w-4 h-4" />
                Refuser
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => handleAction("deleguer")}>
                <Users className="w-4 h-4" />
                Déléguer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parapheur;

import { Calendar, MapPin, Users, Send, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const commissions = [
  {
    id: 1,
    nom: "Commission Évaluation AMM",
    date: "15/01/2025",
    heure: "10h00",
    lieu: "Salle de réunion A",
    participants: [
      { nom: "Dr. Aamoumour", role: "Évaluateur", confirme: true },
      { nom: "Dr. ElBani", role: "Chef service", confirme: true },
      { nom: "Pr. Abouuomar", role: "Expert externe", confirme: false },
    ],
    dossiers: [
      { id: "AMM-2025-001", produit: "Paracétamol" },
      { id: "AMM-2025-005", produit: "Antibiotique" },
      { id: "REN-2024-890", produit: "Renouvellement" },
    ],
  },
  {
    id: 2,
    nom: "Commission Pharmacovigilance",
    date: "20/01/2025",
    heure: "14h00",
    lieu: "Salle de réunion B",
    participants: [
      { nom: "Dr. Fassi", role: "Responsable PV", confirme: true },
      { nom: "Dr. Tazi", role: "Expert", confirme: true },
    ],
    dossiers: [
      { id: "PV-2025-001", produit: "Signal de sécurité" },
    ],
  },
];

const Convocations = () => {
  const handleSendConvocations = (commissionId: number) => {
    toast.success("Convocations envoyées avec succès!");
  };

  const handleGenerateOrdreJour = (commissionId: number) => {
    toast.success("Ordre du jour généré!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">📅 GESTION DES CONVOCATIONS</h1>
          <p className="text-muted-foreground">Commissions et réunions planifiées</p>
        </div>
        <Button className="gap-2">
          <Calendar className="w-4 h-4" />
          Nouvelle commission
        </Button>
      </div>

      <div className="space-y-6">
        {commissions.map((commission) => (
          <div key={commission.id} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-5 bg-primary/5 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Commission: {commission.nom}</h3>
                <span className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded-full">
                  À venir
                </span>
              </div>
              <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Date: {commission.date} à {commission.heure}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Lieu: {commission.lieu}
                </span>
              </div>
            </div>

            <div className="p-5 grid md:grid-cols-2 gap-6">
              {/* Participants */}
              <div>
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  PARTICIPANTS:
                </h4>
                <div className="space-y-2">
                  {commission.participants.map((participant, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <span className={participant.confirme ? "text-green-600" : "text-muted-foreground"}>
                          {participant.confirme ? "✓" : "○"}
                        </span>
                        <span className="ml-2 font-medium">{participant.nom}</span>
                        <span className="text-sm text-muted-foreground ml-2">({participant.role})</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        participant.confirme
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {participant.confirme ? "Confirmé" : "En attente"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dossiers */}
              <div>
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  DOSSIERS À L'ORDRE DU JOUR:
                </h4>
                <div className="space-y-2">
                  {commission.dossiers.map((dossier) => (
                    <div
                      key={dossier.id}
                      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="text-primary">•</span>
                      <span className="font-medium">{dossier.id}</span>
                      <span className="text-sm text-muted-foreground">({dossier.produit})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-border flex gap-3">
              <Button
                className="gap-2"
                onClick={() => handleSendConvocations(commission.id)}
              >
                <Send className="w-4 h-4" />
                Envoyer convocations
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleGenerateOrdreJour(commission.id)}
              >
                <FileText className="w-4 h-4" />
                Générer ordre du jour
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Convocations;

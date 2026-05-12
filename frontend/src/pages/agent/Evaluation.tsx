import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const criteres = [
  {
    id: "qualite",
    label: "Qualité pharmaceutique",
    options: ["Conforme", "Non conforme", "À revoir"],
  },
  {
    id: "efficacite",
    label: "Efficacité",
    options: ["Démontrée", "Insuffisante"],
  },
  {
    id: "securite",
    label: "Sécurité",
    options: ["Acceptable", "Préoccupante"],
  },
];

const Evaluation = () => {
  const [evaluations, setEvaluations] = useState<Record<string, string>>({});
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});
  const [decision, setDecision] = useState("");

  const handleSubmit = () => {
    toast.success("Évaluation soumise avec succès");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">ÉVALUATION SCIENTIFIQUE</h1>
        <p className="text-muted-foreground">Dossier: AMM-2025-001</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-6">CRITÈRES D'ÉVALUATION:</h2>

          <div className="space-y-8">
            {criteres.map((critere) => (
              <div key={critere.id} className="space-y-4">
                <Label className="text-base font-medium">{critere.label}:</Label>
                <RadioGroup
                  value={evaluations[critere.id]}
                  onValueChange={(value) =>
                    setEvaluations({ ...evaluations, [critere.id]: value })
                  }
                  className="flex flex-wrap gap-4"
                >
                  {critere.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${critere.id}-${option}`} />
                      <Label htmlFor={`${critere.id}-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <div>
                  <Label className="text-sm text-muted-foreground">Commentaire:</Label>
                  <Textarea
                    value={commentaires[critere.id] || ""}
                    onChange={(e) =>
                      setCommentaires({ ...commentaires, [critere.id]: e.target.value })
                    }
                    placeholder="Ajoutez un commentaire..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <Label className="text-base font-medium">DÉCISION RECOMMANDÉE:</Label>
            <RadioGroup
              value={decision}
              onValueChange={setDecision}
              className="mt-4 space-y-3"
            >
              {["Avis favorable", "Avis défavorable", "Demande d'informations"].map((opt) => (
                <div key={opt} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/30">
                  <RadioGroupItem value={opt} id={opt} />
                  <Label htmlFor={opt} className="cursor-pointer flex-1">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button className="mt-6 gap-2" onClick={handleSubmit}>
            <Send className="w-4 h-4" />
            Soumettre évaluation
          </Button>
        </div>

        {/* IA Analysis Panel */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">🤖 IA ANALYSE:</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">✓ Études cliniques robustes</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">✓ Profil de sécurité standard</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">✓ Posologie cohérente</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700">⚠ Vérifier interactions médicamenteuses</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Dossiers similaires approuvés:</p>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-primary hover:underline">
                → AMM-2023-456 (Paracétamol 1000mg)
              </a>
              <a href="#" className="block text-sm text-primary hover:underline">
                → AMM-2022-234 (Paracétamol 500mg)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Evaluation;

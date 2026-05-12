import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const kpis = [
  {
    label: "Demandes reçues",
    value: 245,
    change: "+12%",
    trend: "up",
    comparaison: "vs mois dernier",
  },
  {
    label: "Délai moyen traitement",
    value: "45 jours",
    change: "-5 jours",
    trend: "down",
    comparaison: "vs mois dernier",
  },
  {
    label: "Taux approbation",
    value: "78%",
    change: "+3%",
    trend: "up",
    comparaison: "vs mois dernier",
  },
  {
    label: "Dossiers en retard",
    value: "8 (3%)",
    change: "",
    trend: "neutral",
    comparaison: "",
  },
];

const alertes = [
  { type: "warning", message: "3 dossiers dépassent délai réglementaire" },
  { type: "info", message: "Pic de demandes prévu semaine prochaine" },
];

const Reporting = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">📊 TABLEAUX DE BORD DIRECTEUR</h1>
          <p className="text-muted-foreground">Vue consolidée des indicateurs clés</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </Button>
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div>
        <h2 className="font-semibold text-foreground mb-4">INDICATEURS CLÉS (Ce mois):</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-card rounded-xl border border-border p-5">
              <p className="text-sm text-muted-foreground mb-2">• {kpi.label}</p>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              {kpi.change && (
                <div className="flex items-center gap-1 mt-2">
                  {kpi.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : kpi.trend === "down" ? (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  ) : null}
                  <span className={`text-sm ${
                    kpi.trend === "up" || kpi.trend === "down" ? "text-green-500" : "text-muted-foreground"
                  }`}>
                    {kpi.change} {kpi.comparaison}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts placeholder */}
      <div>
        <h2 className="font-semibold text-foreground mb-4">📈 GRAPHIQUES:</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-5 h-48 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-2">📊</div>
              <p className="font-medium">Évolution volume par type</p>
              <p className="text-sm">[Graphique]</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 h-48 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-2">📈</div>
              <p className="font-medium">Délais par procédure</p>
              <p className="text-sm">[Graphique]</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 h-48 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-2">🥧</div>
              <p className="font-medium">Répartition par domaine</p>
              <p className="text-sm">[Graphique]</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div>
        <h2 className="font-semibold text-foreground mb-4">ALERTES:</h2>
        <div className="space-y-3">
          {alertes.map((alerte, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-4 rounded-lg border ${
                alerte.type === "warning"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              {alerte.type === "warning" ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <Lightbulb className="w-5 h-5 text-blue-600" />
              )}
              <span className={alerte.type === "warning" ? "text-amber-700" : "text-blue-700"}>
                {alerte.type === "warning" ? "⚠️" : "💡"} {alerte.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Planifier rapport automatique
        </Button>
      </div>
    </div>
  );
};

export default Reporting;

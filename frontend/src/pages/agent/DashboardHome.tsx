import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

const stats = [
  { label: "Nouveaux", value: 45, icon: FileText, color: "bg-blue-500" },
  { label: "En cours", value: 123, icon: Clock, color: "bg-amber-500" },
  { label: "Complétés", value: 28, icon: CheckCircle, color: "bg-green-500" },
  { label: "À signer", value: 12, icon: AlertTriangle, color: "bg-purple-500" },
];

const recentDossiers = [
  { id: "AMM-2025-001", produit: "Paracétamol 500mg", labo: "Pharma Plus", statut: "En évaluation", date: "05/01/25" },
  { id: "AMM-2025-005", produit: "Ibuprofène 400mg", labo: "MedLab", statut: "Complément requis", date: "04/01/25" },
  { id: "REN-2024-890", produit: "Aspirine 100mg", labo: "Pharma Plus", statut: "Validé", date: "03/01/25" },
  { id: "MOD-2025-002", produit: "Oméprazole 20mg", labo: "GenericPharma", statut: "En attente", date: "02/01/25" },
];

const DashboardHome = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">📊 VUE D'ENSEMBLE</h1>
        <p className="text-muted-foreground">Bienvenue, Dr. Benali. Voici le résumé de votre activité.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-green-500" />
            <span className="font-medium">📈 Délais moyens</span>
          </div>
          <p className="text-3xl font-bold text-foreground">45 <span className="text-lg font-normal text-muted-foreground">jours</span></p>
          <p className="text-sm text-green-500 flex items-center gap-1 mt-1">
            <TrendingDown className="w-4 h-4" />
            -5 jours vs mois dernier
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="font-medium">⚠️ Dossiers en retard</span>
          </div>
          <p className="text-3xl font-bold text-foreground">8 <span className="text-lg font-normal text-muted-foreground">dossiers</span></p>
          <p className="text-sm text-amber-500 mt-1">
            Dépassement délai réglementaire
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Activité récente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-sm font-medium text-muted-foreground">N° Dossier</th>
                <th className="px-5 py-3 text-sm font-medium text-muted-foreground">Produit</th>
                <th className="px-5 py-3 text-sm font-medium text-muted-foreground">Laboratoire</th>
                <th className="px-5 py-3 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="px-5 py-3 text-sm font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentDossiers.map((dossier) => (
                <tr key={dossier.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-4 font-medium text-primary">{dossier.id}</td>
                  <td className="px-5 py-4">{dossier.produit}</td>
                  <td className="px-5 py-4 text-muted-foreground">{dossier.labo}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      dossier.statut === "Validé" 
                        ? "bg-green-100 text-green-700" 
                        : dossier.statut === "Complément requis"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {dossier.statut}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{dossier.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

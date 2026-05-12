import { useEffect, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react";

const getAuthToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const getUserEmail = () =>
  localStorage.getItem("user_email") ||
  localStorage.getItem("email") ||
  localStorage.getItem("logged_user_email") ||
  localStorage.getItem("auth_email") ||
  "";

const userScopedKey = (key: string) => {
  const email = getUserEmail();
  return email ? `${key}_${email}` : key;
};

const authHeaders = () => {
  const token = getAuthToken();
  const email = getUserEmail();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(email ? { "X-User-Email": email } : {}),
  };
};

const setLastDossierId = (dossierId: string) => {
  localStorage.setItem(userScopedKey("last_dossier_id"), dossierId);
  localStorage.setItem("last_dossier_id", dossierId); // legacy fallback only
};

const SubmittedDossiersTable = () => {
  const [submittedDossiers, setSubmittedDossiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubmittedDossiers = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:8000/dossiers", {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Erreur /dossiers:", data);
        setSubmittedDossiers([]);
        return;
      }
      setSubmittedDossiers(data.dossiers || []);
    } catch (error) {
      console.error("Erreur chargement dossiers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmittedDossiers();

    const interval = setInterval(() => {
      fetchSubmittedDossiers();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const selectDossierForTracking = (dossierId: string) => {
    setLastDossierId(dossierId);

    window.dispatchEvent(
      new CustomEvent("ammps-track-dossier", {
        detail: { dossierId },
      })
    );

    const section = document.getElementById("suivi");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getStatusBadge = (status?: string) => {
    const value = status || "PROCESSING";

    if (value === "FORMALLY_COMPLETE" || value === "VALID") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
          <CheckCircle2 className="w-3 h-3" />
          Conforme
        </span>
      );
    }

    if (value === "INCOMPLETE" || value === "FORMAL_ISSUES") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 text-xs font-bold">
          <AlertTriangle className="w-3 h-3" />
          Incomplet
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
        <Clock className="w-3 h-3" />
        En cours
      </span>
    );
  };

  const getRiskBadge = (risk?: string) => {
    const value = risk || "PENDING";

    if (value === "LOW") {
      return (
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
          Faible
        </span>
      );
    }

    if (value === "MEDIUM") {
      return (
        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold">
          Moyen
        </span>
      );
    }

    if (value === "HIGH") {
      return (
        <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 text-xs font-bold">
          Élevé
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-100 text-xs font-bold">
        En attente
      </span>
    );
  };

  const getScore = (score: any) => {
    const value = Number(score ?? 0);
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white/95 p-6 md:p-8 shadow-2xl shadow-emerald-900/10">
      <div className="absolute -right-24 -top-24 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm font-bold mb-3">
            <FileText className="w-4 h-4" />
            Suivi administratif
          </span>

          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            Mes dossiers soumis
          </h3>

          <p className="text-slate-500 mt-1">
            Consultez vos derniers dossiers, leur score et les rapports générés.
          </p>
        </div>

        <button
          onClick={fetchSubmittedDossiers}
          className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-white border border-emerald-100 text-emerald-700 font-semibold shadow-[0_4px_0_#d1fae5] hover:-translate-y-0.5 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {submittedDossiers.length === 0 ? (
        <div className="relative rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-10 text-center">
          <FileText className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-800">
            Aucun dossier soumis pour le moment.
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Les dossiers analysés apparaîtront automatiquement ici.
          </p>
        </div>
      ) : (
        <div className="relative overflow-x-auto rounded-2xl border border-emerald-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-50/70 text-left text-slate-700">
                <th className="py-4 px-4 font-bold">Numéro</th>
                <th className="py-4 px-4 font-bold">Produit</th>
                <th className="py-4 px-4 font-bold">Statut</th>
                <th className="py-4 px-4 font-bold">Score</th>
                <th className="py-4 px-4 font-bold">Risque</th>
                <th className="py-4 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {submittedDossiers.slice(0, 5).map((dossier) => {
                const pdf = dossier?.report?.downloadable_report_files?.pdf;
                const score = getScore(dossier.compliance_score);
                const incomplete =
                  dossier.dossier_status === "INCOMPLETE" ||
                  dossier.dossier_status === "FORMAL_ISSUES";

                return (
                  <tr
                    key={dossier.dossier_id}
                    className="border-t border-emerald-100 hover:bg-emerald-50/40 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <button
                        onClick={() => selectDossierForTracking(dossier.dossier_id)}
                        className="font-extrabold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        {dossier.dossier_id}
                      </button>
                    </td>

                    <td className="py-4 px-4 max-w-[360px]">
                      <p className="font-semibold text-slate-900 truncate">
                        {dossier.product_name || "Dossier AMMPS"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Cliquez sur le numéro pour suivre l’avancement
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      {getStatusBadge(dossier.dossier_status)}
                    </td>

                    <td className="py-4 px-4 min-w-[150px]">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              score >= 85
                                ? "bg-emerald-600"
                                : score >= 60
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800">{score}%</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">{getRiskBadge(dossier.risk_level)}</td>

                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => selectDossierForTracking(dossier.dossier_id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-100 bg-white text-emerald-700 font-semibold hover:bg-emerald-50 transition"
                        >
                          <Eye className="w-4 h-4" />
                          Voir
                        </button>

                        {incomplete && (
                          <button
                            onClick={() => {
                              setLastDossierId(dossier.dossier_id);
                              window.location.href = "/messagerie";
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-orange-100 bg-orange-50 text-orange-700 font-semibold hover:bg-orange-100 transition"
                          >
                            <Send className="w-4 h-4" />
                            Compléter
                          </button>
                        )}

                        {pdf ? (
                          <button
                            onClick={() =>
                              window.open(
                                `http://127.0.0.1:8000/download-report?path=${encodeURIComponent(
                                  pdf
                                )}`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition"
                          >
                            <Download className="w-4 h-4" />
                            Rapport
                          </button>
                        ) : (
                          <span className="text-xs text-orange-600 font-semibold">
                            Rapport en cours
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubmittedDossiersTable;
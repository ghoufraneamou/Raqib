import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  ShieldAlert,
  ClipboardCheck,
  Send,
} from "lucide-react";
import { toast } from "sonner";

interface TrackingStep {
  step: string;
  date: string;
  completed: boolean;
  current?: boolean;
}

interface TrackingResponse {
  dossier_id: string;
  product_name?: string;
  company_name?: string;
  request_type?: string;
  dossier_status: string;
  compliance_score: number;
  risk_level: string;
  timeline: TrackingStep[];
  report?: any;
}

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

const getLastDossierId = () =>
  localStorage.getItem(userScopedKey("last_dossier_id")) || "";

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

const getDossierIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const fromQuery =
    params.get("dossier_id") ||
    params.get("dossierId") ||
    params.get("id") ||
    params.get("tracking");

  if (fromQuery) return fromQuery;

  const parts = window.location.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || "";
  return last.startsWith("AMM-") ? last : "";
};

const TrackingSection = () => {
  const [trackingNumber, setTrackingNumber] = useState(getLastDossierId());
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const searchDossier = async (value: string) => {
    if (!value.trim()) {
      toast.error("Veuillez saisir un numéro de dossier");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/dossiers/${encodeURIComponent(value.trim())}`,
        {
          headers: authHeaders(),
        }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Dossier introuvable");
      }

      setTrackingData(result);
      setTrackingNumber(value.trim());
      setLastDossierId(value.trim());
      toast.success("Dossier trouvé");
    } catch (error: any) {
      setTrackingData(null);
      toast.error(error.message || "Erreur lors de la recherche");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await searchDossier(trackingNumber);
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ dossierId: string }>;
      if (customEvent.detail?.dossierId) {
        searchDossier(customEvent.detail.dossierId);
      }
    };

    window.addEventListener("ammps-track-dossier", handler);

    return () => {
      window.removeEventListener("ammps-track-dossier", handler);
    };
  }, []);

  useEffect(() => {
    const dossierIdFromUrl = getDossierIdFromUrl();
    if (dossierIdFromUrl) {
      setTrackingNumber(dossierIdFromUrl);
      searchDossier(dossierIdFromUrl);
    }
  }, []);

  const getScore = (score: any) => {
    const value = Number(score ?? 0);
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
  };

  const score = getScore(trackingData?.compliance_score);

  const statusLabel = (status?: string) => {
    if (status === "FORMALLY_COMPLETE" || status === "VALID") return "Conforme";
    if (status === "FORMALLY_COMPLETE_WITH_RESERVES") return "Complet avec réserves";
    if (status === "PARTIALLY_COMPLETE") return "Partiellement complet";
    if (status === "INCOMPLETE") return "Incomplet";
    if (status === "FORMAL_ISSUES") return "À corriger";
    return status || "En cours";
  };

  const riskLabel = (risk?: string) => {
    if (risk === "LOW") return "Faible";
    if (risk === "MEDIUM") return "Moyen";
    if (risk === "HIGH") return "Élevé";
    return risk || "En attente";
  };

  const pdf = trackingData?.report?.downloadable_report_files?.pdf;

  const recentStatuses = [
    {
      status: "approved",
      icon: CheckCircle2,
      label: "Conforme",
      color: "text-emerald-700 bg-emerald-50 border-emerald-100",
    },
    {
      status: "pending",
      icon: Clock,
      label: "En cours",
      color: "text-amber-700 bg-amber-50 border-amber-100",
    },
    {
      status: "action",
      icon: AlertCircle,
      label: "Action requise",
      color: "text-red-700 bg-red-50 border-red-100",
    },
  ];

  return (
    <section className="relative overflow-hidden py-20 md:py-24 bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-3xl border border-emerald-100">
      <div className="absolute -right-24 top-16 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl" />
      <div className="absolute -left-24 bottom-10 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl" />

      <div className="relative container-gov">
        <div className="grid lg:grid-cols-[1fr_480px] gap-10 lg:gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-700 bg-emerald-100 rounded-full mb-5 border border-emerald-200">
              <ClipboardCheck className="w-4 h-4" />
              Suivi en temps réel
            </span>

            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
              Suivez vos demandes
            </h2>

            <p className="text-slate-600 text-lg mb-8 max-w-xl leading-relaxed">
              Entrez votre numéro de dossier pour consulter l’état d’avancement,
              le score de conformité, le niveau de risque et le rapport généré.
            </p>

            <form onSubmit={handleSearch} className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-700" />
                  <Input
                    type="text"
                    placeholder="Ex: AMM-2026-000001"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="pl-12 h-13 min-h-12 text-base rounded-xl border-emerald-100 bg-white shadow-sm"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 shadow-lg shadow-emerald-900/20"
                  disabled={isLoading}
                >
                  {isLoading ? "Recherche..." : "Rechercher"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>

            <div className="mt-8 flex flex-wrap gap-3">
              {recentStatuses.map((item) => (
                <div
                  key={item.status}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${item.color}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-emerald-100 shadow-2xl shadow-emerald-900/10 p-6 md:p-7 animate-fade-in">
              {!trackingData ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-emerald-700" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Aucun dossier sélectionné
                  </h3>

                  <p className="text-sm text-slate-500">
                    Recherchez un dossier ou cliquez sur un numéro dans la table
                    des dossiers soumis.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-7 h-7 text-emerald-700" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-500">Dossier</p>
                      <h3 className="text-xl font-extrabold text-slate-900 truncate">
                        {trackingData.dossier_id}
                      </h3>
                      <p className="text-sm text-slate-600 truncate">
                        {trackingData.product_name ||
                          trackingData.company_name ||
                          "Demande AMMPS"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                      <p className="text-xs text-slate-500 mb-1">Statut</p>
                      <p className="font-bold text-emerald-800">
                        {statusLabel(trackingData.dossier_status)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs text-slate-500 mb-1">Score</p>
                      <p className="font-bold text-slate-900">{score}%</p>
                    </div>

                    <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
                      <p className="text-xs text-slate-500 mb-1">Risque</p>
                      <p className="font-bold text-red-700">
                        {riskLabel(trackingData.risk_level)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Progression de conformité
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {score}%
                      </span>
                    </div>

                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
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
                  </div>

                  {trackingData.timeline?.length > 0 && (
                    <div className="space-y-4 mb-6">
                      {trackingData.timeline.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                item.completed
                                  ? "bg-emerald-600 text-white"
                                  : item.current
                                  ? "bg-emerald-700 text-white animate-pulse"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {item.completed ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <span className="text-xs font-bold">
                                  {index + 1}
                                </span>
                              )}
                            </div>

                            {index < trackingData.timeline.length - 1 && (
                              <div
                                className={`w-0.5 h-8 ${
                                  item.completed ? "bg-emerald-500" : "bg-slate-200"
                                }`}
                              />
                            )}
                          </div>

                          <div className="pt-1">
                            <p
                              className={`text-sm font-bold ${
                                item.current ? "text-emerald-700" : "text-slate-900"
                              }`}
                            >
                              {item.step}
                            </p>
                            <p className="text-xs text-slate-500">{item.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-5 border-t border-emerald-100">
                    {pdf && (
                      <Button
                        type="button"
                        className="rounded-xl bg-emerald-700 hover:bg-emerald-800 gap-2"
                        onClick={() =>
                          window.open(
                            `http://127.0.0.1:8000/download-report?path=${encodeURIComponent(
                              pdf
                            )}`
                          )
                        }
                      >
                        <Download className="w-4 h-4" />
                        Télécharger le rapport
                      </Button>
                    )}

                    {(trackingData.dossier_status === "INCOMPLETE" ||
                      trackingData.dossier_status === "FORMAL_ISSUES") && (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl gap-2 border-orange-100 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        onClick={() => {
                          setLastDossierId(trackingData.dossier_id);
                          window.location.href = "/messagerie";
                        }}
                      >
                        <Send className="w-4 h-4" />
                        Compléter le dossier
                      </Button>
                    )}

                    {!pdf && (
                      <div className="inline-flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2">
                        <ShieldAlert className="w-4 h-4" />
                        Rapport en cours de génération
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="absolute -z-10 -top-5 -right-5 w-28 h-28 bg-amber-200/30 rounded-full blur-2xl" />
            <div className="absolute -z-10 -bottom-5 -left-5 w-36 h-36 bg-emerald-200/40 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrackingSection;
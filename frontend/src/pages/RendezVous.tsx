import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Building2,
  Mail,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import ammpsLogo from "../assets/logo_ammps.png";

const services = [
  { id: "amm", label: "Service AMM - Autorisations" },
  { id: "inspection", label: "Service Inspection" },
  { id: "labo", label: "Laboratoire de contrôle" },
  { id: "pharmacovigilance", label: "Pharmacovigilance" },
  { id: "dg", label: "Direction Générale" },
];

const serviceLocations: Record<string, string> = {
  amm: "Siège AMMPS, Rabat, Maroc",
  inspection: "Département Inspection, Siège AMMPS, Rabat, Maroc",
  labo: "Laboratoire de contrôle AMMPS, Rabat, Maroc",
  pharmacovigilance: "Service Pharmacovigilance, Siège AMMPS, Rabat, Maroc",
  dg: "Direction Générale, Siège AMMPS, Rabat, Maroc",
};

const creneaux = [
  "09:00 - 09:30",
  "09:30 - 10:00",
  "10:00 - 10:30",
  "10:30 - 11:00",
  "11:00 - 11:30",
  "14:00 - 14:30",
  "14:30 - 15:00",
  "15:00 - 15:30",
  "15:30 - 16:00",
];

const RendezVous = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    service: "",
    date: "",
    creneau: "",
  });

  const getAvailableDates = () => {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 1; i <= 21 && dates.length < 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split("T")[0]);
      }
    }

    return dates;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const selectedServiceLabel =
    services.find((s) => s.id === formData.service)?.label || "";

  const selectedLocation =
    serviceLocations[formData.service] || "Siège AMMPS, Rabat, Maroc";

  const selectedEmail =
    localStorage.getItem("user_email") ||
    localStorage.getItem("email") ||
    localStorage.getItem("userEmail") ||
    (() => {
      try {
        const raw = localStorage.getItem("ammps_user");
        return raw ? JSON.parse(raw)?.email : "";
      } catch {
        return "";
      }
    })();

  const handleSubmit = async () => {
    if (!formData.service || !formData.date || !formData.creneau) {
      toast.error("Veuillez sélectionner le service, la date et le créneau.");
      return;
    }

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("ammps_access_token");

    const userRaw = localStorage.getItem("ammps_user");
    let userEmail = selectedEmail;

    if (!userEmail && userRaw) {
      try {
        userEmail = JSON.parse(userRaw)?.email || "";
      } catch {
        userEmail = "";
      }
    }

    if (!token || !userEmail) {
      toast.error("Session introuvable. Veuillez vous reconnecter.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("service", selectedServiceLabel);
      payload.append("date", formatDate(formData.date));
      payload.append("creneau", formData.creneau);
      payload.append("location", selectedLocation);
      payload.append("email", userEmail);

      const response = await fetch(
        "http://127.0.0.1:8000/appointments/confirm",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: payload,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Erreur lors de la confirmation du rendez-vous."
        );
      }

      toast.success(
        "Rendez-vous confirmé ! Un e-mail de confirmation a été envoyé."
      );
      setStep(3);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur lors de la confirmation du rendez-vous.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <img
        src={ammpsLogo}
        alt=""
        className="pointer-events-none absolute right-[-120px] top-40 w-[620px] opacity-[0.06] blur-[1px] mix-blend-multiply"
      />

      <header className="relative z-10 bg-emerald-800 text-white py-4 shadow-md">
        <div className="container-gov">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/85 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="relative z-10 container-gov py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Calendar className="w-8 h-8 text-emerald-700" />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
              Prendre rendez-vous
            </h1>

            <p className="text-slate-600">
              Planifiez une rencontre avec les services compétents de l’AMMPS.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-emerald-100 shadow-2xl shadow-emerald-900/10 overflow-hidden">
              <div className="grid grid-cols-2 border-b border-emerald-100">
                {["Sélection du créneau", "Confirmation"].map((label, i) => (
                  <div
                    key={label}
                    className={`flex items-center justify-center gap-2 py-5 font-semibold transition-all ${
                      step > i + 1
                        ? "bg-emerald-50 text-emerald-800 border-b-2 border-emerald-700"
                        : step === i + 1
                        ? "bg-emerald-50 text-emerald-800 border-b-2 border-emerald-700"
                        : "text-slate-500"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        step > i + 1
                          ? "bg-emerald-700 text-white"
                          : step === i + 1
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {step > i + 1 ? <CheckCircle className="w-5 h-5" /> : i + 1}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                ))}
              </div>

              {step === 3 ? (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-10 h-10 text-emerald-700" />
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 mb-3">
                    Rendez-vous confirmé
                  </h2>

                  <p className="text-slate-600 mb-8">
                    Un e-mail de confirmation a été envoyé à l’adresse utilisée lors de la connexion.
                  </p>

                  <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 p-5 mb-8 text-left max-w-xl mx-auto">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-emerald-700 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Service</p>
                          <p className="font-semibold text-slate-900">
                            {selectedServiceLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-emerald-700 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Date</p>
                          <p className="font-semibold text-slate-900">
                            {formData.date && formatDate(formData.date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-emerald-700 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Créneau</p>
                          <p className="font-semibold text-slate-900">
                            {formData.creneau}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-emerald-700 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Lieu</p>
                          <p className="font-semibold text-slate-900">
                            {selectedLocation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link to="/">
                    <Button className="rounded-xl bg-emerald-700 hover:bg-emerald-800">
                      Retour à l'accueil
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-6 md:p-8">
                  <div className="space-y-8">
                    <div>
                      <Label>Service *</Label>
                      <Select
                        value={formData.service}
                        onValueChange={(value) =>
                          setFormData({ ...formData, service: value })
                        }
                      >
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Choisir un service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>Date *</Label>
                        <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                          Jours ouvrables uniquement
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        {getAvailableDates().map((date) => (
                          <button
                            key={date}
                            type="button"
                            onClick={() => setFormData({ ...formData, date })}
                            className={`p-4 rounded-2xl border text-sm text-left transition-all hover:-translate-y-0.5 ${
                              formData.date === date
                                ? "border-emerald-500 bg-emerald-50 shadow-md text-emerald-800"
                                : "border-emerald-100 bg-white hover:border-emerald-300"
                            }`}
                          >
                            <Calendar className="w-4 h-4 mb-2 text-emerald-700" />
                            <span className="font-semibold">{formatDate(date)}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.date && (
                      <div>
                        <Label>Créneau horaire *</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                          {creneaux.map((creneau) => (
                            <button
                              key={creneau}
                              type="button"
                              onClick={() =>
                                setFormData({ ...formData, creneau })
                              }
                              className={`p-3 rounded-2xl border text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                                formData.creneau === creneau
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md"
                                  : "border-emerald-100 bg-white hover:border-emerald-300"
                              }`}
                            >
                              {creneau}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.service && formData.date && formData.creneau && (
                      <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 p-5">
                        <p className="text-sm text-slate-500 mb-2">
                          Créneau sélectionné
                        </p>

                        <div className="space-y-2 text-sm">
                          <p className="font-bold text-emerald-800">
                            {formatDate(formData.date)} — {formData.creneau}
                          </p>
                          <p className="text-slate-600">
                            Service : {selectedServiceLabel}
                          </p>
                          <p className="text-slate-600">Lieu : {selectedLocation}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between mt-8 pt-6 border-t border-emerald-100">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="rounded-xl"
                    >
                      Précédent
                    </Button>

                    <Button
                      onClick={() => (step === 2 ? handleSubmit() : setStep(2))}
                      disabled={
                        isSubmitting ||
                        !formData.service ||
                        !formData.date ||
                        !formData.creneau
                      }
                      className="ml-auto rounded-xl bg-emerald-700 hover:bg-emerald-800 gap-2"
                    >
                      {step === 2
                        ? isSubmitting
                          ? "Confirmation..."
                          : "Confirmer le rendez-vous"
                        : "Suivant"}
                      {step !== 2 && <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-5">
              <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-emerald-100 shadow-xl shadow-emerald-900/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Rendez-vous sécurisé</h3>
                    <p className="text-xs text-slate-500">Confirmation par e-mail</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Une confirmation officielle sera envoyée à votre adresse de connexion après validation du créneau.
                </p>
              </div>

              <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-emerald-100 shadow-xl shadow-emerald-900/10 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Récapitulatif</h3>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-emerald-700 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Service</p>
                      <p className="font-semibold text-slate-900">
                        {selectedServiceLabel || "Non sélectionné"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-emerald-700 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Date</p>
                      <p className="font-semibold text-slate-900">
                        {formData.date ? formatDate(formData.date) : "Non sélectionnée"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-emerald-700 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Créneau</p>
                      <p className="font-semibold text-slate-900">
                        {formData.creneau || "Non sélectionné"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-emerald-700 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">E-mail de confirmation</p>
                      <p className="font-semibold text-slate-900 break-all">
                        {selectedEmail || "Adresse liée à votre compte"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RendezVous;
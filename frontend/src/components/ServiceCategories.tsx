import { useState } from "react";
import {
  Pill,
  Stethoscope,
  Sparkles,
  Apple,
  FlaskConical,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CosmeticsDocumentsDialog from "./CosmeticsDocumentsDialog";

const services = [
  {
    icon: Pill,
    title: "Médicaments",
    description:
      "AMM, renouvellement, modification, importation de médicaments humains et vétérinaires",
    procedures: ["Nouvelle AMM", "Renouvellement", "Modification", "Importation parallèle"],
    color: "bg-emerald-50 text-emerald-700",
    clickable: false,
  },
  {
    icon: Stethoscope,
    title: "Dispositifs Médicaux",
    description:
      "Certification CE, homologation, vigilance et autorisation de mise sur le marché",
    procedures: ["Certification", "Homologation", "Vigilance"],
    color: "bg-blue-50 text-blue-700",
    clickable: false,
  },
  {
    icon: Sparkles,
    title: "Produits Cosmétiques",
    description:
      "Notification, évaluation de sécurité des produits cosmétiques et d’hygiène",
    procedures: ["Notification", "Évaluation", "Publicité"],
    color: "bg-rose-50 text-rose-700",
    clickable: true,
  },
  {
    icon: Apple,
    title: "Compléments Alimentaires",
    description: "Autorisation de mise sur le marché des compléments alimentaires",
    procedures: ["Nouvelle demande", "Renouvellement", "Modification"],
    color: "bg-green-50 text-green-700",
    clickable: false,
  },
  {
    icon: FlaskConical,
    title: "Réactifs de Laboratoire",
    description:
      "Évaluation et autorisation des réactifs de diagnostic in vitro",
    procedures: ["Homologation", "Enregistrement"],
    color: "bg-amber-50 text-amber-700",
    clickable: false,
  },
  {
    icon: Building2,
    title: "Établissements",
    description:
      "Autorisation et inspection des établissements pharmaceutiques",
    procedures: ["Autorisation", "Certificat BPF", "Inspection"],
    color: "bg-orange-50 text-orange-700",
    clickable: false,
  },
];

const ServiceCategories = () => {
  const [cosmeticsDialogOpen, setCosmeticsDialogOpen] = useState(false);

  const handleCardClick = (title: string) => {
    if (title === "Produits Cosmétiques") {
      setCosmeticsDialogOpen(true);
    }
  };

  return (
    <section id="services" className="py-20 md:py-28 bg-gradient-to-b from-white to-emerald-50/30">
      <div className="container-gov">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center px-5 py-2 text-lg font-bold text-emerald-700 bg-emerald-100 rounded-full mb-5 shadow-sm">
            Nos Services
          </span>

          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5">
            Catalogue des Procédures
          </h2>

          <p className="text-slate-600 text-lg leading-relaxed">
            Accédez aux principales procédures réglementaires de l’AMMPS,
            organisées par catégorie de produits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card
              key={service.title}
              onClick={() => handleCardClick(service.title)}
              className={`group relative overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_6px_0_#d1fae5,0_18px_35px_rgba(15,118,110,0.08)] hover:shadow-[0_3px_0_#a7f3d0,0_24px_45px_rgba(15,118,110,0.14)] hover:-translate-y-1 transition-all duration-300 ${
                service.clickable ? "cursor-pointer" : "cursor-default"
              }`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <CardHeader className="pb-3">
                <div
                  className={`w-14 h-14 rounded-2xl ${service.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <service.icon className="w-7 h-7" />
                </div>

                <CardTitle className="flex items-start justify-between gap-3 text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  <span>{service.title}</span>
                  {service.clickable && (
                    <ArrowUpRight className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                </CardTitle>

                <CardDescription className="text-slate-600 leading-relaxed">
                  {service.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {service.procedures.map((procedure) => (
                    <span
                      key={procedure}
                      className="px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100"
                    >
                      {procedure}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <CosmeticsDocumentsDialog
        open={cosmeticsDialogOpen}
        onOpenChange={setCosmeticsDialogOpen}
      />
    </section>
  );
};

export default ServiceCategories;
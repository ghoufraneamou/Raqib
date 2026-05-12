import { Link } from "react-router-dom";
import {
  Pill,
  Sparkles,
  Stethoscope,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import QuickActions from "@/components/QuickActions";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <Hero />

        <section className="py-20 bg-gradient-to-b from-white to-emerald-50/40">
          <div className="container-gov text-center">
            <span className="inline-flex items-center px-5 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-full mb-4">
              Nos Services
            </span>

            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
              Explorez nos procédures
            </h2>

            <p className="text-slate-600 max-w-2xl mx-auto mb-10 text-lg">
              Accédez à l’ensemble des procédures réglementaires de l’AMMPS
              organisées par catégorie de produits.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white rounded-3xl border border-emerald-100 shadow-[0_6px_0_#d1fae5,0_18px_35px_rgba(15,118,110,0.08)] p-7 text-left hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5">
                  <Pill className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl mb-2">Médicaments</h3>
                <p className="text-sm text-slate-600">
                  AMM, renouvellement, modification et importation.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-emerald-100 shadow-[0_6px_0_#d1fae5,0_18px_35px_rgba(15,118,110,0.08)] p-7 text-left hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mb-5">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl mb-2">Produits Cosmétiques</h3>
                <p className="text-sm text-slate-600">
                  Notification, évaluation de sécurité et publicité.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-emerald-100 shadow-[0_6px_0_#d1fae5,0_18px_35px_rgba(15,118,110,0.08)] p-7 text-left hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-5">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl mb-2">Dispositifs Médicaux</h3>
                <p className="text-sm text-slate-600">
                  Certification CE, homologation et vigilance.
                </p>
              </div>
            </div>

            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-900/20 hover:bg-emerald-800 hover:-translate-y-0.5 transition-all"
            >
              Voir toutes les procédures
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <QuickActions />

        <section className="py-20 bg-gradient-to-b from-white to-emerald-50/40">
          <div className="container-gov text-center">
            <span className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-full mb-4">
              <ClipboardCheck className="w-4 h-4" />
              Suivi en temps réel
            </span>

            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
              Suivez vos demandes
            </h2>

            <p className="text-slate-600 max-w-2xl mx-auto mb-8 text-lg">
              Consultez vos dossiers soumis, visualisez leur état d’avancement
              et téléchargez les rapports générés.
            </p>

            <Link
              to="/suivi"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-900/20 hover:bg-emerald-800 hover:-translate-y-0.5 transition-all"
            >
              Accéder au suivi
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        
      </main>

      <Footer />
    </div>
  );
};

export default Index;
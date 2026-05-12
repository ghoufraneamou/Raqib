import { Shield, Clock, FileCheck, SearchCheck, Send, Activity } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-800 py-16 md:py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container-gov relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Plateforme officielle de l’AMMPS
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Vos démarches réglementaires
            <span className="block text-amber-400">simplifiées et sécurisées</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-10 leading-relaxed">
            Déposez, analysez et suivez vos dossiers liés aux médicaments,
            dispositifs médicaux, produits cosmétiques et compléments alimentaires
            à travers une plateforme digitale claire, traçable et fiable.
          </p>

          {/* Process Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-8">
            <div className="group rounded-2xl bg-white/12 border border-white/20 backdrop-blur-md p-6 text-left shadow-xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/18">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center mb-4">
                <Send className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Dépôt numérique
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Soumission structurée des documents et informations du dossier.
              </p>
            </div>

            <div className="group rounded-2xl bg-white/12 border border-white/20 backdrop-blur-md p-6 text-left shadow-xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/18">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center mb-4">
                <SearchCheck className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Validation assistée
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Analyse automatique des pièces, critères et incohérences détectées.
              </p>
            </div>

            <div className="group rounded-2xl bg-white/12 border border-white/20 backdrop-blur-md p-6 text-left shadow-xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/18">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Suivi en temps réel
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Consultation de l’état du dossier, du score et du rapport généré.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-5">
              <FileCheck className="w-7 h-7 text-amber-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">+100</p>
              <p className="text-sm text-white/70">Dossiers traités</p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/15 p-5">
              <Clock className="w-7 h-7 text-amber-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">30 jours</p>
              <p className="text-sm text-white/70">Délai moyen</p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/15 p-5">
              <Shield className="w-7 h-7 text-amber-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">99%</p>
              <p className="text-sm text-white/70">Sécurisé</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
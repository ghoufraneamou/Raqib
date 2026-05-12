import Header from "@/components/Header";

export default function AboutAmmps() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="pt-10 pb-20">
        <section className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-slate-900">
              À propos de l’AMMPS
            </h1>
            <p className="mt-3 text-slate-600">
              Agence Marocaine du Médicament et des Produits de Santé
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 space-y-12 text-slate-700 leading-relaxed">
            <section id="presentation">
              <h2 className="text-2xl font-bold text-emerald-700 mb-4">
                Présentation de l’AMMPS
              </h2>
              <p>
                L’Agence Marocaine du Médicament et des Produits de Santé
                (AMMPS) est un établissement public chargé de renforcer la
                régulation, le contrôle et la surveillance du secteur
                pharmaceutique national. Elle contribue à garantir la qualité,
                la sécurité, l’efficacité et l’accessibilité des médicaments et
                des produits de santé au Maroc.
              </p>
              <p className="mt-4">
                L’AMMPS remplace la Direction du Médicament et de la Pharmacie
                dans le cadre de la modernisation du système national de santé.
                Elle accompagne la digitalisation des procédures réglementaires,
                améliore la traçabilité des dossiers et soutient l’innovation
                dans le domaine pharmaceutique.
              </p>
            </section>

            <section id="vision">
              <h2 className="text-2xl font-bold text-emerald-700 mb-4">
                Notre Vision
              </h2>
              <p>
                La vision de l’AMMPS est de devenir une autorité de référence en
                matière de régulation pharmaceutique, reconnue au niveau
                national, régional et international, au service du bien-être des
                citoyens et des professionnels de santé.
              </p>
            </section>

            <section id="missions">
              <h2 className="text-2xl font-bold text-emerald-700 mb-4">
                Nos Missions
              </h2>
              <p>
                L’AMMPS assure la régulation, la surveillance et le contrôle des
                médicaments et des produits de santé afin de garantir leur
                qualité, leur sécurité et leur efficacité.
              </p>
              <ul className="mt-4 list-disc pl-6 space-y-2">
                <li>Garantir l’accessibilité aux médicaments et produits de santé.</li>
                <li>Renforcer la régulation du secteur pharmaceutique.</li>
                <li>Soutenir la souveraineté médicamenteuse nationale.</li>
                <li>Appuyer la pharmacovigilance et la surveillance post-commercialisation.</li>
                <li>Lutter contre les médicaments contrefaits et le marché informel.</li>
                <li>Encourager l’innovation, la recherche et les partenariats stratégiques.</li>
              </ul>
            </section>

            <section id="valeurs">
              <h2 className="text-2xl font-bold text-emerald-700 mb-4">
                Nos valeurs
              </h2>
              <p>
                Les actions de l’AMMPS sont guidées par des valeurs
                fondamentales qui renforcent son rôle d’autorité de régulation :
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="rounded-2xl bg-emerald-50 p-5 border border-emerald-100">
                  <h3 className="font-bold text-emerald-800">Excellence</h3>
                  <p className="text-sm mt-2">
                    Garantir la qualité, la rigueur et l’amélioration continue.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-5 border border-emerald-100">
                  <h3 className="font-bold text-emerald-800">Intégrité</h3>
                  <p className="text-sm mt-2">
                    Assurer transparence, éthique, responsabilité et impartialité.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-5 border border-emerald-100">
                  <h3 className="font-bold text-emerald-800">Innovation</h3>
                  <p className="text-sm mt-2">
                    Moderniser les procédures et intégrer les solutions numériques.
                  </p>
                </div>
              </div>
            </section>

            <section id="smq">
              <h2 className="text-2xl font-bold text-emerald-700 mb-4">
                Notre SMQ
              </h2>
              <p>
                Le Système de Management de la Qualité de l’AMMPS s’inscrit dans
                une démarche d’amélioration continue. Il vise à renforcer
                l’efficacité des missions de l’agence, la satisfaction des usagers
                et la qualité des processus réglementaires.
              </p>
              <p className="mt-4">
                Cette démarche qualité contribue à garantir la rigueur,
                l’indépendance, la traçabilité et la performance des activités
                liées à l’évaluation, au contrôle et au suivi des médicaments et
                produits de santé.
              </p>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
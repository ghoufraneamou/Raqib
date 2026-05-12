import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceCategories from "@/components/ServiceCategories";

export default function ServicesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <section className="py-16 md:py-20 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-800 text-white">
          <div className="container-gov text-center">
            <span className="inline-flex items-center px-5 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold mb-5">
              Services AMMPS
            </span>

            <h1 className="text-4xl md:text-6xl font-extrabold mb-5">
              Catalogue des Procédures
            </h1>

            <p className="max-w-3xl mx-auto text-white/80 text-lg md:text-xl leading-relaxed">
              Retrouvez les procédures réglementaires disponibles par catégorie :
              médicaments, dispositifs médicaux, produits cosmétiques,
              compléments alimentaires, réactifs et établissements.
            </p>
          </div>
        </section>

        <ServiceCategories />
      </main>

      <Footer />
    </div>
  );
}
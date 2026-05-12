import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SubmittedDossiersTable from "@/components/SubmittedDossiersTable";
import TrackingSection from "@/components/TrackingSection";

export default function SuiviPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Header />

      <main className="flex-1">
        <section className="py-20 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-800 text-white">
          <div className="container-gov text-center">
            <span className="inline-flex px-5 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold mb-5">
              Suivi en temps réel
            </span>

            <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
              Suivi de vos demandes
            </h1>

            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              Consultez vos dossiers, suivez leur progression et téléchargez les
              rapports générés.
            </p>
          </div>
        </section>

        <section className="py-14">
          <div className="container-gov space-y-10">
            <SubmittedDossiersTable />
            <TrackingSection />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
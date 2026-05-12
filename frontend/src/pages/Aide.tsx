import { Link } from "react-router-dom";
import { ArrowLeft, HelpCircle, Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Comment créer un compte opérateur ?",
    answer:
      "Pour créer un compte, cliquez sur 'Créer un compte', renseignez vos informations, puis validez votre inscription avec le code envoyé par e-mail.",
  },
  {
    question: "Quels sont les documents requis pour une demande d'AMM ?",
    answer:
      "Les documents requis varient selon le type de produit et la procédure. Vous pouvez consulter la page Services pour voir les procédures disponibles.",
  },
  {
    question: "Comment suivre l'état de ma demande ?",
    answer:
      "Depuis votre espace, accédez à la section Suivi Demande afin de consulter l’état de traitement, le score et les actions demandées.",
  },
  {
    question: "Quels sont les délais de traitement ?",
    answer:
      "Les délais dépendent du type de demande, de la complétude du dossier et des éventuelles pièces à corriger ou à compléter.",
  },
  {
    question: "Comment contacter un agent AMMPS ?",
    answer:
      "Vous pouvez utiliser la messagerie administrative ou prendre rendez-vous avec le service concerné depuis l’espace Accès rapide.",
  },
  {
    question: "Comment compléter un dossier incomplet ?",
    answer:
      "Allez dans la messagerie, sélectionnez le dossier concerné, joignez les documents manquants, relancez l’analyse puis envoyez votre message.",
  },
];

const Aide = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
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

      <main className="container-gov py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 mb-4 shadow-inner">
              <HelpCircle className="w-8 h-8 text-emerald-700" />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
              Centre d'aide
            </h1>

            <p className="text-slate-600 max-w-2xl mx-auto">
              Retrouvez les réponses aux questions fréquentes sur l’utilisation
              de la plateforme AMMPS.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-emerald-100 p-6 md:p-8 shadow-2xl shadow-emerald-900/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Search className="w-5 h-5 text-emerald-700" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Questions fréquentes
                </h2>
                <p className="text-sm text-slate-500">
                  Informations essentielles pour les utilisateurs de la plateforme.
                </p>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-emerald-100"
                >
                  <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-emerald-700">
                    {faq.question}
                  </AccordionTrigger>

                  <AccordionContent className="text-slate-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Aide;
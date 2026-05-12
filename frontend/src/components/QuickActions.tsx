import { Link } from "react-router-dom";
import {
  MessageSquare,
  Calendar,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const actions = [
  {
    icon: MessageSquare,
    title: "Messagerie",
    description: "Consultez et envoyez vos échanges avec les services de l’AMMPS.",
    href: "/messagerie",
    badge: "Échanges",
    detail: "Accéder à la messagerie",
  },
  {
    icon: Calendar,
    title: "Rendez-vous",
    description: "Planifiez une rencontre administrative avec les équipes compétentes.",
    href: "/rendez-vous",
    badge: "Planification",
    detail: "Prendre un rendez-vous",
  },
  {
    icon: HelpCircle,
    title: "Aide & FAQ",
    description: "Trouvez des réponses rapides et consultez l’assistance utilisateur.",
    href: "/aide",
    badge: "Support",
    detail: "Consulter l’aide",
  },
];

const QuickActions = () => {
  return (
    <section id="quick-access" className="py-20 md:py-24 bg-gradient-to-b from-white to-emerald-50/40">
      <div className="container-gov">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-full mb-4 shadow-sm">
            <Sparkles className="w-4 h-4" />
            Accès rapide
          </span>

          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Accédez à vos espaces administratifs
          </h2>

          <p className="text-slate-600 text-lg">
            Choisissez l’espace correspondant à votre besoin : messagerie,
            rendez-vous ou assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {actions.map((action, index) => (
            <Link
              key={action.title}
              to={action.href}
              className="group relative overflow-hidden bg-white rounded-3xl border border-emerald-100 p-7 shadow-[0_6px_0_#d1fae5,0_18px_35px_rgba(15,118,110,0.08)] hover:shadow-[0_3px_0_#a7f3d0,0_24px_45px_rgba(15,118,110,0.14)] hover:-translate-y-2 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="absolute top-5 right-5">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {action.badge}
                </span>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6 group-hover:bg-emerald-700 group-hover:scale-110 transition-all duration-300">
                <action.icon className="w-8 h-8 text-emerald-700 group-hover:text-white transition-colors" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                {action.title}
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                {action.description}
              </p>

              <div className="flex items-center justify-between pt-5 border-t border-emerald-100">
                <span className="text-sm font-medium text-slate-500">
                  {action.detail}
                </span>

                <span className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-700 transition-colors">
                  <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:text-white transition-colors" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickActions;
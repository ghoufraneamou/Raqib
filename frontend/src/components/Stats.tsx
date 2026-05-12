import { FileCheck, Clock, ShieldCheck } from "lucide-react";

const stats = [
  {
    icon: FileCheck,
    value: "+100",
    label: "Dossiers traités",
  },
  {
    icon: Clock,
    value: "30 jours",
    label: "Délai moyen",
  },
  {
    icon: ShieldCheck,
    value: "99%",
    label: "Plateforme sécurisée",
  },
];

const Stats = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container-gov">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((item) => (
            <div
              key={item.label}
              className="bg-emerald-50/60 border border-emerald-100 rounded-3xl p-8 text-center shadow-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-7 h-7 text-emerald-700" />
              </div>

              <p className="text-3xl font-extrabold text-slate-900">
                {item.value}
              </p>

              <p className="text-sm text-slate-600 mt-1">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
import { Link, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  ClipboardCheck, 
  FileSignature, 
  Settings, 
  Calendar, 
  BarChart3,
  LogOut,
  Bell,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/agent" },
  { icon: Users, label: "Inscriptions", path: "/agent/inscriptions" },
  { icon: FolderOpen, label: "Dossiers", path: "/agent/dossiers" },
  { icon: ClipboardCheck, label: "Évaluation", path: "/agent/evaluation" },
  { icon: FileSignature, label: "E-Parapheur", path: "/agent/parapheur" },
  { icon: Calendar, label: "Convocations", path: "/agent/convocations" },
  { icon: BarChart3, label: "Reporting", path: "/agent/reporting" },
  { icon: Settings, label: "Paramétrage", path: "/agent/parametrage" },
];

const AgentDashboard = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">A</span>
            </div>
            <div>
              <h1 className="font-bold text-foreground">AMMPS</h1>
              <p className="text-xs text-muted-foreground">Back Office</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== "/agent" && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div>
            <h2 className="font-semibold text-foreground">AMMPS - BACK OFFICE</h2>
            <p className="text-sm text-muted-foreground">Agent: Dr. Ahmed Benali | Rôle: Évaluateur</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
<div className="p-4 border-t border-border">
  <Button
    variant="ghost"
    className="w-full justify-start gap-2 text-muted-foreground"
    onClick={() => {
      localStorage.removeItem("token");
      window.location.href = "/login"; // redirect after logout
    }}
  >
    <LogOut className="w-4 h-4" />
    Déconnexion
  </Button>
</div>

export default AgentDashboard;

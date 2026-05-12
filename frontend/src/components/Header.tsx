import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  User,
  FileText,
  Search,
  LogIn,
  LayoutDashboard,
  LogOut,
  Home,
  Phone,
  Layers,
  Info,
  MessageSquare,
  Calendar,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ammpsLogo from "../assets/logo_ammps.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { token, user, logout } = useAuth();
  const isLoggedIn = Boolean(token);

  const box3D =
    "h-11 px-4 rounded-xl bg-white border border-emerald-100 text-slate-700 font-semibold shadow-[0_4px_0_#d1fae5,0_8px_18px_rgba(15,118,110,0.08)] hover:shadow-[0_2px_0_#a7f3d0,0_12px_24px_rgba(15,118,110,0.16)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_1px_0_#a7f3d0] transition-all duration-200";

  const goToSection = (id: string) => {
    if (window.location.pathname !== "/") {
      window.location.href = `/#${id}`;
      return;
    }

    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navigation = [
    { name: "Accueil", href: "/", icon: Home, section: null },
    { name: "Services", href: "/services", icon: Layers, section: null },
    { name: "Suivi Demande", href: "/suivi", icon: FileText },
    { name: "Contact", href: "", icon: Phone, section: "contact" },
    { name: "À propos", href: "/about-ammps", icon: Info, section: null },
  ];

  const quickAccessItems = [
    {
      name: "Messagerie",
      href: "/messagerie",
      icon: MessageSquare,
      description: "Échanges avec les services",
    },
    {
      name: "Rendez-vous",
      href: "/rendez-vous",
      icon: Calendar,
      description: "Planifier une rencontre",
    },
    {
      name: "Aide",
      href: "/aide",
      icon: HelpCircle,
      description: "Assistance et FAQ",
    },
  ];

  const searchItems = [
    { label: "Accueil", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Suivi demande", href: "/#suivi" },
    { label: "Contact", href: "/#contact" },
    { label: "À propos AMMPS", href: "/about-ammps" },
    { label: "Messagerie", href: "/messagerie" },
    { label: "Rendez-vous", href: "/rendez-vous" },
    { label: "Aide", href: "/aide" },
    { label: "Connexion", href: "/login" },
    { label: "Créer un compte", href: "/register" },
    { label: "Dépôt de demande", href: "/depot" },
  ];

  const filteredResults = searchItems.filter((item) =>
    item.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between min-h-20 gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-100 shadow-sm flex items-center justify-center overflow-hidden">
              <img
                src={ammpsLogo}
                alt="AMMPS"
                className="w-12 h-12 object-contain"
              />
            </div>

            <div className="hidden sm:block leading-tight">
              <h1 className="text-lg md:text-xl font-bold text-slate-900">
                AMMPS
              </h1>
              <p className="text-xs text-emerald-700 font-medium">
                Portail des Services Digitaux
              </p>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-1.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-1.5 shadow-inner">
            {navigation.map((item) => {
              const Icon = item.icon;

              if (item.section) {
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => goToSection(item.section!)}
                    className={`group flex items-center gap-2 text-sm ${box3D}`}
                  >
                    <Icon className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                    {item.name}
                  </button>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center gap-2 text-sm ${box3D}`}
                >
                  <Icon className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                  {item.name}
                </Link>
              );
            })}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className={`gap-2 ${box3D}`}>
                  <Layers className="w-4 h-4 text-emerald-700" />
                  Accès rapide
                  <ChevronDown className="w-4 h-4 text-emerald-700" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="center"
                className="w-72 rounded-2xl border-emerald-100 shadow-2xl p-2"
              >
                {quickAccessItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link
                        to={item.href}
                        className="flex items-start gap-3 rounded-xl p-3 cursor-pointer hover:bg-emerald-50"
                      >
                        <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-emerald-700" />
                        </span>

                        <span>
                          <span className="block font-semibold text-slate-800">
                            {item.name}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="hidden md:flex items-center gap-2 relative">
            <div className="relative">
              <Button
                className={`gap-2 ${box3D}`}
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="w-4 h-4" />
                <span className="hidden lg:inline">Rechercher</span>
              </Button>

              {showSearch && (
                <div className="absolute right-0 top-14 w-80 bg-white border border-emerald-100 rounded-2xl shadow-2xl p-4 z-50">
                  <input
                    autoFocus
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Rechercher une page ou un service..."
                    className="w-full h-11 px-4 rounded-xl border border-emerald-100 outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />

                  <div className="mt-3 space-y-1 max-h-60 overflow-auto">
                    {filteredResults.length > 0 ? (
                      filteredResults.map((item) => (
                        <Link
                          key={item.label}
                          to={item.href}
                          onClick={() => {
                            setShowSearch(false);
                            setSearchValue("");
                          }}
                          className="block px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 text-slate-700"
                        >
                          {item.label}
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 px-3 py-2">
                        Aucun résultat trouvé.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className={`gap-2 ${box3D}`}>
                    <User className="w-4 h-4" />
                    <span className="max-w-[140px] truncate">
                      {user?.full_name?.split(" ")[0] ||
                        localStorage.getItem("user_full_name")?.split(" ")[0] ||
                        "Mon compte"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link
                      to="/agent"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard Agent
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="flex items-center gap-2 cursor-pointer text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/register">
                  <Button className={box3D}>Inscription</Button>
                </Link>

                <Link to="/login">
                  <Button className="h-11 rounded-xl gap-2 bg-emerald-700 hover:bg-emerald-800 shadow-[0_4px_0_#065f46,0_8px_18px_rgba(6,95,70,0.18)] hover:-translate-y-0.5 transition-all">
                    <LogIn className="w-4 h-4" />
                    <span>Se connecter</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <button
            className="xl:hidden p-2 rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="xl:hidden py-4 border-t border-emerald-100">
            <nav className="grid gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;

                if (item.section) {
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        goToSection(item.section!);
                        setIsMenuOpen(false);
                      }}
                      className="px-4 py-3 text-left text-sm font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-3"
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-3"
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}

              <div className="mt-2 pt-3 border-t border-emerald-100">
                <p className="px-4 pb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Accès rapide
                </p>

                {quickAccessItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-3"
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
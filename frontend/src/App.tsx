import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DepotDemande from "./pages/DepotDemande";
import Messagerie from "./pages/Messagerie";
import RendezVous from "./pages/RendezVous";
import Aide from "./pages/Aide";
import NotFound from "./pages/NotFound";
import ServicesPage from "./pages/ServicesPage";
import AboutAmmps from "./pages/AboutAmmps";
import SuiviPage from "./pages/SuiviPage";

import AgentDashboard from "./pages/agent/AgentDashboard";
import DashboardHome from "./pages/agent/DashboardHome";
import Dossiers from "./pages/agent/Dossiers";
import Evaluation from "./pages/agent/Evaluation";
import Parapheur from "./pages/agent/Parapheur";
import Convocations from "./pages/agent/Convocations";
import Reporting from "./pages/agent/Reporting";
import Parametrage from "./pages/agent/Parametrage";

import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import AiChatWidget from "@/components/AiChatWidget";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route path="/about-ammps" element={<AboutAmmps />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/services"
                element={
                  <ProtectedRoute>
                    <ServicesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/suivi"
                element={
                  <ProtectedRoute>
                    <SuiviPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/depot"
                element={
                  <ProtectedRoute>
                    <DepotDemande />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/messagerie"
                element={
                  <ProtectedRoute>
                    <Messagerie />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/rendez-vous"
                element={
                  <ProtectedRoute>
                    <RendezVous />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/aide"
                element={
                  <ProtectedRoute>
                    <Aide />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/agent"
                element={
                  <ProtectedRoute>
                    <AgentDashboard />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardHome />} />
                <Route path="dossiers" element={<Dossiers />} />
                <Route path="evaluation" element={<Evaluation />} />
                <Route path="parapheur" element={<Parapheur />} />
                <Route path="convocations" element={<Convocations />} />
                <Route path="reporting" element={<Reporting />} />
                <Route path="parametrage" element={<Parametrage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>

            <AiChatWidget />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
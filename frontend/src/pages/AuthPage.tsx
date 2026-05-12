import { Navigate } from "react-router-dom";

/** Ancienne page Supabase — redirige vers la connexion locale. */
export default function AuthPage() {
  return <Navigate to="/login" replace />;
}

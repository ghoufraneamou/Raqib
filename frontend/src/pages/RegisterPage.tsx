import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import ministryLogo from "../assets/logo_ministry.png";
import ammpsLogo from "../assets/logo_ammps.png";

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export default function RegisterPage() {
  const { registerStart, registerVerify, token } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);

  useEffect(() => {
    if (token) navigate("/", { replace: true });
  }, [token, navigate]);

  const start = async () => {
    if (!email.trim() || !password) {
      return toast.error("E-mail et mot de passe requis.");
    }

    if (password.length < 8) {
      return toast.error("Minimum 8 caractères.");
    }

    setLoading(true);
    setDevHint(null);

    try {
      const res = await registerStart({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
      });

      toast.success(res.message);
      if (res.dev_code) setDevHint(`Code : ${res.dev_code}`);
      setStep(2);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (code.length !== 6) {
      return toast.error("Code invalide.");
    }

    setLoading(true);

    try {
      await registerVerify(email.trim(), code);
      toast.success("Compte activé");
      navigate("/login");
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">

      {/* HEADER */}
      <header className="bg-white border-b shadow-sm">
        <div className="flex justify-center py-4">
          <img src={ministryLogo} className="h-20" />
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 items-center gap-12">

          {/* LEFT — ANIMATED LOGO */}
          <div className="hidden lg:flex items-center justify-center relative">

            {/* Glow */}
            <div className="absolute w-[520px] h-[520px] rounded-full bg-emerald-200/30 blur-3xl animate-[softGlow_5s_ease-in-out_infinite]" />

            {/* Logo */}
            <div className="relative w-[700px] h-[460px] flex items-center justify-center overflow-hidden animate-[floatLogo_6s_ease-in-out_infinite]">
              <img
                src={ammpsLogo}
                className="w-[660px] opacity-[0.76] blur-[0.35px] mix-blend-multiply"
              />

              {/* Strong smooth blending */}
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_42%,#ecfdf5_78%)]" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/70 via-transparent to-emerald-50/70" />
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-transparent to-emerald-50/70" />
            </div>

          </div>

          {/* RIGHT — FORM */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-2xl shadow-emerald-900/10 p-8 space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-900/20">

              <div className="text-center">
                <h1 className="text-3xl font-bold">Créer un compte</h1>
                <p className="text-sm text-gray-500">
                  Code envoyé par email
                </p>
              </div>

              {step === 1 ? (
                <>
                  <div>
                    <Label>Nom complet</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>

                  <div>
                    <Label>E-mail</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>

                  <div>
                    <Label>Mot de passe</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>

                  <Button onClick={start} className="w-full">
                    Recevoir le code
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <Label>Code</Label>
                    <Input value={code} onChange={(e) => setCode(e.target.value)} />
                  </div>

                  <Button onClick={verify} className="w-full">
                    Valider
                  </Button>
                </>
              )}

              <p className="text-center text-sm">
                Déjà inscrit ?{" "}
                <Link to="/login" className="text-emerald-700">
                  Se connecter
                </Link>
              </p>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
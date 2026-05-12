import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Lock } from "lucide-react";
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

export default function LoginPage() {
  const { loginSendCode, loginVerify, token } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) navigate("/", { replace: true });
  }, [token, navigate]);

  const sendCode = async () => {
    if (!email.trim()) return toast.error("Indiquez votre e-mail.");
    if (!password) return toast.error("Indiquez votre mot de passe.");

    setLoading(true);

    try {
      await loginSendCode({ email: email.trim(), password });
      setStep(2);
      toast.success("Code envoyé");
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (code.replace(/\s/g, "").length !== 6) {
      return toast.error("Code à 6 chiffres requis.");
    }

    setLoading(true);

    try {
      const data = await loginVerify({
        email: email.trim(),
        password,
        code,
      });

      if (data?.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }

      if (data?.user?.email) {
        localStorage.setItem("user_email", data.user.email);
      } else {
        localStorage.setItem("user_email", email.trim());
      }

      if (data?.user?.full_name) {
        localStorage.setItem("user_full_name", data.user.full_name);
      }

      toast.success("Connexion réussie");
      navigate("/", { replace: true });
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      <header className="relative z-20 bg-white/95 border-b border-emerald-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-center">
          <img
            src={ministryLogo}
            alt="Ministère de la Santé"
            className="h-20 object-contain"
          />
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-8 py-10">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
          <div className="hidden lg:flex items-center justify-center relative">
            <div className="absolute w-[480px] h-[480px] rounded-full bg-emerald-200/20 blur-2xl animate-[softGlow_6s_ease-in-out_infinite]" />

            <div className="relative w-[640px] h-[420px] flex items-center justify-center animate-[floatLogo_8s_ease-in-out_infinite]">
              <img
                src={ammpsLogo}
                alt="AMMPS"
                className="w-[600px] opacity-[0.9] mix-blend-multiply"
              />

              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_55%,#ecfdf5_85%)] pointer-events-none" />
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-2xl shadow-emerald-900/10 p-8 space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-900/20">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto shadow-inner">
                  <Mail className="w-8 h-8 text-emerald-700" />
                </div>

                <h1 className="text-3xl font-bold text-slate-900">
                  Connexion
                </h1>

                <p className="text-sm leading-relaxed text-slate-600">
                  Saisissez votre e-mail et votre mot de passe, puis un code à
                  6 chiffres vous sera envoyé par e-mail.
                </p>
              </div>

              {step === 1 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-xl bg-white/90"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Mot de passe
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-xl bg-white/90"
                    />
                  </div>

                  <Button
                    onClick={sendCode}
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.01]"
                  >
                    {loading ? "Envoi…" : "Recevoir le code"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm text-slate-600">
                    Code envoyé à{" "}
                    <strong className="text-slate-900">{email}</strong>
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="code" className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4" />
                      Code à 6 chiffres
                    </Label>
                    <Input
                      id="code"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                      placeholder="000000"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="h-12 rounded-xl text-center text-2xl tracking-[0.4em] font-mono bg-white/90"
                    />
                  </div>

                  <Button
                    onClick={verify}
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.01]"
                  >
                    {loading ? "Vérification…" : "Se connecter"}
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full rounded-xl"
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setCode("");
                    }}
                  >
                    Modifier les identifiants
                  </Button>
                </div>
              )}

              <p className="text-center text-sm text-slate-600">
                Pas encore de compte ?{" "}
                <Link
                  to="/register"
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  S'inscrire
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
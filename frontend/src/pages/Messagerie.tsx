import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Paperclip,
  Inbox,
  Clock,
  CheckCheck,
  UploadCloud,
  FileSearch,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import ammpsLogo from "../assets/logo_ammps.png";

type DossierOption = {
  id: string;
  label: string;
  raw?: any;
};

type MessageType = {
  id: number;
  dossier: string;
  sujet: string;
  expediteur: string;
  date: string;
  lu: boolean;
  contenu: string;
  attachments?: string[];
  analysisSummary?: string;
};

const STORAGE_KEY = "ammps_messages";

const initialMessages: MessageType[] = [
  {
    id: 1,
    dossier: "AMM-2025-001",
    sujet: "Demande de complément",
    expediteur: "AMMPS",
    date: "05/01/2025",
    lu: true,
    contenu: "Veuillez fournir les documents manquants ou à revérifier.",
  },
];

const fallbackDossiers: DossierOption[] = [
  { id: "AMM-2025-001", label: "AMM-2025-001 - Paracétamol 500mg" },
  { id: "AMM-2025-005", label: "AMM-2025-005 - Ibuprofène 400mg" },
  { id: "REN-2024-890", label: "REN-2024-890 - Renouvellement Aspirine" },
];

const Messagerie = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<"inbox" | "compose">("inbox");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageType | null>(
    null
  );

  const [dossiers, setDossiers] = useState<DossierOption[]>(fallbackDossiers);
  const [loadingDossiers, setLoadingDossiers] = useState(false);

  const [newMessage, setNewMessage] = useState({
    dossier: "",
    sujet: "",
    message: "",
  });

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [attachmentAnalysis, setAttachmentAnalysis] = useState<any | null>(null);

  const selectedDossier = useMemo(
    () => dossiers.find((d) => d.id === newMessage.dossier),
    [dossiers, newMessage.dossier]
  );

  const unreadCount = messages.filter(
    (m) => !m.lu && m.expediteur === "AMMPS"
  ).length;

  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);

    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch {
        setMessages(initialMessages);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMessages));
      }
    } else {
      setMessages(initialMessages);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMessages));
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    fetchSubmittedDossiers();
  }, []);

  const fetchSubmittedDossiers = async () => {
    setLoadingDossiers(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/dossiers");
      const data = await res.json();

      const apiDossiers: DossierOption[] = (data.dossiers || []).map(
        (d: any) => ({
          id: d.dossier_id,
          label: `${d.dossier_id} - ${
            d.product_name || d.dossier_status || "Dossier AMMPS"
          }`,
          raw: d,
        })
      );

      if (apiDossiers.length > 0) {
        setDossiers(apiDossiers);
      }
    } catch (error) {
      console.error("Erreur chargement dossiers:", error);
    } finally {
      setLoadingDossiers(false);
    }
  };

  const buildValidationPayload = () => {
    const raw = selectedDossier?.raw || {};
    const report = raw.report || {};

    const context = report.submission_context || {
      entity_type: "societe",
      activity_types: [],
      request_type: "nouvel-enregistrement",
      has_cannabis: false,
    };

    return {
      context,
      declarant: {},
      operatorData: {
        email:
          localStorage.getItem("user_email") ||
          localStorage.getItem("email") ||
          "",
      },
      product: {
        product_name: raw.product_name || "",
      },
      productData: {},
      visaData: {},
      modifications: [],
      noChange: false,
    };
  };

  const handleAttachFiles = (files: FileList | null) => {
    if (!files) return;

    const allowed = ["application/pdf", "image/png", "image/jpeg"];

    const selected = Array.from(files).filter((file) => {
      const ok = allowed.includes(file.type);
      if (!ok) {
        toast.error(`${file.name} : format non supporté.`);
      }
      return ok;
    });

    setAttachedFiles((prev) => [...prev, ...selected]);
    setAttachmentAnalysis(null);
  };

  const removeFile = (name: string) => {
    setAttachedFiles((prev) => prev.filter((file) => file.name !== name));
    setAttachmentAnalysis(null);
  };

  const handleAnalyzeAttachments = async () => {
    if (!newMessage.dossier) {
      toast.error("Veuillez sélectionner un dossier.");
      return;
    }

    if (attachedFiles.length === 0) {
      toast.error("Veuillez joindre au moins un fichier.");
      return;
    }

    const userEmail =
      localStorage.getItem("user_email") ||
      localStorage.getItem("email") ||
      localStorage.getItem("userEmail");

    if (!userEmail) {
      toast.error("Email utilisateur introuvable. Veuillez vous reconnecter.");
      return;
    }

    setAnalyzing(true);
    setAttachmentAnalysis(null);

    try {
      const payload = buildValidationPayload();
      const formData = new FormData();

      attachedFiles.forEach((file) => {
        formData.append("files", file);
      });

      formData.append("context", JSON.stringify(payload.context));
      formData.append("declarant", JSON.stringify(payload.declarant));
      formData.append("operatorData", JSON.stringify(payload.operatorData));
      formData.append("product", JSON.stringify(payload.product));
      formData.append("productData", JSON.stringify(payload.productData));
      formData.append("visaData", JSON.stringify(payload.visaData));
      formData.append("modifications", JSON.stringify(payload.modifications));
      formData.append("noChange", JSON.stringify(payload.noChange));

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("ammps_access_token") ||
        "";

      const res = await fetch("http://127.0.0.1:8000/validate", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail || "Analyse impossible. Vérifiez les fichiers joints."
        );
      }

      setAttachmentAnalysis(data);
      toast.success("Pièces jointes analysées avec succès.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur pendant l’analyse des pièces jointes.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSend = () => {
    if (!newMessage.dossier || !newMessage.sujet || !newMessage.message.trim()) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    if (attachedFiles.length > 0 && !attachmentAnalysis) {
      toast.error("Veuillez analyser les pièces jointes avant l’envoi.");
      return;
    }

    const summary =
      attachmentAnalysis?.compliance_score !== undefined
        ? `Analyse relancée — score: ${
            attachmentAnalysis.compliance_score
          }% | statut: ${attachmentAnalysis.dossier_status || "N/A"}`
        : "";

    const newMsg: MessageType = {
      id: Date.now(),
      dossier: newMessage.dossier,
      sujet: newMessage.sujet,
      expediteur: "Vous",
      date: new Date().toLocaleDateString("fr-FR"),
      lu: true,
      contenu: newMessage.message.trim(),
      attachments: attachedFiles.map((f) => f.name),
      analysisSummary: summary,
    };

    setMessages((prev) => [newMsg, ...prev]);

    toast.success("Message envoyé avec succès.");

    setNewMessage({
      dossier: "",
      sujet: "",
      message: "",
    });

    setAttachedFiles([]);
    setAttachmentAnalysis(null);
    setSelectedMessage(null);
    setActiveTab("inbox");
  };

  const handleOpenMessage = (message: MessageType) => {
    if (!message.lu && message.expediteur === "AMMPS") {
      const updatedMessages = messages.map((msg) =>
        msg.id === message.id ? { ...msg, lu: true } : msg
      );
      setMessages(updatedMessages);
      setSelectedMessage({ ...message, lu: true });
    } else {
      setSelectedMessage(message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <img
        src={ammpsLogo}
        alt=""
        className="pointer-events-none absolute left-[-120px] top-40 w-[620px] opacity-[0.06] blur-[1px] mix-blend-multiply"
      />

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

      <main className="relative z-10 container-gov py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <MessageSquare className="w-8 h-8 text-emerald-700" />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
              Messagerie administrative
            </h1>

            <p className="text-slate-600">
              Échangez avec les services de l’AMMPS, complétez vos dossiers et
              relancez l’analyse des pièces jointes.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-emerald-100 shadow-2xl shadow-emerald-900/10 overflow-hidden">
            <div className="grid grid-cols-2 border-b border-emerald-100">
              <button
                onClick={() => {
                  setActiveTab("inbox");
                  setSelectedMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-5 font-semibold transition-all ${
                  activeTab === "inbox"
                    ? "bg-emerald-50 text-emerald-800 border-b-2 border-emerald-700"
                    : "text-slate-500 hover:text-emerald-700 hover:bg-emerald-50/60"
                }`}
              >
                <Inbox className="w-5 h-5" />
                Boîte de réception
                <span className="bg-emerald-700 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("compose");
                  setSelectedMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-5 font-semibold transition-all ${
                  activeTab === "compose"
                    ? "bg-emerald-50 text-emerald-800 border-b-2 border-emerald-700"
                    : "text-slate-500 hover:text-emerald-700 hover:bg-emerald-50/60"
                }`}
              >
                <Send className="w-5 h-5" />
                Nouveau message
              </button>
            </div>

            <div className="p-6 md:p-8">
              {activeTab === "inbox" && !selectedMessage && (
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-14 text-slate-500">
                      Aucun message disponible.
                    </div>
                  ) : (
                    messages.map((message) => (
                      <button
                        key={message.id}
                        onClick={() => handleOpenMessage(message)}
                        className={`w-full text-left p-5 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                          message.expediteur === "Vous"
                            ? "border-emerald-100 bg-emerald-50/50"
                            : message.lu
                            ? "border-slate-100 bg-white"
                            : "border-emerald-300 bg-emerald-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {!message.lu &&
                                message.expediteur === "AMMPS" && (
                                  <span className="w-2 h-2 bg-emerald-700 rounded-full" />
                                )}

                              <span className="font-bold text-slate-900">
                                {message.sujet}
                              </span>
                            </div>

                            <p className="text-sm text-slate-600 line-clamp-2">
                              {message.contenu}
                            </p>

                            <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 flex-wrap">
                              <span className="bg-white border border-emerald-100 px-2 py-1 rounded-full">
                                {message.dossier}
                              </span>

                              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                {message.expediteur}
                              </span>

                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {message.date}
                              </span>

                              {message.attachments &&
                                message.attachments.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Paperclip className="w-3 h-3" />
                                    {message.attachments.length} fichier(s)
                                  </span>
                                )}
                            </div>
                          </div>

                          {message.lu && (
                            <CheckCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {activeTab === "inbox" && selectedMessage && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMessage(null)}
                    className="mb-5"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4 gap-4">
                      <h3 className="text-xl font-bold text-slate-900">
                        {selectedMessage.sujet}
                      </h3>
                      <span className="text-sm text-slate-500">
                        {selectedMessage.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-5 text-sm flex-wrap">
                      <span className="bg-white border border-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                        {selectedMessage.dossier}
                      </span>

                      <span className="text-slate-500">
                        De : {selectedMessage.expediteur}
                      </span>
                    </div>

                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {selectedMessage.contenu}
                    </p>

                    {selectedMessage.analysisSummary && (
                      <div className="mt-5 rounded-xl bg-white border border-emerald-100 p-4 text-sm text-emerald-800">
                        {selectedMessage.analysisSummary}
                      </div>
                    )}

                    {selectedMessage.attachments &&
                      selectedMessage.attachments.length > 0 && (
                        <div className="mt-5">
                          <p className="font-semibold text-sm mb-2">
                            Pièces jointes :
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {selectedMessage.attachments.map((file) => (
                              <span
                                key={file}
                                className="text-xs bg-white border border-emerald-100 px-3 py-1 rounded-full"
                              >
                                {file}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedMessage.expediteur !== "Vous" && (
                      <div className="mt-6 pt-4 border-t border-emerald-100">
                        <Button onClick={() => setActiveTab("compose")}>
                          Répondre
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "compose" && (
                <div className="grid lg:grid-cols-[1fr_360px] gap-8">
                  <div className="space-y-6">
                    <div>
                      <Label>Dossier *</Label>
                      <Select
                        value={newMessage.dossier}
                        onValueChange={(value) => {
                          setNewMessage({ ...newMessage, dossier: value });
                          setAttachmentAnalysis(null);
                        }}
                      >
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue
                            placeholder={
                              loadingDossiers
                                ? "Chargement des dossiers..."
                                : "Sélectionner un dossier"
                            }
                          />
                        </SelectTrigger>

                        <SelectContent>
                          {dossiers.map((dossier) => (
                            <SelectItem key={dossier.id} value={dossier.id}>
                              {dossier.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sujet">Sujet *</Label>
                      <Input
                        id="sujet"
                        value={newMessage.sujet}
                        onChange={(e) =>
                          setNewMessage({
                            ...newMessage,
                            sujet: e.target.value,
                          })
                        }
                        placeholder="Objet de votre message"
                        className="h-12 rounded-xl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={newMessage.message}
                        onChange={(e) =>
                          setNewMessage({
                            ...newMessage,
                            message: e.target.value,
                          })
                        }
                        placeholder="Rédigez votre message..."
                        rows={8}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <Button
                        variant="outline"
                        className="gap-2 rounded-xl"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="w-4 h-4" />
                        Joindre des fichiers
                      </Button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => handleAttachFiles(e.target.files)}
                      />

                      <Button
                        onClick={handleSend}
                        className="gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800"
                        type="button"
                      >
                        <Send className="w-4 h-4" />
                        Envoyer
                      </Button>
                    </div>
                  </div>

                  <aside className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 h-fit">
                    <div className="flex items-center gap-2 mb-4">
                      <UploadCloud className="w-5 h-5 text-emerald-700" />
                      <h3 className="font-bold text-slate-900">
                        Pièces complémentaires
                      </h3>
                    </div>

                    <p className="text-sm text-slate-600 mb-4">
                      Ajoutez ici les documents manquants ou à revérifier. Ils
                      seront relancés dans le pipeline avant l’envoi.
                    </p>

                    {attachedFiles.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-emerald-200 rounded-2xl p-6 text-sm text-emerald-700 hover:bg-emerald-50 transition"
                      >
                        Cliquez pour joindre des fichiers
                      </button>
                    ) : (
                      <div className="space-y-2">
                        {attachedFiles.map((file) => (
                          <div
                            key={file.name}
                            className="flex items-center justify-between gap-2 rounded-xl bg-white border border-emerald-100 px-3 py-2 text-sm"
                          >
                            <span className="truncate">{file.name}</span>

                            <button
                              type="button"
                              onClick={() => removeFile(file.name)}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {attachedFiles.length > 0 && (
                      <Button
                        type="button"
                        onClick={handleAnalyzeAttachments}
                        disabled={analyzing}
                        className="w-full mt-4 gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800"
                      >
                        <FileSearch className="w-4 h-4" />
                        {analyzing
                          ? "Analyse en cours..."
                          : "Analyser les pièces jointes"}
                      </Button>
                    )}

                    {attachmentAnalysis && (
                      <div className="mt-4 rounded-xl bg-white border border-emerald-100 p-4">
                        <div className="flex items-center gap-2 font-semibold text-emerald-700 mb-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Analyse terminée
                        </div>

                        <p className="text-sm text-slate-600">
                          Score :{" "}
                          <strong>
                            {attachmentAnalysis.compliance_score ?? 0}%
                          </strong>
                        </p>

                        <p className="text-sm text-slate-600">
                          Statut :{" "}
                          <strong>
                            {attachmentAnalysis.dossier_status || "N/A"}
                          </strong>
                        </p>

                        {attachmentAnalysis.missing_required_document_labels
                          ?.length > 0 && (
                          <div className="mt-3 text-sm text-orange-700 flex gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            Des documents restent manquants.
                          </div>
                        )}
                      </div>
                    )}
                  </aside>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messagerie;
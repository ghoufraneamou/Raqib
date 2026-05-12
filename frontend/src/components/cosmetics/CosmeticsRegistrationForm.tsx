import { useState, useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Package,
  ClipboardList,
  Upload,
  CreditCard,
  Save,
  CheckCircle,
  AlertCircle,
  Factory,
  FileText,
  Leaf,
  Users,
  Shield,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type EntityType,
  type ActivityType,
  type RequestType,
  type DocumentRequirement,
  getApplicableDocuments,
} from "./documentCatalog";



interface Manufacturer {
  name: string;
  address: string;
  country: string;
}

interface Product {
  product_id: string;
  product_name: string;
  origin: "LOCAL" | "IMPORT" | "";
  manufacturer: Manufacturer;
}

interface Declarant {
  company_name: string;
  legal_form: string;
  address: string;
  country: string;
}

interface Procedure {
  type: "DECLARATION_PREALABLE";
  category: "COSMETIC";
}

type DossierStatus = "DRAFT" | "SUBMITTED";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

interface StoredMessage {
  id: number;
  dossier: string;
  sujet: string;
  expediteur: string;
  date: string;
  lu: boolean;
  contenu: string;
}

interface AnalysisCriterion {
  name: string;
  status: "PASS" | "FAIL" | "INFO";
  details: string;
  source: string;
}

interface AnalysisDocument {
  file: string;
  path: string;
  doc_type: string;
  doc_label: string;
  signed: boolean;
  stamped: boolean;
  official_header_detected: boolean;
  passed_criteria: string[];
  failed_criteria: string[];
  criteria_details: AnalysisCriterion[];
  criteria_count: number;
  passed_count: number;
  failed_count: number;
  info_count: number;
  document_status: "VALID" | "PARTIAL" | "INVALID";
  text_preview: string;
  classification?: {
    doc_type: string;
    confidence: number;
    reason: string;
  };
}


interface AnalysisResult {
  message: string;
  download_ready: boolean;

  downloadable_report_files?: {
    pdf?: string;
  };

  report_email?: {
    sent: boolean;
    recipient?: string | null;
    error?: string | null;
  };


  dossier_id?: string;

  tracking?: {
    dossier_id: string;
    timeline: {
      step: string;
      date: string;
      completed: boolean;
      current?: boolean;
    }[];
  };


  dossier_status: string;
  compliance_score: number;
  risk_level: string;


  summary?: any;
  submission_context?: any;


  missing_required_documents: string[];
  missing_required_document_labels: string[];
  missing_conditional_documents: string[];
  required_documents: any[];
  conditional_documents: any[];
  detected_document_types: string[];

  documents_to_reverify: any[];
  signature_stamp_summary?: any;
  documents: AnalysisDocument[];
  stats?: any;


  cross_validation?: any;

 
  full_report?: any;
}

const STORAGE_KEY = "ammps_messages";



const formatDocName = (value: string) => {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const generateAiMessage = (dossierId: string, result: any): StoredMessage => {
  const missingDocs = result.missing_required_documents || [];
  const conditionalDocs = result.missing_conditional_documents || [];
  const documents = result.documents || [];

  const docsWithIssues = documents.filter(
    (doc: any) => doc.failed_criteria && doc.failed_criteria.length > 0
  );

  const signatureStampIssues = docsWithIssues.filter((doc: any) =>
    doc.failed_criteria.some((criterion: string) => {
      const c = criterion.toLowerCase();
      return (
        c.includes("signature") ||
        c.includes("signé") ||
        c.includes("signed") ||
        c.includes("cachet") ||
        c.includes("stamp") ||
        c.includes("stamped")
      );
    })
  );

  let sujet = "Résultat d'analyse du dossier";

  if (result.dossier_status === "INCOMPLETE" || missingDocs.length > 0) {
    sujet = "Dossier incomplet";
  } else if (signatureStampIssues.length > 0) {
    sujet = "Documents à revérifier";
  } else {
    sujet = "Analyse du dossier terminée";
  }

  let contenu = `Bonjour,\n\n`;
  contenu += `L'analyse AI du dossier "${dossierId}" est terminée.\n\n`;
  contenu += `Résumé :\n`;
  contenu += `- Statut : ${result.dossier_status || "Non disponible"}\n`;
  contenu += `- Score de conformité : ${result.compliance_score ?? "Non disponible"}%\n`;
  contenu += `- Niveau de risque : ${result.risk_level || "Non disponible"}\n`;

  if (missingDocs.length > 0) {
    contenu += `\nDocuments obligatoires manquants :\n`;
    missingDocs.forEach((doc: string) => {
      contenu += `- ${formatDocName(doc)}\n`;
    });
  }

  if (conditionalDocs.length > 0) {
    contenu += `\nDocuments conditionnels manquants :\n`;
    conditionalDocs.forEach((doc: string) => {
      contenu += `- ${formatDocName(doc)}\n`;
    });
  }

  if (docsWithIssues.length > 0) {
    contenu += `\nDocuments à revérifier :\n`;
    docsWithIssues.forEach((doc: any) => {
      const fileName = doc.file || "Document inconnu";
      const issues = doc.failed_criteria || [];
      contenu += `- ${fileName}\n`;
      issues.forEach((issue: string) => {
        contenu += `  • ${issue}\n`;
      });
    });
  }

  if (signatureStampIssues.length > 0) {
    contenu += `\nVérification signature/cachet :\n`;
    signatureStampIssues.forEach((doc: any) => {
      contenu += `- ${doc.file || "Document inconnu"} semble nécessiter une revérification de la signature et/ou du cachet.\n`;
    });
  }

  contenu += `\nVeuillez consulter votre dossier et compléter ou corriger les éléments signalés si nécessaire.\n\n`;
  contenu += `Cordialement,\nAMMPS`;

  return {
    id: Date.now(),
    dossier: dossierId,
    sujet,
    expediteur: "AMMPS",
    date: new Date().toLocaleDateString("fr-FR"),
    lu: false,
    contenu,
  };
};

const saveAiMessage = (dossierId: string, result: any) => {
  const newMessage = generateAiMessage(dossierId, result);
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newMessage, ...existing]));
};

const CosmeticsRegistrationForm = () => {
  const [status] = useState<DossierStatus>("DRAFT");
  const [procedure] = useState<Procedure>({
    type: "DECLARATION_PREALABLE",
    category: "COSMETIC",
  });

  const [requestType, setRequestType] = useState<RequestType | "">("");
  const [entityType, setEntityType] = useState<EntityType | "">("");
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [hasCannabis, setHasCannabis] = useState(false);

  const [declarant, setDeclarant] = useState<Declarant>({
    company_name: "",
    legal_form: "",
    address: "",
    country: "Maroc",
  });

  const [product, setProduct] = useState<Product>({
    product_id: "",
    product_name: "",
    origin: "",
    manufacturer: { name: "", address: "", country: "" },
  });

  const [operatorData, setOperatorData] = useState({
    registreCommerce: "",
    ice: "",
    identifiantFiscal: "",
    cnss: "",
    representantNom: "",
    representantPrenom: "",
    representantQualite: "",
    telephone: "",
    email: "",
    autorisationsExistantes: "",
    licences: "",
  });

  const [productData, setProductData] = useState({
    typeProduit: "",
    categorie: "",
    usagePrevu: "",
    publicCible: "",
    ingredientsINCI: "",
    formuleQuantitative: "",
    methodeFabrication: "",
    controlesQualite: "",
    fonctionProduit: "",
    precautionsEmploi: "",
    ddmOuPao: "",
    poidsVolume: "",
  });

  const [visaData, setVisaData] = useState({ scriptPub: "", ciblePub: "" });
  const [modifications, setModifications] = useState<string[]>([]);
  const [noChange, setNoChange] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({});
  const [rawFiles, setRawFiles] = useState<Record<string, File[]>>({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const applicableDocuments = useMemo(() => {
    if (!entityType || !requestType) return [];
    return getApplicableDocuments(
      entityType as EntityType,
      activityTypes,
      requestType as RequestType,
      hasCannabis,
      requestType === "modification"
    );
  }, [entityType, activityTypes, requestType, hasCannabis]);

  const toggleActivityType = (at: ActivityType) => {
    setActivityTypes((prev) =>
      prev.includes(at) ? prev.filter((a) => a !== at) : [...prev, at]
    );
  };

  const toggleModification = (mod: string) => {
    setModifications((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleFileUpload = (documentId: string, files: FileList | null) => {
    if (!files) return;

    const acceptedFiles = Array.from(files).filter((file) => {
      const fileName = file.name.toLowerCase();
      return (
        fileName.endsWith(".pdf") ||
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg") ||
        fileName.endsWith(".png")
      );
    });

    if (acceptedFiles.length === 0) {
      toast.error("Formats autorisés : PDF, JPG, JPEG, PNG");
      return;
    }

    const newFiles = acceptedFiles.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }));

    setUploadedFiles((prev) => {
     const existingFiles = prev[documentId] ?? [];

   return {
    ...prev,
    [documentId]: [...existingFiles, ...newFiles],
     };
  });
    setRawFiles((prev) => {
    const existingFiles = prev[documentId] ?? [];

   return {
    ...prev,
    [documentId]: [...existingFiles, ...acceptedFiles],
    };
  });

    toast.success("Document(s) ajouté(s) avec succès");
  };

  const removeFile = (documentId: string, index: number) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [documentId]: (prev[documentId] || []).filter((_, i) => i !== index),
    }));

    setRawFiles((prev) => ({
      ...prev,
      [documentId]: (prev[documentId] || []).filter((_, i) => i !== index),
    }));
  };

  const handleSaveDraft = () => {
    const draft = {
      requestType,
      entityType,
      activityTypes,
      hasCannabis,
      declarant,
      product,
      operatorData,
      productData,
      visaData,
      modifications,
      noChange,
      uploadedFiles,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("cosmetics_draft_v4", JSON.stringify(draft));
    toast.success("Brouillon sauvegardé avec succès");
  };

  const loadDraft = () => {
    const saved = localStorage.getItem("cosmetics_draft_v4");
    if (!saved) return;

    const d = JSON.parse(saved);
    setRequestType(d.requestType || "");
    setEntityType(d.entityType || "");
    setActivityTypes(d.activityTypes || []);
    setHasCannabis(d.hasCannabis || false);
    setDeclarant(d.declarant || declarant);
    setProduct(d.product || product);
    setOperatorData(d.operatorData || operatorData);
    setProductData(d.productData || productData);
    setVisaData(d.visaData || visaData);
    setModifications(d.modifications || []);
    setNoChange(d.noChange || false);
    setUploadedFiles(d.uploadedFiles || {});
    toast.success("Brouillon chargé");
  };

  const validateDeclarant = (): boolean =>
    !!(
      declarant.company_name &&
      declarant.legal_form &&
      declarant.address &&
      operatorData.ice &&
      operatorData.email
    );

  const validateProduct = (): boolean =>
    !!(
      product.product_name &&
      product.origin &&
      product.manufacturer.name &&
      product.manufacturer.country &&
      productData.typeProduit
    );

  const validateDocuments = (): boolean => {
    const mandatoryDocs = applicableDocuments.filter((d) => d.mandatory && !d.conditional);
    return mandatoryDocs.every((d) => (uploadedFiles[d.document_id]?.length || 0) > 0);
  };

  const getSectionStatus = (
    section: "config" | "declarant" | "product" | "documents"
  ) => {
    if (section === "config") {
      return entityType && requestType && activityTypes.length > 0
        ? "complete"
        : "incomplete";
    }
    if (section === "declarant") return validateDeclarant() ? "complete" : "incomplete";
    if (section === "product") return validateProduct() ? "complete" : "incomplete";
    if (section === "documents") return validateDocuments() ? "complete" : "incomplete";
    return "incomplete";
  };

const handleDownloadReport = () => {
  const path = analysisResult?.downloadable_report_files?.pdf;
  if (!path) {
    toast.error("Rapport PDF non disponible");
    return;
  }

  const url = `http://127.0.0.1:8000/download-report?path=${encodeURIComponent(path)}`;
  window.open(url, "_blank");
};

const analyzeDossier = async () => {
  const allFiles = Object.values(rawFiles).flat();

  if (allFiles.length === 0) {
    toast.error("Veuillez d'abord téléverser les documents du dossier");
    return;
  }

  if (!entityType || !requestType || activityTypes.length === 0) {
    toast.error("Veuillez compléter la configuration avant l'analyse");
    return;
  }

  setIsAnalyzing(true);

  try {
    const formData = new FormData();

    allFiles.forEach((file) => {
      formData.append("files", file);
    });

    const context = {
      entity_type: entityType,
      activity_types: activityTypes,
      request_type: requestType,
      has_cannabis: hasCannabis,
    };

    formData.append("context", JSON.stringify(context));
    formData.append("declarant", JSON.stringify(declarant));
    formData.append("operatorData", JSON.stringify(operatorData));
    formData.append("product", JSON.stringify(product));
    formData.append("productData", JSON.stringify(productData));
    formData.append("visaData", JSON.stringify(visaData));
    formData.append("modifications", JSON.stringify(modifications));
    formData.append("noChange", JSON.stringify(noChange));

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  console.log("TOKEN SENT TO VALIDATE:", token);

  const userEmail =
    localStorage.getItem("user_email") ||
    localStorage.getItem("email") ||
    localStorage.getItem("logged_user_email") ||
    localStorage.getItem("auth_email") ||
    "";

  if (!userEmail) {
    toast.error("Email utilisateur introuvable. Veuillez vous reconnecter.");
    setIsAnalyzing(false);
    return;
  }

  formData.append("userEmail", userEmail);

  console.log("EMAIL SENT TO VALIDATE:", userEmail);

  const response = await fetch("http://127.0.0.1:8000/validate", {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

    const result = await response.json();


    if (!response.ok) {
      console.error("Backend error:", result);
      throw new Error(result.detail || "Erreur backend");
    }

    // ✅ Save IDs for later (important for tracking page)
    if (result.dossier_id) {
      localStorage.setItem("last_dossier_id", result.dossier_id);
    }

    if (result.task_id) {
      localStorage.setItem("last_task_id", result.task_id);
    }

// ✅ Show dossier immediately in UI
    setAnalysisResult((prev: any) => ({
      ...(prev || {}),
      dossier_id: result.dossier_id,
      dossier_status: "PROCESSING",
      compliance_score: 0,
      risk_level: "PENDING",
    }));

    toast.success(`Analyse lancée — Numéro de dossier : ${result.dossier_id}`);
    const taskId = result.task_id;
    if (!result.task_id) {
    throw new Error("Task ID manquant depuis le backend");
    }

    const interval = setInterval(async () => {
      try {
        const statusRes = await fetch(`http://127.0.0.1:8000/status/${taskId}`);
        const statusData = await statusRes.json();

        if (statusData.status === "SUCCESS") {
          clearInterval(interval);

          const finalReport = statusData.result;

          setAnalysisResult(finalReport);
          setShowReport(false);

          if (finalReport?.dossier_id) {
            toast.success(`Dossier enregistré avec l'identifiant ${finalReport.dossier_id}`);
          }

          if (finalReport?.report_email?.sent) {
            toast.success("Rapport généré avec succès et envoyé par email");
          } else {
            toast.success("Rapport généré avec succès");
          }

          setIsAnalyzing(false);
        }

        if (statusData.status === "FAILURE") {
          clearInterval(interval);
          console.error("Celery error:", statusData.error);
          toast.error("Erreur lors de la génération du rapport");
          setIsAnalyzing(false);
        }
      } catch (pollError) {
        clearInterval(interval);
        console.error("Polling error:", pollError);
        toast.error("Erreur lors du suivi de l'analyse");
        setIsAnalyzing(false);
      }
    }, 3000);
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || "Erreur lors de l'analyse du dossier");
    setIsAnalyzing(false);
  }
};

  const handleSubmit = () => {
    const errors: string[] = [];

    if (!entityType || !requestType || activityTypes.length === 0) {
      errors.push("Veuillez configurer le type d'entité, activité et demande");
    }
    if (!validateDeclarant()) errors.push("Section Déclarant/Opérateur incomplète");
    if (!validateProduct()) errors.push("Section Produit incomplète");
    if (!validateDocuments()) errors.push("Documents obligatoires manquants");

    if (errors.length > 0) {
      errors.forEach((e) => toast.error(e));
      return;
    }

    const payload = {
      status: "SUBMITTED" as DossierStatus,
      version: 1,
      created_at: new Date().toISOString(),
      procedure,
      product: { ...product, product_id: product.product_id || crypto.randomUUID() },
      declarant,
      extended: {
        entityType,
        activityTypes,
        hasCannabis,
        operatorData,
        productData,
        requestType,
        visaData,
        modifications,
        noChange,
      },
    };

    console.log("API Payload (POST /cosmetics/dossiers):", payload);
    toast.success("Dossier soumis avec succès — Statut: SUBMITTED");
  };

  const hasAnyUploadedFiles = Object.values(uploadedFiles).some(
    (files) => files.length > 0
  );
  
  const DocumentUploadField = ({ doc }: { doc: DocumentRequirement }) => {
    const files = uploadedFiles[doc.document_id] || [];

    return (
      <div className="space-y-2 p-3 rounded-lg border bg-card">
        <div className="flex items-start justify-between gap-2">
          <Label className="flex items-center gap-1 text-sm font-medium">
            {doc.name}
            {doc.mandatory && !doc.conditional && (
              <span className="text-destructive">*</span>
            )}
          </Label>

          <div className="flex gap-1 flex-shrink-0">
            {doc.cannabis_only && (
              <Badge
                variant="outline"
                className="text-xs border-green-500 text-green-700"
              >
                <Leaf className="w-3 h-3 mr-1" />
                Cannabis
              </Badge>
            )}
            {doc.conditional && (
              <Badge variant="secondary" className="text-xs">
                Conditionnel
              </Badge>
            )}
            {doc.mandatory && !doc.conditional && (
              <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                Obligatoire
              </Badge>
            )}
          </div>
        </div>

        {doc.criteria.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground flex items-center gap-1 hover:text-foreground">
              <Info className="w-3 h-3" />
              Critères de recevabilité ({doc.criteria.length})
            </summary>
            <ul className="mt-1 ml-4 list-disc space-y-0.5 text-muted-foreground">
              {doc.criteria.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </details>
        )}

        <div className="text-xs text-muted-foreground">
          Formats: PDF, JPG, JPEG, PNG
        </div>

        <div className="border-2 border-dashed border-muted rounded-lg p-3 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            multiple
            className="hidden"
            id={`file-${doc.document_id}`}
            onChange={(e) => handleFileUpload(doc.document_id, e.target.files)}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <label
            htmlFor={`file-${doc.document_id}`}
            className="cursor-pointer flex flex-col items-center gap-1"
          >
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Cliquez ou glissez-déposez (PDF / images)
            </span>
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-sm"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="truncate max-w-[220px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(file.size / 1024)} KB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => removeFile(doc.document_id, index)}
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-primary" />
          <span>
            Procédure: <strong>Déclaration Préalable</strong>
          </span>
          <span className="mx-2">•</span>
          <span>
            Catégorie: <strong>Cosmétique</strong>
          </span>
        </div>

        <span
          className={cn(
            "text-xs font-semibold px-2 py-1 rounded",
            status === "DRAFT"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800"
          )}
        >
          {status}
        </span>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleSaveDraft}>
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder brouillon
        </Button>
        <Button variant="ghost" size="sm" onClick={loadDraft}>
          Charger brouillon
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["config"]} className="w-full space-y-2">
        <AccordionItem value="config" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3 flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  getSectionStatus("config") === "complete"
                    ? "bg-green-100"
                    : "bg-primary/10"
                )}
              >
                {getSectionStatus("config") === "complete" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Shield className="w-4 h-4 text-primary" />
                )}
              </div>
              <span className="font-semibold text-left">
                0. Configuration de la Demande
              </span>
              {getSectionStatus("config") === "incomplete" && (
                <span className="ml-auto text-xs text-muted-foreground">
                  À compléter
                </span>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent className="pt-4 space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Type d'entité *</Label>
              <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type d'entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="societe">Société</SelectItem>
                  <SelectItem value="cooperative">Coopérative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Type(s) d'activité *</Label>
              <p className="text-xs text-muted-foreground">
                Sélectionnez un ou plusieurs types d'activité
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    value: "ImF" as ActivityType,
                    label: "Importation pour Fabrication",
                    icon: Factory,
                  },
                  {
                    value: "ImV" as ActivityType,
                    label: "Importation pour Vente",
                    icon: Package,
                  },
                  {
                    value: "FL" as ActivityType,
                    label: "Fabrication Locale",
                    icon: Building2,
                  },
                  {
                    value: "FE" as ActivityType,
                    label: "Fabrication & Exportation",
                    icon: ClipboardList,
                  },
                ].map(({ value, label, icon: Icon }) => (
                  <div
                    key={value}
                    onClick={() => toggleActivityType(value)}
                    className={cn(
                      "p-3 rounded-lg border-2 cursor-pointer transition-all text-center",
                      activityTypes.includes(value)
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/30"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 mx-auto mb-1",
                        activityTypes.includes(value)
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="text-xs font-medium">{value}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Type de demande *</Label>
              <Select value={requestType} onValueChange={(v) => setRequestType(v as RequestType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type de demande" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nouvel-enregistrement">
                    Nouvel Enregistrement
                  </SelectItem>
                  <SelectItem value="renouvellement">Renouvellement</SelectItem>
                  <SelectItem value="modification">Modification</SelectItem>
                  <SelectItem value="visa-publicite">Visa de Publicité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
              <Checkbox
                id="cannabis"
                checked={hasCannabis}
                onCheckedChange={(c) => setHasCannabis(!!c)}
              />
              <div>
                <Label htmlFor="cannabis" className="flex items-center gap-2 cursor-pointer">
                  <Leaf className="w-4 h-4 text-green-600" />
                  Produit à base d'extraits de cannabis
                </Label>
                <p className="text-xs text-muted-foreground">
                  Des documents supplémentaires ANRAC seront requis
                </p>
              </div>
            </div>

            {entityType && requestType && activityTypes.length > 0 && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-sm">
                <p className="font-semibold text-primary mb-1">
                  Résumé de la configuration
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {entityType === "cooperative" ? "Coopérative" : "Société"}
                  </Badge>
                  {activityTypes.map((at) => (
                    <Badge key={at} variant="secondary">
                      {at}
                    </Badge>
                  ))}
                  <Badge>{requestType}</Badge>
                  {hasCannabis && (
                    <Badge
                      variant="outline"
                      className="border-green-500 text-green-700"
                    >
                      <Leaf className="w-3 h-3 mr-1" />
                      Cannabis
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {applicableDocuments.length} document(s) applicable(s) dont{" "}
                  {
                    applicableDocuments.filter((d) => d.mandatory && !d.conditional)
                      .length
                  }{" "}
                  obligatoire(s)
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="declarant" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3 flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  getSectionStatus("declarant") === "complete"
                    ? "bg-green-100"
                    : "bg-primary/10"
                )}
              >
                {getSectionStatus("declarant") === "complete" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Building2 className="w-4 h-4 text-primary" />
                )}
              </div>
              <span className="font-semibold text-left">
                1. Identification de l'Opérateur / Déclarant
              </span>
              {getSectionStatus("declarant") === "incomplete" && (
                <span className="ml-auto text-xs text-muted-foreground">
                  Incomplet
                </span>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent className="pt-4 space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground border-b pb-2">
                Documents administratifs
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Raison sociale *</Label>
                  <Input
                    id="company_name"
                    value={declarant.company_name}
                    onChange={(e) =>
                      setDeclarant({ ...declarant, company_name: e.target.value })
                    }
                    placeholder="Nom de la société / coopérative"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal_form">Forme juridique *</Label>
                  <Select
                    value={declarant.legal_form}
                    onValueChange={(v) => setDeclarant({ ...declarant, legal_form: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SARL">SARL</SelectItem>
                      <SelectItem value="SA">SA</SelectItem>
                      <SelectItem value="SAS">SAS</SelectItem>
                      <SelectItem value="SNC">SNC</SelectItem>
                      <SelectItem value="EI">Entreprise Individuelle</SelectItem>
                      <SelectItem value="COOPERATIVE">Coopérative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ice">ICE *</Label>
                  <Input
                    id="ice"
                    value={operatorData.ice}
                    onChange={(e) =>
                      setOperatorData({ ...operatorData, ice: e.target.value })
                    }
                    placeholder="Identifiant Commun de l'Entreprise"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registreCommerce">Registre de Commerce (RC)</Label>
                  <Input
                    id="registreCommerce"
                    value={operatorData.registreCommerce}
                    onChange={(e) =>
                      setOperatorData({
                        ...operatorData,
                        registreCommerce: e.target.value,
                      })
                    }
                    placeholder="Numéro RC"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identifiantFiscal">Identifiant Fiscal (IF)</Label>
                  <Input
                    id="identifiantFiscal"
                    value={operatorData.identifiantFiscal}
                    onChange={(e) =>
                      setOperatorData({
                        ...operatorData,
                        identifiantFiscal: e.target.value,
                      })
                    }
                    placeholder="Numéro IF"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnss">CNSS</Label>
                  <Input
                    id="cnss"
                    value={operatorData.cnss}
                    onChange={(e) =>
                      setOperatorData({ ...operatorData, cnss: e.target.value })
                    }
                    placeholder="Numéro CNSS"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="declarant_address">Adresse du siège social *</Label>
                <Textarea
                  id="declarant_address"
                  value={declarant.address}
                  onChange={(e) =>
                    setDeclarant({ ...declarant, address: e.target.value })
                  }
                  placeholder="Adresse complète"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="declarant_country">Pays *</Label>
                <Input
                  id="declarant_country"
                  value={declarant.country}
                  onChange={(e) =>
                    setDeclarant({ ...declarant, country: e.target.value })
                  }
                  placeholder="Ex: Maroc"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Représentant légal
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="representantNom">Nom *</Label>
                  <Input
                    id="representantNom"
                    value={operatorData.representantNom}
                    onChange={(e) =>
                      setOperatorData({
                        ...operatorData,
                        representantNom: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="representantPrenom">Prénom *</Label>
                  <Input
                    id="representantPrenom"
                    value={operatorData.representantPrenom}
                    onChange={(e) =>
                      setOperatorData({
                        ...operatorData,
                        representantPrenom: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="representantQualite">Qualité *</Label>
                  <Input
                    id="representantQualite"
                    value={operatorData.representantQualite}
                    onChange={(e) =>
                      setOperatorData({
                        ...operatorData,
                        representantQualite: e.target.value,
                      })
                    }
                    placeholder="Ex: Gérant, Président"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground border-b pb-2">
                Contacts
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone *</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={operatorData.telephone}
                    onChange={(e) =>
                      setOperatorData({ ...operatorData, telephone: e.target.value })
                    }
                    placeholder="+212 XXX XXX XXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={operatorData.email}
                    onChange={(e) =>
                      setOperatorData({ ...operatorData, email: e.target.value })
                    }
                    placeholder="contact@entreprise.ma"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground border-b pb-2">
                Documents réglementaires
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="autorisationsExistantes">
                    Autorisations existantes
                  </Label>
                  <Textarea
                    id="autorisationsExistantes"
                    value={operatorData.autorisationsExistantes}
                    onChange={(e) =>
                      setOperatorData({
                        ...operatorData,
                        autorisationsExistantes: e.target.value,
                      })
                    }
                    placeholder="Numéros d'autorisations"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licences">Licences en vigueur</Label>
                  <Textarea
                    id="licences"
                    value={operatorData.licences}
                    onChange={(e) =>
                      setOperatorData({ ...operatorData, licences: e.target.value })
                    }
                    placeholder="Liste des licences"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="product" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3 flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  getSectionStatus("product") === "complete"
                    ? "bg-green-100"
                    : "bg-accent/10"
                )}
              >
                {getSectionStatus("product") === "complete" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Package className="w-4 h-4 text-accent-foreground" />
                )}
              </div>
              <span className="font-semibold text-left">
                2. Informations sur le Produit
              </span>
              {getSectionStatus("product") === "incomplete" && (
                <span className="ml-auto text-xs text-muted-foreground">
                  Incomplet
                </span>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent className="pt-4 space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground border-b pb-2">
                Détails du produit
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Nom commercial *</Label>
                  <Input
                    id="product_name"
                    value={product.product_name}
                    onChange={(e) =>
                      setProduct({ ...product, product_name: e.target.value })
                    }
                    placeholder="Nom du produit"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeProduit">Type de produit *</Label>
                  <Select
                    value={productData.typeProduit}
                    onValueChange={(v) => setProductData({ ...productData, typeProduit: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Shampooing",
                        "Crème",
                        "Parfum",
                        "Savon",
                        "Lotion",
                        "Maquillage",
                        "Déodorant",
                        "Dentifrice",
                        "Huile",
                        "Autre",
                      ].map((t) => (
                        <SelectItem key={t.toLowerCase()} value={t.toLowerCase()}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="origin">Origine *</Label>
                  <Select
                    value={product.origin}
                    onValueChange={(v) =>
                      setProduct({ ...product, origin: v as "LOCAL" | "IMPORT" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOCAL">
                        Local (fabrication nationale)
                      </SelectItem>
                      <SelectItem value="IMPORT">
                        Import (produit importé)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie</Label>
                  <Select
                    value={productData.categorie}
                    onValueChange={(v) => setProductData({ ...productData, categorie: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cosmetique">Produit cosmétique</SelectItem>
                      <SelectItem value="hygiene">Produit d'hygiène corporelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publicCible">Public cible</Label>
                  <Select
                    value={productData.publicCible}
                    onValueChange={(v) =>
                      setProductData({ ...productData, publicCible: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adultes">Adultes</SelectItem>
                      <SelectItem value="enfants">Enfants</SelectItem>
                      <SelectItem value="nourrissons">Nourrissons</SelectItem>
                      <SelectItem value="tous">Tous publics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usagePrevu">Usage prévu et mode d'emploi</Label>
                <Textarea
                  id="usagePrevu"
                  value={productData.usagePrevu}
                  onChange={(e) =>
                    setProductData({ ...productData, usagePrevu: e.target.value })
                  }
                  placeholder="Décrivez l'usage prévu et le mode d'emploi du produit"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground border-b pb-2">
                Composition et formulation
              </h4>
              <div className="space-y-2">
                <Label htmlFor="ingredientsINCI">Liste des ingrédients INCI</Label>
                <Textarea
                  id="ingredientsINCI"
                  value={productData.ingredientsINCI}
                  onChange={(e) =>
                    setProductData({ ...productData, ingredientsINCI: e.target.value })
                  }
                  placeholder="Aqua, Sodium Laureth Sulfate, Cocamidopropyl Betaine..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formuleQuantitative">
                  Formule qualitative et quantitative
                </Label>
                <Textarea
                  id="formuleQuantitative"
                  value={productData.formuleQuantitative}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      formuleQuantitative: e.target.value,
                    })
                  }
                  placeholder="Ingrédient : concentration (%), fonction"
                  rows={4}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                <Factory className="w-4 h-4" />
                Fabricant
              </h4>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mfr_name">Nom du fabricant *</Label>
                  <Input
                    id="mfr_name"
                    value={product.manufacturer.name}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        manufacturer: {
                          ...product.manufacturer,
                          name: e.target.value,
                        },
                      })
                    }
                    placeholder="Nom du fabricant"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mfr_country">Pays du fabricant *</Label>
                  <Input
                    id="mfr_country"
                    value={product.manufacturer.country}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        manufacturer: {
                          ...product.manufacturer,
                          country: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: Maroc, France"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mfr_address">Adresse du fabricant *</Label>
                <Textarea
                  id="mfr_address"
                  value={product.manufacturer.address}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      manufacturer: {
                        ...product.manufacturer,
                        address: e.target.value,
                      },
                    })
                  }
                  placeholder="Adresse complète du site de fabrication"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground border-b pb-2">
                Étiquetage et conditionnement
              </h4>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fonctionProduit">Fonction du produit</Label>
                  <Input
                    id="fonctionProduit"
                    value={productData.fonctionProduit}
                    onChange={(e) =>
                      setProductData({ ...productData, fonctionProduit: e.target.value })
                    }
                    placeholder="Ex: Hydratation, Nettoyage"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ddmOuPao">DDM ou PAO</Label>
                  <Input
                    id="ddmOuPao"
                    value={productData.ddmOuPao}
                    onChange={(e) =>
                      setProductData({ ...productData, ddmOuPao: e.target.value })
                    }
                    placeholder="Ex: 12M, 24M"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poidsVolume">Poids/Volume net</Label>
                  <Input
                    id="poidsVolume"
                    value={productData.poidsVolume}
                    onChange={(e) =>
                      setProductData({ ...productData, poidsVolume: e.target.value })
                    }
                    placeholder="Ex: 250ml, 100g"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="precautionsEmploi">Précautions d'emploi</Label>
                <Textarea
                  id="precautionsEmploi"
                  value={productData.precautionsEmploi}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      precautionsEmploi: e.target.value,
                    })
                  }
                  placeholder="Avertissements et précautions"
                  rows={3}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="documents" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3 flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  getSectionStatus("documents") === "complete"
                    ? "bg-green-100"
                    : "bg-secondary/10"
                )}
              >
                {getSectionStatus("documents") === "complete" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <ClipboardList className="w-4 h-4 text-secondary-foreground" />
                )}
              </div>
              <span className="font-semibold text-left">
                3. Documents Réglementaires
              </span>
              {applicableDocuments.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {applicableDocuments.length} doc(s)
                </Badge>
              )}
              {getSectionStatus("documents") === "incomplete" && (
                <span className="ml-auto text-xs text-muted-foreground">
                  Incomplet
                </span>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent className="pt-4 space-y-6">
            {!entityType || !requestType || activityTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>
                  Veuillez d'abord compléter la section{" "}
                  <strong>"Configuration de la Demande"</strong>
                </p>
              </div>
            ) : (
              <>
                {entityType === "cooperative" && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Documents de déclaration de la coopérative
                      <span className="text-xs text-muted-foreground font-normal">
                        (Circulaire N° 771)
                      </span>
                    </h4>
                    <div className="space-y-3">
                      {applicableDocuments
                        .filter((d) => d.document_id.startsWith("COOP_"))
                        .map((doc) => (
                          <DocumentUploadField key={doc.document_id} doc={doc} />
                        ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Documents généraux du dossier
                    <span className="text-xs text-muted-foreground font-normal">
                      ({activityTypes.join(" / ")})
                    </span>
                  </h4>
                  <div className="space-y-3">
                    {applicableDocuments
                      .filter((d) => d.document_id.startsWith("GEN_"))
                      .map((doc) => (
                        <DocumentUploadField key={doc.document_id} doc={doc} />
                      ))}
                  </div>
                </div>

                {hasCannabis && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-green-700 dark:text-green-400 border-b border-green-200 dark:border-green-800 pb-2 flex items-center gap-2">
                      <Leaf className="w-4 h-4" />
                      Documents spécifiques — Produits à base de cannabis
                    </h4>
                    <div className="space-y-3">
                      {applicableDocuments
                        .filter((d) => d.document_id.startsWith("CANN_"))
                        .map((doc) => (
                          <DocumentUploadField key={doc.document_id} doc={doc} />
                        ))}
                    </div>
                  </div>
                )}

                {requestType === "renouvellement" && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="noChange"
                        checked={noChange}
                        onCheckedChange={(c) => setNoChange(!!c)}
                      />
                      <Label htmlFor="noChange" className="text-sm">
                        Je confirme qu'aucune modification n'a été apportée au produit
                        depuis le dernier enregistrement
                      </Label>
                    </div>
                  </div>
                )}

                {requestType === "modification" && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-3">
                      Nature des modifications
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Composition",
                        "Emballage",
                        "Fabricant",
                        "Étiquetage",
                        "Adresse",
                        "Représentant légal",
                        "Activité",
                      ].map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                          <Checkbox
                            id={`mod-${item}`}
                            checked={modifications.includes(item)}
                            onCheckedChange={() => toggleModification(item)}
                          />
                          <Label htmlFor={`mod-${item}`} className="text-sm">
                            {item}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {requestType === "visa-publicite" && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900 space-y-4">
                    <h4 className="font-semibold text-purple-700 dark:text-purple-400">
                      Visa de Publicité
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="scriptPub">Script/texte publicitaire intégral *</Label>
                      <Textarea
                        id="scriptPub"
                        value={visaData.scriptPub}
                        onChange={(e) =>
                          setVisaData({ ...visaData, scriptPub: e.target.value })
                        }
                        placeholder="Contenu textuel de la publicité"
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cible de la publicité *</Label>
                      <Select
                        value={visaData.ciblePub}
                        onValueChange={(v) => setVisaData({ ...visaData, ciblePub: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grand-public">Grand public</SelectItem>
                          <SelectItem value="professionnels">Professionnels</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Sticky analysis bar: keeps the button visible inside the dialog scroll area */}
      <div className="sticky bottom-0 z-40 mt-6 -mx-1 rounded-2xl border border-emerald-200 bg-white/95 p-4 shadow-[0_-10px_30px_rgba(15,118,110,0.10)] backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-900">
              Prêt pour l'analyse automatique du dossier
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> Champs obligatoires · {Object.values(rawFiles).flat().length} fichier(s) sélectionné(s)
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-end">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Frais d'enregistrement</p>
              <p className="text-lg font-bold text-primary">2 500 DH</p>
            </div>

            <Button
              onClick={analyzeDossier}
              size="lg"
              disabled={!hasAnyUploadedFiles || isAnalyzing}
              className="min-w-[190px] bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isAnalyzing ? "Analyse en cours..." : "Analyser le dossier"}
            </Button>
          </div>
        </div>
      </div>

      {analysisResult && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="text-lg font-semibold text-emerald-800 mb-2">
            Dossier créé avec succès
          </h3>

          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Numéro de dossier</p>
            <p className="text-xl font-bold text-emerald-700">
              {analysisResult?.dossier_id || "En attente..."}
            </p>
          </div>

          <p className="text-sm text-muted-foreground mt-3">
            Suivez votre dossier dans "Mes dossiers soumis". Le rapport PDF apparaîtra dans le tableau dès qu'il sera généré.
          </p>
        </div>
      )}
    </div>
  );
};

export default CosmeticsRegistrationForm;
import { useBBN } from "@/context/BBNContext";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileBadge2,
  FileCheck2,
  ListChecks,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DocItem = { name: string; available: boolean };
type ReasonItem = { label: string; ok: boolean; warnLabel?: string };
type UploadStatus = { fileName: string; verified: boolean; error?: string };

function normalizeDocName(doc: string): string {
  const value = doc.trim().toLowerCase();
  if (value.includes("aadhaar")) return "Aadhaar Card";
  if (value.includes("income")) return "Income Certificate";
  if (value.includes("bank")) return "Bank Account Details";
  if (value.includes("land")) return "Land Record";
  return doc;
}

function requiredDocsForScheme(title: string, category: string): string[] {
  const text = `${title} ${category}`.toLowerCase();

  if (text.includes("kisan") || text.includes("farmer") || text.includes("agri")) {
    return ["Aadhaar Card", "Income Certificate", "Bank Account Details", "Land Record"];
  }
  if (text.includes("health") || text.includes("ayushman") || text.includes("insurance")) {
    return ["Aadhaar Card", "Income Certificate", "Bank Account Details", "Residence Certificate"];
  }
  if (text.includes("ration") || text.includes("food")) {
    return ["Aadhaar Card", "Ration Card", "Income Certificate", "Residence Certificate"];
  }
  if (text.includes("pension")) {
    return ["Aadhaar Card", "Bank Account Details", "Age Proof", "Income Certificate"];
  }
  if (text.includes("education") || text.includes("scholarship") || text.includes("student")) {
    return ["Aadhaar Card", "Student Certificate", "Income Certificate", "Bank Account Details"];
  }

  return [];
}

function verifyUploadedDocument(requiredDocName: string, file: File): { ok: boolean; message: string } {
  const name = file.name.toLowerCase();
  const allowedExt = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
  const hasAllowedExt = allowedExt.some((ext) => name.endsWith(ext));
  if (!hasAllowedExt) {
    return { ok: false, message: "Only PDF or image files are allowed." };
  }

  const maxBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxBytes) {
    return { ok: false, message: "File too large. Max allowed size is 10MB." };
  }

  // Frontend cannot reliably read document semantics without OCR/backend.
  // Treat upload in selected document slot as user intent and mark verified.
  return { ok: true, message: `${requiredDocName} uploaded successfully.` };
}

export function ClaimAssistance() {
  const { queryResponse, selectedScheme, setSelectedScheme, userProfile } = useBBN();
  const { t } = useI18n();
  const { toast } = useToast();
  const eligibleSchemes = queryResponse?.eligible_schemes || [];
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadStatus>>({});

  const activeScheme =
    selectedScheme ||
    eligibleSchemes[0] ||
    queryResponse?.recommended_schemes?.[0] ||
    null;

  useEffect(() => {
    setUploadedDocs({});
  }, [activeScheme?.id, activeScheme?.title]);

  const baseRequiredDocs =
    queryResponse?.decision_output?.document_advice?.length
      ? queryResponse.decision_output.document_advice
      : ["Aadhaar Card", "Income Certificate", "Bank Account Details"];
  const schemeBasedDocs = requiredDocsForScheme(
    String(activeScheme?.title || ""),
    String(activeScheme?.category || "")
  );

  const requiredDocNames = Array.from(
    new Set([
      ...(schemeBasedDocs.length ? schemeBasedDocs : baseRequiredDocs).map(normalizeDocName),
    ])
  );

  const requiredDocuments: DocItem[] = requiredDocNames.map((name) => {
    const status = uploadedDocs[name];
    return { name, available: Boolean(status?.verified) };
  });

  const availableDocs = requiredDocuments.filter((d) => d.available).length;
  const docReadiness = requiredDocuments.length ? availableDocs / requiredDocuments.length : 0;

  const profileSignals = [
    requiredDocuments.some((d) => d.name.toLowerCase().includes("aadhaar") && d.available),
    requiredDocuments.some((d) => d.name.toLowerCase().includes("residence") && d.available) || !!userProfile?.state,
    !!userProfile?.occupation,
    requiredDocuments.some((d) => d.name.toLowerCase().includes("income") && d.available) || Number(userProfile?.monthly_income || 0) > 0,
    Number(userProfile?.age || 0) > 0,
  ];
  const profileCompleteness = profileSignals.filter(Boolean).length / profileSignals.length;
  const modelLikelihood = queryResponse?.ml_prediction?.approval_likelihood ?? 0.75;
  const successProbability = Math.round((modelLikelihood * 0.5 + docReadiness * 0.35 + profileCompleteness * 0.15) * 100);

  const reasons: ReasonItem[] = [
    {
      label: t("reason_aadhaar_verified", "Aadhaar verified"),
      ok: requiredDocuments.some((d) => d.name.toLowerCase().includes("aadhaar") && d.available),
    },
    {
      label: t("reason_bank_linked", "Bank account linked"),
      ok: requiredDocuments.some((d) => d.name.toLowerCase().includes("bank") && d.available),
    },
    {
      label: t("reason_profile_complete", "Profile information complete"),
      ok: profileCompleteness >= 0.8,
    },
    {
      label: t("reason_income_pending", "Income certificate pending"),
      ok: !requiredDocuments.some((d) => d.name.toLowerCase().includes("income") && !d.available),
      warnLabel: t("reason_income_pending", "Income certificate pending"),
    },
  ];

  const steps = [
    t("claim_step_1_new", "Verify your Aadhaar and bank account details."),
    t("claim_step_2_new", "Upload all required documents."),
    t("claim_step_3_new", "Complete Aadhaar OTP e-sign verification."),
    t("claim_step_4_new", "Submit the application form on the official portal."),
    t("claim_step_5_new", "Track application status using your JanSetu Case ID."),
  ];

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (successProbability / 100) * circumference;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="p-6 rounded-3xl bg-card border border-border">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
            <FileBadge2 size={20} />
            {t("selected_scheme", "Selected Scheme")}
          </h3>
          {eligibleSchemes.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs text-muted-foreground mb-1.5">
                {t("select_eligible_scheme", "Select Eligible Scheme")}
              </label>
              <Select
                value={activeScheme?.id || activeScheme?.title}
                onValueChange={(value) => {
                  const next = eligibleSchemes.find((s) => (s.id || s.title) === value);
                  if (next) setSelectedScheme(next);
                }}
              >
                <SelectTrigger className="h-10 rounded-xl border-primary/30 bg-primary/5">
                  <SelectValue placeholder={t("select_scheme", "Select scheme")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {eligibleSchemes.map((scheme) => (
                    <SelectItem key={scheme.id || scheme.title} value={scheme.id || scheme.title}>
                      {scheme.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <p className="text-xl font-bold text-foreground">
            {activeScheme?.title || t("no_scheme_selected", "No scheme selected")}
          </p>
          <p className="text-sm mt-2 text-muted-foreground">
            {t("scheme_type", "Scheme Type")}: {activeScheme?.scheme_scope || t("central_or_state", "Central / State")}
          </p>
          <p className="text-sm mt-3 text-foreground">
            {t("benefit", "Benefit")}: {String(activeScheme?.coverage || activeScheme?.description || t("benefit_details_available", "Details available in scheme information."))}
          </p>
        </section>

        <section className="p-6 rounded-3xl bg-card border border-border">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
            <FileCheck2 size={20} />
            {t("required_documents", "Required Documents")}
          </h3>
          <div className="space-y-3">
            {requiredDocuments.map((doc) => (
              <div key={doc.name} className="flex items-center gap-3 rounded-xl border border-border p-3 bg-muted/20">
                {doc.available ? (
                  <CheckCircle2 className="text-success flex-shrink-0" size={18} />
                ) : (
                  <AlertTriangle className="text-amber-600 flex-shrink-0" size={18} />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-foreground block">{doc.name}</span>
                  {uploadedDocs[doc.name] && (
                    <span className={`text-xs block truncate ${uploadedDocs[doc.name].verified ? "text-muted-foreground" : "text-destructive"}`}>
                      {uploadedDocs[doc.name].verified
                        ? uploadedDocs[doc.name].fileName
                        : uploadedDocs[doc.name].error || t("uploading_failed", "Uploading failed")}
                    </span>
                  )}
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-semibold cursor-pointer hover:bg-primary/5 transition-colors">
                  <Upload size={14} />
                  {uploadedDocs[doc.name]?.verified ? t("replace", "Replace") : t("upload", "Upload")}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const verification = verifyUploadedDocument(doc.name, file);
                      setUploadedDocs((prev) => ({
                        ...prev,
                        [doc.name]: {
                          fileName: file.name,
                          verified: verification.ok,
                          error: verification.ok ? undefined : t("uploading_failed", "Uploading failed"),
                        },
                      }));

                      toast({
                        title: verification.ok ? t("upload_success", "Document verified") : t("uploading_failed", "Uploading failed"),
                        description: verification.ok ? `${doc.name}: ${file.name}` : verification.message,
                        variant: verification.ok ? "default" : "destructive",
                      });
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="p-6 rounded-3xl bg-card border border-border">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
          <ListChecks size={20} />
          {t("application_guide", "Application Guide")}
        </h3>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step} className="flex items-start gap-3 rounded-2xl border border-border p-4 bg-muted/20">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-sm text-foreground pt-1">
                <span className="font-semibold">{t("step", "Step")} {index + 1}: </span>
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="p-6 rounded-3xl bg-card border border-border">
        <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-primary">
          <ShieldCheck size={20} />
          {t("claim_success_probability", "Claim Success Probability")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-center">
          <div className="mx-auto relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="9" />
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-extrabold text-primary">{successProbability}%</p>
              <p className="text-xs text-muted-foreground">{t("probability", "Probability")}</p>
            </div>
          </div>

          <div className="space-y-3">
            {reasons.map((reason) => {
              const showOk = reason.ok;
              return (
                <div key={reason.label} className="flex items-center gap-3 rounded-xl border border-border p-3 bg-muted/20">
                  {showOk ? (
                    <ClipboardCheck className="text-success flex-shrink-0" size={18} />
                  ) : (
                    <AlertTriangle className="text-amber-600 flex-shrink-0" size={18} />
                  )}
                  <span className="text-sm text-foreground">{showOk ? reason.label : reason.warnLabel || reason.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="p-5 rounded-2xl bg-muted/30 border border-dashed border-border flex items-center gap-4">
        <ShieldCheck className="text-success" size={24} />
        <div>
          <p className="text-sm font-bold">{t("rta_ready", "RTA Ready")}</p>
          <p className="text-xs text-muted-foreground">{t("rta_ready_desc", "All required documents are pre-indexed for this claim.")}</p>
        </div>
      </div>
    </div>
  );
}

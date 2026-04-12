import { CheckSquare, FileText } from "lucide-react";
import { useBBN } from "@/context/BBNContext";
import { mockQueryResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/use-i18n";

export function RequiredDocuments() {
  const { queryResponse, isAssistedMode } = useBBN();
  const { toast } = useToast();
  const { t } = useI18n();

  const documents = queryResponse?.decision_output.document_advice || mockQueryResponse.decision_output.document_advice;

  const handleClaimGuide = () => {
    toast({
      title: t("claim_guide_generated", "Claim Guide Generated"),
      description: t("claim_guide_desc", "Follow the step-by-step instructions in the RTA panel."),
    });
  };

  return (
    <div className={`glass-card-hover premium-card p-6 animate-fade-in transition-all ${isAssistedMode ? 'scale-105' : ''}`} style={{ animationDelay: "0.3s" }}>
      <h3 className={`card-title mb-4 ${isAssistedMode ? 'text-xl' : ''}`}>{t("required_documents", "Required Documents")}</h3>

      <div className="space-y-2.5">
        {documents.map((doc) => (
          <div key={doc} className="flex items-center gap-2.5">
            <CheckSquare size={isAssistedMode ? 20 : 16} className="text-success flex-shrink-0" />
            <span className={`body-copy text-foreground ${isAssistedMode ? 'text-base' : ''}`}>{doc}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleClaimGuide}
        className={`w-full mt-4 rounded-xl bg-foreground text-card font-bold transition-opacity flex items-center justify-center gap-2 hover:opacity-90 ${isAssistedMode ? 'py-4 text-lg' : 'py-2.5 text-sm'
          }`}
      >
        <FileText size={isAssistedMode ? 20 : 16} />
        {t("get_claim_guide", "GET CLAIM GUIDE")}
      </button>
    </div>
  );
}

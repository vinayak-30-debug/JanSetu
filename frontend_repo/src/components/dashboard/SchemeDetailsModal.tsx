import React from "react";
import { useBBN } from "@/context/BBNContext";
import { X } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

function parseCriteria(text?: string): string[] {
    if (!text) return [];
    return text
        .split(";")
        .map((x: string) => x.trim())
        .filter(Boolean);
}

export function SchemeDetailsModal() {
    const { selectedScheme, showSchemeDetails, closeSchemeDetails } = useBBN();
    const { t } = useI18n();

    if (!selectedScheme || !showSchemeDetails) return null;

    const statusText = selectedScheme.eligible ? t("eligible", "Eligible") : t("not_eligible", "Not Eligible");
    const matched = parseCriteria(selectedScheme.reason_eligible);
    const failed = parseCriteria(selectedScheme.reason_not_eligible);

    const aboutBullets = [
        `${t("purpose", "Purpose")}: ${selectedScheme.category || t("welfare", "Welfare")} ${t("support_scheme_for_citizens", "support scheme for eligible citizens.")}`,
        `${t("target_group", "Target Group")}: ${t("applicants_matching_criteria_in", "Applicants matching scheme criteria in")} ${selectedScheme.scheme_scope === "State" ? t("selected_state", "the selected state") : t("india", "India")}.`,
        `${t("support", "Support")}: ${selectedScheme.description || t("financial_assistance_guidelines", "Financial/service assistance as per guidelines.")}`,
        `${t("key_benefit", "Key Benefit")}: ${String(selectedScheme.estimated_benefit ?? selectedScheme.coverage ?? t("as_per_official_notification", "As per official notification"))}`,
        selectedScheme.ministry ? `${t("implementing_authority", "Implementing Authority")}: ${selectedScheme.ministry}` : "",
    ].filter(Boolean);
    const importanceBullets = [
        `${t("key_benefit", "Key Benefit")}: ${String(selectedScheme.estimated_benefit ?? selectedScheme.coverage ?? t("as_per_official_notification", "As per official notification"))}`,
        `${t("scheme_type", "Scheme Type")}: ${selectedScheme.scheme_scope || `${t("state", "State")}/${t("central", "Central")}`}`,
        selectedScheme.official_url ? `${t("official_portal", "Official Portal")}: ${selectedScheme.official_url}` : "",
    ].filter(Boolean);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-border flex items-start justify-between gradient-primary text-primary-foreground">
                    <div className="space-y-1">
                        <h2 className="font-bold text-2xl">{selectedScheme.title}</h2>
                        <p className="text-sm opacity-95">{t("type", "Type")}: {selectedScheme.scheme_scope || `${t("state", "State")}/${t("central", "Central")}`}</p>
                        <p className="text-sm font-semibold">{t("eligibility_status", "Eligibility Status")}: {statusText}</p>
                    </div>
                    <button
                        onClick={closeSchemeDetails}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <section>
                        <h3 className="font-bold text-foreground mb-2 text-base">{t("about_scheme", "About the Scheme")}</h3>
                        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                            {aboutBullets.map((b) => (
                                <li key={b}>{b}</li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-foreground mb-2 text-base">{t("importance", "Importance")}</h3>
                        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                            {importanceBullets.map((b) => (
                                <li key={b}>{b}</li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-foreground mb-2 text-base">{t("eligibility_analysis", "Eligibility Analysis")}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                                <p className="font-semibold text-success mb-2">{t("matched_criteria", "Matched Criteria")}</p>
                                {matched.length > 0 ? (
                                    <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
                                        {matched.map((m) => <li key={m}>{m}</li>)}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{t("no_matched_criteria", "No explicit matched criteria provided.")}</p>
                                )}
                            </div>
                            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                                <p className="font-semibold text-destructive mb-2">{t("failed_criteria", "Failed Criteria")}</p>
                                {failed.length > 0 ? (
                                    <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
                                        {failed.map((f) => <li key={f}>{f}</li>)}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{t("no_failed_criteria", "No failed criteria.")}</p>
                                )}
                            </div>
                        </div>
                    </section>

                </div>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={closeSchemeDetails}
                        className="w-full py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors"
                    >
                        {t("close", "CLOSE")}
                    </button>
                </div>
            </div>
        </div>
    );
}

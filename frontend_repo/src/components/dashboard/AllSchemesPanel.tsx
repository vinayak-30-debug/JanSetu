import { useEffect, useMemo, useState } from "react";
import { Building2, ExternalLink, Landmark, ListChecks } from "lucide-react";
import { fetchSchemeCatalog, SchemeCatalogItem, SchemeCatalogResponse } from "@/lib/api";

function toText(value: unknown): string {
  if (value == null) return "N/A";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map((x) => toText(x)).join(", ");
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const amount = record.amount;
    const coverage = record.coverage;
    const details = record.details;

    if (typeof amount === "number" && amount > 0) return String(amount);
    if (typeof amount === "string" && amount.trim() && amount.trim() !== "0") return amount;
    if (coverage != null && String(coverage).trim()) return toText(coverage);
    if (details != null && String(details).trim()) return toText(details);
    if (amount != null) return toText(amount);

    return JSON.stringify(value);
  }
  return String(value);
}

function formatCurrencyAmount(value: number): string {
  return `Rs ${value.toLocaleString("en-IN")}`;
}

function parseNumericCandidates(text: string): number[] {
  if (!text) return [];
  const out: number[] = [];
  const normalized = text.replace(/[₹,]/g, " ").replace(/[–—-]/g, " ");
  const regex = /(\d+(?:\.\d+)?)\s*(lakh|crore|thousand|k)?/gi;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(normalized)) !== null) {
    let value = Number(match[1]);
    const unit = (match[2] || "").toLowerCase();
    if (unit === "lakh") value *= 100000;
    else if (unit === "crore") value *= 10000000;
    else if (unit === "thousand" || unit === "k") value *= 1000;
    if (Number.isFinite(value) && value > 0) out.push(value);
  }
  return out;
}

function estimateSubsidyFromCategory(item: SchemeCatalogItem): number {
  const blob = `${item.category || ""} ${item.name || ""} ${item.description || ""}`.toLowerCase();
  if (blob.includes("health")) return 500000;
  if (blob.includes("pension")) return 3000;
  if (blob.includes("education") || blob.includes("scholar")) return 50000;
  if (blob.includes("farmer") || blob.includes("kisan") || blob.includes("agri")) return 6000;
  if (blob.includes("housing") || blob.includes("home")) return 120000;
  if (blob.includes("women") || blob.includes("girl")) return 100000;
  return 10000;
}

function governmentSubsidySummary(item: SchemeCatalogItem): { valueText: string; detailText: string } {
  const raw = (item.subsidy_details ?? item.benefits) as unknown;
  const detailText = toText(raw || "As per government notification.");
  const nums: number[] = [];

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    const amount = record.amount;
    const coverage = record.coverage;
    const details = record.details;

    if (typeof amount === "number" && amount > 0) nums.push(amount);
    if (typeof amount === "string") nums.push(...parseNumericCandidates(amount));
    if (coverage != null) nums.push(...parseNumericCandidates(String(coverage)));
    if (details != null) nums.push(...parseNumericCandidates(String(details)));

    // Also parse all values from richer benefit dictionaries.
    for (const value of Object.values(record)) {
      nums.push(...parseNumericCandidates(toText(value)));
    }
  } else {
    nums.push(...parseNumericCandidates(toText(raw)));
  }

  const unique = Array.from(new Set(nums.filter((x) => Number.isFinite(x) && x > 0))).sort((a, b) => a - b);
  if (unique.length >= 2) {
    return {
      valueText: `${formatCurrencyAmount(unique[0])} - ${formatCurrencyAmount(unique[unique.length - 1])}`,
      detailText,
    };
  }
  if (unique.length === 1) {
    return {
      valueText: formatCurrencyAmount(unique[0]),
      detailText,
    };
  }

  const estimated = estimateSubsidyFromCategory(item);
  return {
    valueText: `${formatCurrencyAmount(estimated)} (estimated)`,
    detailText,
  };
}

export function AllSchemesPanel() {
  const [catalog, setCatalog] = useState<SchemeCatalogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchSchemeCatalog();
        setCatalog(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load scheme catalog.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const centralSchemes = catalog?.central_schemes || [];
  const stateSchemes = catalog?.state_schemes || [];
  const allSchemes = useMemo(() => [...centralSchemes, ...stateSchemes], [centralSchemes, stateSchemes]);
  const schemeById = useMemo(
    () => Object.fromEntries(allSchemes.map((s) => [s.policy_id, s])),
    [allSchemes]
  );

  useEffect(() => {
    if (!allSchemes.length) return;
    if (selectedSchemeId && schemeById[selectedSchemeId]) return;
    setSelectedSchemeId(centralSchemes[0]?.policy_id || stateSchemes[0]?.policy_id || "");
  }, [allSchemes, schemeById, selectedSchemeId, centralSchemes, stateSchemes]);

  const selectedScheme = selectedSchemeId ? schemeById[selectedSchemeId] : null;
  const selectedScope = selectedScheme?.scheme_scope === "Central" ? "Central" : "State";
  const selectedScopeIcon = selectedScope === "Central" ? <Landmark size={14} /> : <Building2 size={14} />;
  const subsidyInfo = selectedScheme ? governmentSubsidySummary(selectedScheme) : null;

  const criteria = (selectedScheme?.eligibility_criteria || {}) as Record<string, unknown>;
  const criteriaRows: string[] = [];
  if (criteria.min_age != null || criteria.max_age != null) {
    criteriaRows.push(`Age: ${criteria.min_age ?? 0} - ${criteria.max_age ?? "No limit"}`);
  }
  if (criteria.income_limit != null) {
    criteriaRows.push(`Income Limit: ${toText(criteria.income_limit)}`);
  }
  if (criteria.monthly_income_max != null) {
    criteriaRows.push(`Monthly Income Max: ${toText(criteria.monthly_income_max)}`);
  }
  if (Array.isArray(criteria.required_occupations) && criteria.required_occupations.length > 0) {
    criteriaRows.push(`Occupations: ${criteria.required_occupations.join(", ")}`);
  }
  if (Array.isArray(criteria.required_documents) && criteria.required_documents.length > 0) {
    criteriaRows.push(`Required Documents: ${criteria.required_documents.join(", ")}`);
  }
  if (!criteriaRows.length) {
    criteriaRows.push("As per official scheme guidelines.");
  }

  return (
    <section className="glass-card-hover premium-card p-5 h-full">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="section-title">All Schemes</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Total: {catalog?.total_schemes ?? 0} | Central: {centralSchemes.length} | State: {stateSchemes.length}
          </p>
        </div>
        <ListChecks size={18} className="text-primary" />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading all schemes...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!isLoading && !error && (
        <div className="space-y-3 max-h-[72vh] overflow-y-auto hide-scrollbar pr-1">
          <div className="rounded-xl border border-border bg-card p-3">
            <h4 className="text-sm font-bold text-foreground mb-2">Central Schemes ({centralSchemes.length})</h4>
            <div className="max-h-36 overflow-y-auto hide-scrollbar space-y-1 pr-1">
              {centralSchemes.map((scheme) => (
                <button
                  key={scheme.policy_id}
                  type="button"
                  onClick={() => setSelectedSchemeId(scheme.policy_id)}
                  className={`w-full text-left rounded-lg px-2.5 py-2 text-xs transition-colors ${
                    selectedSchemeId === scheme.policy_id
                      ? "bg-primary/15 text-primary font-semibold"
                      : "bg-muted/60 text-foreground hover:bg-muted"
                  }`}
                >
                  {scheme.name}
                </button>
              ))}
              {centralSchemes.length === 0 && (
                <p className="text-xs text-muted-foreground">No central schemes found.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-3">
            <h4 className="text-sm font-bold text-foreground mb-2">State Schemes ({stateSchemes.length})</h4>
            <div className="max-h-36 overflow-y-auto hide-scrollbar space-y-1 pr-1">
              {stateSchemes.map((scheme) => (
                <button
                  key={scheme.policy_id}
                  type="button"
                  onClick={() => setSelectedSchemeId(scheme.policy_id)}
                  className={`w-full text-left rounded-lg px-2.5 py-2 text-xs transition-colors ${
                    selectedSchemeId === scheme.policy_id
                      ? "bg-primary/15 text-primary font-semibold"
                      : "bg-muted/60 text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="block">{scheme.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    State: {scheme.required_states?.length ? scheme.required_states.join(", ") : "N/A"}
                  </span>
                </button>
              ))}
              {stateSchemes.length === 0 && (
                <p className="text-xs text-muted-foreground">No state schemes found.</p>
              )}
            </div>
          </div>

          {selectedScheme && (
            <article className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-bold text-foreground leading-tight">{selectedScheme.name}</h4>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {selectedScopeIcon}
                  {selectedScope}
                </span>
              </div>

              <p className="text-[12px] text-muted-foreground mt-1">
                Ministry: {selectedScheme.ministry || "N/A"} | Category: {selectedScheme.category || "General"}
              </p>
              <p className="text-[12px] text-foreground mt-2 leading-relaxed">{selectedScheme.description || "N/A"}</p>

              <p className="text-[12px] mt-2">
                <span className="font-semibold text-foreground">
                  {selectedScope === "Central" ? "Central Govt Subsidy" : "State Govt Subsidy"}:
                </span>{" "}
                <span className="text-muted-foreground">{subsidyInfo?.valueText || "N/A"}</span>
              </p>

              <p className="text-[12px] mt-1">
                <span className="font-semibold text-foreground">Subsidy Details:</span>{" "}
                <span className="text-muted-foreground">{subsidyInfo?.detailText || "As per government notification."}</span>
              </p>

              <div className="text-[12px] mt-1">
                <span className="font-semibold text-foreground">Eligibility Criteria:</span>
                <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                  {criteriaRows.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              {selectedScope === "State" && (
                <p className="text-[12px] mt-1">
                  <span className="font-semibold text-foreground">Belongs To State:</span>{" "}
                  <span className="text-muted-foreground">
                    {selectedScheme.required_states?.length ? selectedScheme.required_states.join(", ") : "N/A"}
                  </span>
                </p>
              )}

              {selectedScheme.application_process?.length > 0 && (
                <p className="text-[12px] mt-1">
                  <span className="font-semibold text-foreground">Application Process:</span>{" "}
                  <span className="text-muted-foreground">{selectedScheme.application_process.slice(0, 3).join(" -> ")}</span>
                </p>
              )}

              {selectedScheme.official_url && (
                <a
                  href={selectedScheme.official_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] mt-2 text-primary hover:underline"
                >
                  Official Link
                  <ExternalLink size={12} />
                </a>
              )}
            </article>
          )}
        </div>
      )}
    </section>
  );
}

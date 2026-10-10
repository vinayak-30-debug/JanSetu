import { useBBN } from "@/context/BBNContext";
import { JanSetuLogo } from "@/components/dashboard/JanSetuLogo";
import { Globe, Shield, Lock } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const navItems = [
  { key: "Dashboard", labelKey: "dashboard", fallback: "Dashboard" },
  { key: "All Schemes", labelKey: "all_schemes", fallback: "All Schemes" },
  { key: "Eligibility", labelKey: "eligibility", fallback: "Eligibility" },
  { key: "Claim Assistance", labelKey: "claim_assistance", fallback: "Claim Assistance" },
  { key: "Optimization", labelKey: "optimization", fallback: "Optimization" },
  { key: "Insights", labelKey: "insights", fallback: "Insights" },
];

const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Assamese",
  "Bengali",
  "Bodo",
  "Dogri",
  "Gujarati",
  "Kannada",
  "Kashmiri",
  "Konkani",
  "Maithili",
  "Malayalam",
  "Manipuri",
  "Marathi",
  "Nepali",
  "Odia",
  "Punjabi",
  "Sanskrit",
  "Santali",
  "Sindhi",
  "Tamil",
  "Telugu",
  "Urdu",
];

export function GlobalHeader() {
  const { activeTab, setActiveTab, selectedLanguage, setSelectedLanguage, isAssistedMode, openVaultModal } = useBBN();
  const { t } = useI18n();

  return (
    <header className={`relative overflow-hidden px-6 flex items-center justify-between transition-all ${isAssistedMode ? 'py-5 gradient-primary shadow-lg' : 'py-3 gradient-hero'}`}>
      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-10 -top-20 w-64 h-64 opacity-[0.08]"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="72" fill="none" stroke="currentColor" strokeWidth="5" className="text-orange-300" />
        <circle cx="100" cy="100" r="8" fill="currentColor" className="text-orange-300" />
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1="100"
            y1="100"
            x2="100"
            y2="28"
            stroke="currentColor"
            strokeWidth="2"
            className="text-orange-300"
            transform={`rotate(${i * 15} 100 100)`}
          />
        ))}
      </svg>

      <JanSetuLogo onDark className="shrink-0" />

      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === item.key
              ? (isAssistedMode ? "bg-white text-primary shadow-md" : "bg-sidebar-accent text-primary-foreground")
              : (isAssistedMode ? "text-white/80 hover:text-white hover:bg-white/10" : "text-primary-light hover:text-primary-foreground hover:bg-sidebar-accent/50")
              } ${isAssistedMode ? 'text-xl px-6 py-3' : 'text-sm'}`}
          >
            {t(item.labelKey, item.fallback)}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <button
          id="open-aadhaar-vault-btn"
          onClick={openVaultModal}
          className="flex items-center gap-2 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 px-3 py-1.5 shadow-[0_4px_16px_rgba(16,185,129,0.2)] transition-all group cursor-pointer"
          title="Aadhaar Data Vault (UIDAI Compliant AES-256 + HSM)"
        >
          <div className="relative">
            <Shield size={16} className="text-emerald-300 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="hidden lg:flex flex-col text-left leading-tight">
            <span className="text-[11px] font-bold text-white tracking-wide flex items-center gap-1">
              Aadhaar Data Vault
              <Lock size={10} className="text-emerald-300" />
            </span>
            <span className="text-[9px] text-emerald-300 font-mono">AES-256 • HSM Enclave</span>
          </div>
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-white/12 border border-white/25 backdrop-blur-md px-2.5 py-1.5 min-w-[235px] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
            <Globe size={14} className="text-white" />
          </div>
          <Select value={selectedLanguage || "English"} onValueChange={setSelectedLanguage}>
            <SelectTrigger
              aria-label={t("language", "Language")}
              className="h-8 border-0 bg-transparent px-2 text-white text-xs font-semibold ring-0 ring-offset-0 focus:ring-0 focus:ring-offset-0 rounded-xl hover:bg-white/10 transition-colors"
            >
              <SelectValue placeholder="English" />
            </SelectTrigger>
            <SelectContent className="max-h-80 rounded-2xl border-primary/20 bg-white/95 backdrop-blur-md shadow-2xl">
              {LANGUAGE_OPTIONS.map((language) => (
                <SelectItem
                  key={language}
                  value={language}
                  className="rounded-xl py-2.5 text-[14px] font-medium hover:bg-primary/10 focus:bg-primary/10"
                >
                  {language}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="block relative group rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm p-2">
          <JanSetuLogo
            variant="icon"
            className="transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_14px_rgba(255,153,51,0.55)]"
          />
        </div>
      </div>
    </header>
  );
}

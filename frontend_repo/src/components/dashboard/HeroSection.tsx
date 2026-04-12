import { Search, Mic } from "lucide-react";
import { useState } from "react";
import { useBBN } from "@/context/BBNContext";
import { mockProfile } from "@/lib/api";
import { useI18n } from "@/hooks/use-i18n";

const KNOWN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
];

const OCCUPATION_KEYWORDS = [
  "farmer", "student", "self-employed", "construction worker", "street vendor",
  "daily wage worker", "govt employee", "government employee", "private employee",
  "homemaker", "retired", "unemployed", "worker"
];

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractState(text: string): string | null {
  const normalized = text.toLowerCase();
  for (const state of KNOWN_STATES) {
    if (normalized.includes(state.toLowerCase())) {
      return state;
    }
  }
  const fallback = normalized.match(/\b(?:from|in)\s+([a-z\s]+)$/i);
  return fallback?.[1] ? toTitleCase(fallback[1].trim()) : null;
}

function extractOccupation(text: string): string | null {
  const normalized = text.toLowerCase();
  for (const keyword of OCCUPATION_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return toTitleCase(keyword.replace("government", "Govt"));
    }
  }
  const pattern = normalized.match(/\b(?:i am|i'm|im)\s+(?:a|an)?\s*([a-z\s-]+?)(?:\s+(?:from|in)\b|$)/i);
  return pattern?.[1] ? toTitleCase(pattern[1].trim()) : null;
}

interface HeroSectionProps {
  showSearch?: boolean;
}

export function HeroSection({ showSearch = true }: HeroSectionProps) {
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [validationError, setValidationError] = useState("");
  const { userProfile, setAadhaar, runQuery, openSmartIntake, isLoading } = useBBN();
  const { t } = useI18n();

  const startListening = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      const mockQuery = "Show me healthcare benefits for my family";
      setInputValue(mockQuery);
      runQuery(mockQuery);
    }, 2000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setValidationError("");
    const cleanedInput = inputValue.replace(/\s/g, "");

    // Aadhaar flow: fetch profile and show real citizen name in greeting.
    if (/^\d{12}$/.test(cleanedInput)) {
      await setAadhaar(cleanedInput);
      return;
    }
    if (/^\d+$/.test(cleanedInput) && cleanedInput.length !== 12) {
      setValidationError("Aadhaar number must be exactly 12 digits.");
      return;
    }
    if (/^[A-Za-z0-9]+$/.test(cleanedInput) && cleanedInput.length <= 12) {
      setValidationError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    // Statement flow: simulate profile using extracted occupation/state.
    const extractedOccupation = extractOccupation(inputValue);
    const extractedState = extractState(inputValue);
    if (extractedOccupation || extractedState) {
      // Open Smart Intake and auto-fill parsed fields from statement.
      openSmartIntake({
        occupation: extractedOccupation || mockProfile.occupation,
        state: extractedState || mockProfile.state,
      });
      return;
    }

    await runQuery(inputValue);
  };

  return (
    <div className="mb-7 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="hero-title text-foreground">
              <span className="bg-[linear-gradient(90deg,#f6b35e_0%,#ff9933_100%)] bg-clip-text text-transparent">
                {t("namaste", "Namaste")},
              </span>{" "}
              <span className="text-[#0f4d4d]">{userProfile?.name || t("citizen", "Citizen")}</span>
            </h2>
            <div className="body-copy mt-1.5 text-[#4f6160]">
              {t("hero_hint", "Enter Aadhaar or describe your profile like \"I am a farmer from Telangana\".")}
            </div>
          </div>
        </div>
      </div>

      {showSearch && (
        <form onSubmit={handleSearch} className="relative max-w-xl">
          <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLoading ? "animate-pulse text-primary" : "text-muted-foreground"}`} />
          <input
            type="text"
            placeholder={isListening ? "Listening..." : t("hero_placeholder", "Enter Aadhaar or ask with occupation and state...")}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (validationError) setValidationError("");
            }}
            disabled={isLoading || isListening}
            className={`w-full pl-11 pr-12 py-3 rounded-xl bg-card border border-border text-[14px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-card transition-all ${isListening ? "ring-2 ring-primary/50 bg-primary/5" : ""}`}
          />
          <button
            type="button"
            onClick={startListening}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? "bg-primary text-white scale-110 animate-pulse" : "hover:bg-muted text-primary"}`}
          >
            <Mic size={18} />
          </button>
        </form>
      )}
      {validationError && (
        <p className="mt-2 text-sm font-semibold text-destructive">{validationError}</p>
      )}
      {userProfile && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Age</p>
            <p className="text-sm font-semibold text-foreground">{userProfile.age || "N/A"}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">State</p>
            <p className="text-sm font-semibold text-foreground">{userProfile.state || "N/A"}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Caste Category</p>
            <p className="text-sm font-semibold text-foreground">{userProfile.caste || "N/A"}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Income (Monthly)</p>
            <p className="text-sm font-semibold text-foreground">
              Rs {Number(userProfile.monthly_income || 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Income (Annual)</p>
            <p className="text-sm font-semibold text-foreground">
              Rs {Number(userProfile.annual_income ?? ((userProfile.monthly_income || 0) * 12)).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

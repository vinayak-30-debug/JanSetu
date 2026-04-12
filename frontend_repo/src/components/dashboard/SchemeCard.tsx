import { Calendar, HeartPulse, Apple, Landmark, GraduationCap } from "lucide-react";
import { useBBN } from "@/context/BBNContext";
import type { SchemeInfo } from "@/lib/api";
import { useI18n } from "@/hooks/use-i18n";

const categoryIcons: Record<string, typeof HeartPulse> = {
  Healthcare: HeartPulse,
  Nutrition: Apple,
  Pension: Landmark,
  Education: GraduationCap,
};

const categoryColors: Record<string, string> = {
  Healthcare: "text-primary bg-primary/10",
  Nutrition: "text-accent bg-accent/10",
  Pension: "text-info bg-info/10",
  Education: "text-success bg-success/10",
};

export function SchemeCard({ scheme }: { scheme: SchemeInfo }) {
  const Icon = categoryIcons[scheme.category] || HeartPulse;
  const colorClass = categoryColors[scheme.category] || "text-primary bg-primary/10";
  const { selectedScheme, setSelectedScheme, openSchemeDetails, isAssistedMode } = useBBN();
  const { t } = useI18n();

  const isSelected = selectedScheme?.id === scheme.id;

  return (
    <div className={`p-4 min-w-[220px] flex flex-col transition-all cursor-pointer ${isSelected
      ? "ring-2 ring-primary bg-primary/5 shadow-elevated"
      : "glass-card-hover"
      }`}
      onClick={() => setSelectedScheme(scheme)}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
          <Icon size={16} />
        </div>
        <h4 className={`font-semibold text-foreground ${isAssistedMode ? 'text-lg' : 'text-sm'}`}>{scheme.title}</h4>
      </div>
      <p className={`text-muted-foreground mb-1 ${isAssistedMode ? 'text-sm' : 'text-xs'}`}>{scheme.description}</p>
      {!isAssistedMode && (
        <>
          <p className="text-xs text-foreground font-medium mb-1">{scheme.coverage}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Calendar size={12} />
            {t("due_by", "Due by")} {scheme.due_date}
          </div>
        </>
      )}
      <div className="mt-auto flex items-center gap-2">
        {scheme.eligible && (
          <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-semibold uppercase">
            {t("eligible", "Eligible")}
          </span>
        )}
        <button
          className={`ml-auto px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity ${isAssistedMode ? 'text-sm px-4' : 'text-xs'
            }`}
          onClick={(e) => {
            e.stopPropagation();
            openSchemeDetails(scheme);
          }}
        >
          {isSelected ? t("selected", "SELECTED") : t("view_details", "VIEW DETAILS")}
        </button>
      </div>
    </div>
  );
}

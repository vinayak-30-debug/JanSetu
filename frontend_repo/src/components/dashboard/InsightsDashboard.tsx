import { useBBN } from "@/context/BBNContext";
import { BarChart3, PieChart, Info, MapPin } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

export function InsightsDashboard() {
    const { userProfile } = useBBN();
    const { t } = useI18n();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="p-6 rounded-3xl bg-foreground text-background">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <BarChart3 size={24} />
                    {t("welfare_insights", "Welfare Insights")}
                </h3>
                <p className="text-sm opacity-70">{t("insights_deep_analysis", "Deep analysis of benefits across")} {userProfile?.state || t("india", "India")}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
                    <div className="flex items-center gap-2 font-bold text-primary">
                        <PieChart size={20} /> {t("allocation_mix", "Allocation Mix")}
                    </div>
                    <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex">
                        <div className="h-full bg-primary w-[60%]" />
                        <div className="h-full bg-success w-[30%]" />
                        <div className="h-full bg-accent w-[10%]" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span>{t("central", "Central")} (60%)</span>
                        <span>{t("state", "State")} (30%)</span>
                        <span>{t("local", "Local")} (10%)</span>
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
                    <div className="flex items-center gap-2 font-bold text-info">
                        <MapPin size={20} /> {t("regional_status", "Regional Status")}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {t("regional_status_desc_1", "You are currently being matched against")} <strong>{userProfile?.state}</strong> {t("regional_status_desc_2", "specific policies. Out-of-state schemes are hidden to ensure precision.")}
                    </p>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-info/5 border border-info/20 text-info text-[10px] font-bold">
                        <Info size={14} /> {t("verified_domicile_only", "Only verified domicile policies are visible.")}
                    </div>
                </div>
            </div>

            <div className="p-8 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center space-y-3 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-not-allowed">
                <BarChart3 size={40} className="text-muted-foreground" />
                <p className="text-sm font-bold">{t("ai_trend_coming_soon", "AI Trend Forecasting coming soon")}</p>
                <p className="text-xs text-muted-foreground">{t("beta_testing_next_month", "Beta testing for your region starting next month.")}</p>
            </div>
        </div>
    );
}

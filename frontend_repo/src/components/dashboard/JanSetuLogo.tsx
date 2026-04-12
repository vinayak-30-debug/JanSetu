type JanSetuLogoProps = {
  variant?: "horizontal" | "icon";
  monochrome?: boolean;
  showTagline?: boolean;
  onDark?: boolean;
  className?: string;
};
import { useI18n } from "@/hooks/use-i18n";

export function JanSetuLogo({
  variant = "horizontal",
  monochrome = false,
  showTagline = true,
  onDark = false,
  className = "",
}: JanSetuLogoProps) {
  const { t } = useI18n();
  const teal = monochrome ? "currentColor" : "#0f4d4d";
  const saffron = monochrome ? "currentColor" : "#FF9933";
  const green = monochrome ? "currentColor" : "#138808";
  const titleStyle = monochrome
    ? { color: "currentColor" }
    : {
        color: "transparent",
        backgroundImage: "linear-gradient(180deg, #D97706 0%, #E7ECEB 48%, #0B6B2A 100%)",
        WebkitBackgroundClip: "text" as const,
        backgroundClip: "text" as const,
        textShadow: onDark ? "0 1px 2px rgba(0,0,0,0.34)" : "none",
      };

  const icon = (
    <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="14" fill={monochrome ? "none" : "rgba(255,255,255,0.08)"} />
      <path
        d="M39 14v19c0 10-7 17-17 17-7 0-13-3-16-9"
        fill="none"
        stroke={teal}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 36c6-7 14-10 24-10 6 0 11 1 16 3"
        fill="none"
        stroke={saffron}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M16 21a20 20 0 0 1 30-8"
        fill="none"
        stroke={green}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M20 19a16 16 0 0 1 24-6"
        fill="none"
        stroke={saffron}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );

  if (variant === "icon") {
    return <div className={`inline-flex items-center ${className}`}>{icon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {icon}
      <div className="leading-tight">
        <h1
          className="font-jansetu text-[26px] font-extrabold tracking-[0.9px]"
          style={titleStyle}
        >
          JANSETU
        </h1>
        {showTagline && (
          <p
            className="text-[10px] font-medium tracking-[0.45px] uppercase"
            style={{ color: monochrome ? "currentColor" : onDark ? "rgba(255,255,255,0.85)" : "#436160" }}
          >
            {t("tagline", "Connecting Citizens to Government Benefits")}
          </p>
        )}
      </div>
    </div>
  );
}

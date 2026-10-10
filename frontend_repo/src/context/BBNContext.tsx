import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
    CitizenProfile,
    QueryResponse,
    fetchCitizenProfile,
    submitQuery,
    mockProfile,
    mockQueryResponse,
    LLMMode,
    getLLMMode,
    setLLMMode
} from '../lib/api';
import { useToast } from '@/hooks/use-toast';

interface BBNContextType {
    userProfile: CitizenProfile | null;
    selectedLanguage: string;
    smartIntakePrefill: Partial<CitizenProfile> | null;
    queryResponse: QueryResponse | null;
    isLoading: boolean;
    error: string | null;
    isAssistedMode: boolean;
    selectedScheme: any | null;
    showSchemeDetails: boolean;
    showProfileCompletion: boolean;
    activeTab: string;
    llmMode: LLMMode;
    isLLMModeLoading: boolean;
    llmModeError: string | null;
    setActiveTab: (tab: string) => void;
    updateLLMMode: (mode: LLMMode) => Promise<void>;
    setSelectedLanguage: (language: string) => void;
    setSelectedScheme: (scheme: any | null) => void;
    openSchemeDetails: (scheme?: any | null) => void;
    closeSchemeDetails: () => void;
    setShowProfileCompletion: (show: boolean) => void;
    openSmartIntake: (prefill?: Partial<CitizenProfile> | null) => void;
    setAadhaar: (aadhaar: string) => Promise<void>;
    submitManualProfile: (profile: CitizenProfile) => void;
    runQuery: (
        query: string,
        simulate?: boolean,
        profileOverride?: CitizenProfile | null,
        aadhaarOverride?: string
    ) => Promise<void>;
    isVaultModalOpen: boolean;
    openVaultModal: () => void;
    closeVaultModal: () => void;
    toggleVaultModal: () => void;
    isApplying: boolean;
    startApplication: (scheme: any) => void;
    cancelApplication: () => void;
    toggleAssistedMode: () => void;
    resetAll: () => void;
}

const BBNContext = createContext<BBNContextType | undefined>(undefined);

export const BBNProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { toast } = useToast();
    const [userProfile, setUserProfile] = useState<CitizenProfile | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState("English");
    const [smartIntakePrefill, setSmartIntakePrefill] = useState<Partial<CitizenProfile> | null>(null);
    const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAssistedMode, setIsAssistedMode] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState<any | null>(null);
    const [showSchemeDetails, setShowSchemeDetails] = useState(false);
    const [showProfileCompletion, setShowProfileCompletion] = useState(false);
    const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("Dashboard");
    const [llmMode, setLlmMode] = useState<LLMMode>("auto");
    const [isLLMModeLoading, setIsLLMModeLoading] = useState(false);
    const [llmModeError, setLlmModeError] = useState<string | null>(null);
    const [activeCitizenId, setActiveCitizenId] = useState("");

    const openVaultModal = () => setIsVaultModalOpen(true);
    const closeVaultModal = () => setIsVaultModalOpen(false);
    const toggleVaultModal = () => setIsVaultModalOpen((prev) => !prev);
    const [isApplying, setIsApplying] = useState(false);

    const resolveTemplateLanguage = (language: string) => {
        const normalized = (language || "").trim().toLowerCase();
        const languageMap: Record<string, string> = {
            english: "English",
            hindi: "Hindi",
            assamese: "Assamese",
            bengali: "Bengali",
            bodo: "Bodo",
            dogri: "Dogri",
            gujarati: "Gujarati",
            kannada: "Kannada",
            kashmiri: "Kashmiri",
            konkani: "Konkani",
            maithili: "Maithili",
            malayalam: "Malayalam",
            manipuri: "Manipuri",
            marathi: "Marathi",
            nepali: "Nepali",
            odia: "Odia",
            punjabi: "Punjabi",
            sanskrit: "Sanskrit",
            santali: "Santali",
            sindhi: "Sindhi",
            tamil: "Tamil",
            telugu: "Telugu",
            urdu: "Urdu",
        };
        return languageMap[normalized] || "English";
    };

    const resolveSpeechLanguage = (language: string) => {
        const normalized = (language || "").trim().toLowerCase();
        const languageMap: Record<string, string> = {
            english: "en-IN",
            hindi: "hi-IN",
            assamese: "as-IN",
            bengali: "bn-IN",
            bodo: "brx-IN",
            dogri: "doi-IN",
            gujarati: "gu-IN",
            kannada: "kn-IN",
            kashmiri: "ks-IN",
            konkani: "kok-IN",
            maithili: "mai-IN",
            malayalam: "ml-IN",
            manipuri: "mni-IN",
            marathi: "mr-IN",
            nepali: "ne-IN",
            odia: "or-IN",
            punjabi: "pa-IN",
            sanskrit: "sa-IN",
            santali: "sat-IN",
            sindhi: "sd-IN",
            tamil: "ta-IN",
            telugu: "te-IN",
            urdu: "ur-IN",
        };
        return languageMap[normalized] || "en-IN";
    };

    const getBenefitsAlertContent = (language: string, monthlyBenefit: number, eligibleCount: number) => {
        const amountText = `Rs ${Math.round(monthlyBenefit).toLocaleString("en-IN")}`;
        const hasSchemes = eligibleCount > 0;

        const templates: Record<string, { title: string; withSchemes: string; noSchemes: string }> = {
            English: {
                title: "Benefits Alert",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Hindi: {
                title: "Benefits Alert - Hindi",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Assamese: {
                title: "Benefits Alert - Assamese",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Bengali: {
                title: "Benefits Alert - Bengali",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Bodo: {
                title: "Benefits Alert - Bodo",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Dogri: {
                title: "Benefits Alert - Dogri",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Gujarati: {
                title: "Benefits Alert - Gujarati",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Kannada: {
                title: "Benefits Alert - Kannada",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Kashmiri: {
                title: "Benefits Alert - Kashmiri",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Konkani: {
                title: "Benefits Alert - Konkani",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Maithili: {
                title: "Benefits Alert - Maithili",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Malayalam: {
                title: "Benefits Alert - Malayalam",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Manipuri: {
                title: "Benefits Alert - Manipuri",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Marathi: {
                title: "Benefits Alert - Marathi",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Nepali: {
                title: "Benefits Alert - Nepali",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Odia: {
                title: "Benefits Alert - Odia",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Punjabi: {
                title: "Benefits Alert - Punjabi",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Sanskrit: {
                title: "Benefits Alert - Sanskrit",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Santali: {
                title: "Benefits Alert - Santali",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Sindhi: {
                title: "Benefits Alert - Sindhi",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Tamil: {
                title: "Benefits Alert - Tamil",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Telugu: {
                title: "Benefits Alert - Telugu",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
            Urdu: {
                title: "Benefits Alert - Urdu",
                withSchemes: `Estimated monthly benefits: ${amountText} across ${eligibleCount} eligible schemes.`,
                noSchemes: `Estimated monthly benefits: ${amountText}. Complete profile details to unlock more schemes.`,
            },
        };

        const resolvedLanguage = resolveTemplateLanguage(language);
        const chosen = templates[resolvedLanguage] || templates.English;
        const description = hasSchemes ? chosen.withSchemes : chosen.noSchemes;
        return {
            title: chosen.title,
            description,
            voiceText: description,
        };
    };

    const updateSelectedLanguage = (language: string) => {
        setSelectedLanguage(language);
        setUserProfile((prev) => (prev ? { ...prev, language } : prev));
    };

    const speakBenefitsAlert = (message: string) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        try {
            const synth = window.speechSynthesis;
            synth.cancel();

            const utterance = new SpeechSynthesisUtterance(message);
            const targetLang = resolveSpeechLanguage(selectedLanguage);
            utterance.lang = targetLang;
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;

            const speakNow = () => {
                const voices = synth.getVoices();
                const langLower = targetLang.toLowerCase();
                const primaryPrefix = targetLang.split("-")[0].toLowerCase();
                const fallbackOrder: Record<string, string[]> = {
                    "as-in": ["hi-IN", "bn-IN", "en-IN"],
                    "bn-in": ["hi-IN", "en-IN"],
                    "brx-in": ["as-IN", "hi-IN", "en-IN"],
                    "doi-in": ["hi-IN", "en-IN"],
                    "gu-in": ["hi-IN", "en-IN"],
                    "kn-in": ["hi-IN", "en-IN"],
                    "kok-in": ["mr-IN", "hi-IN", "en-IN"],
                    "ks-in": ["ur-IN", "hi-IN", "en-IN"],
                    "mai-in": ["hi-IN", "en-IN"],
                    "ml-in": ["ta-IN", "hi-IN", "en-IN"],
                    "mni-in": ["bn-IN", "hi-IN", "en-IN"],
                    "mr-in": ["hi-IN", "en-IN"],
                    "ne-in": ["hi-IN", "en-IN"],
                    "or-in": ["hi-IN", "bn-IN", "en-IN"],
                    "pa-in": ["hi-IN", "en-IN"],
                    "sa-in": ["hi-IN", "en-IN"],
                    "sat-in": ["hi-IN", "en-IN"],
                    "sd-in": ["ur-IN", "hi-IN", "en-IN"],
                    "ta-in": ["hi-IN", "en-IN"],
                    "te-in": ["hi-IN", "en-IN"],
                    "ur-in": ["hi-IN", "en-IN"],
                    "hi-in": ["en-IN"],
                    "en-in": ["en-US", "en-GB"],
                };

                const exact = voices.find((v) => v.lang.toLowerCase() === langLower);
                const prefix = voices.find((v) => v.lang.toLowerCase().startsWith(primaryPrefix));

                let matchedVoice = exact || prefix || null;
                if (!matchedVoice) {
                    const fallbacks = fallbackOrder[langLower] || ["en-IN", "en-US", "en-GB"];
                    for (const fb of fallbacks) {
                        const fbLower = fb.toLowerCase();
                        const fbPrefix = fb.split("-")[0].toLowerCase();
                        matchedVoice =
                            voices.find((v) => v.lang.toLowerCase() === fbLower) ||
                            voices.find((v) => v.lang.toLowerCase().startsWith(fbPrefix)) ||
                            null;
                        if (matchedVoice) break;
                    }
                }

                if (matchedVoice) {
                    utterance.voice = matchedVoice;
                    utterance.lang = matchedVoice.lang || targetLang;
                } else {
                    utterance.lang = "en-IN";
                }
                synth.speak(utterance);
            };

            const voices = synth.getVoices();
            if (voices.length > 0) {
                speakNow();
                return;
            }

            let hasSpoken = false;
            const onVoicesChanged = () => {
                if (hasSpoken) return;
                hasSpoken = true;
                synth.removeEventListener("voiceschanged", onVoicesChanged);
                speakNow();
            };

            synth.addEventListener("voiceschanged", onVoicesChanged);
            window.setTimeout(() => {
                if (hasSpoken) return;
                hasSpoken = true;
                synth.removeEventListener("voiceschanged", onVoicesChanged);
                speakNow();
            }, 600);
        } catch {
            // no-op: voice output is best-effort only
        }
    };

    useEffect(() => {
        const loadMode = async () => {
            try {
                setIsLLMModeLoading(true);
                setLlmModeError(null);
                const mode = await getLLMMode();
                setLlmMode(mode);
            } catch (_err: any) {
                setLlmModeError("Unable to load AI mode.");
            } finally {
                setIsLLMModeLoading(false);
            }
        };
        loadMode();
    }, []);

    const updateLLMMode = async (mode: LLMMode) => {
        try {
            setIsLLMModeLoading(true);
            setLlmModeError(null);
            const updated = await setLLMMode(mode);
            setLlmMode(updated);
        } catch (_err: any) {
            setLlmModeError("Failed to change AI mode.");
        } finally {
            setIsLLMModeLoading(false);
        }
    };

    const openSmartIntake = (prefill: Partial<CitizenProfile> | null = null) => {
        setSmartIntakePrefill(prefill);
        setShowProfileCompletion(true);
        setError(null);
    };

    const setAadhaar = async (aadhaar: string) => {
        const normalizedAadhaar = (aadhaar || "").trim();
        setIsLoading(true);
        setError(null);

        try {
            const profile = await fetchCitizenProfile(normalizedAadhaar);
            const resolvedId = profile.uid_token || profile.citizen_id || "";
            setActiveCitizenId(resolvedId);
            setUserProfile(profile);
            const initialResponse = await submitQuery("What benefits am I eligible for?", profile, resolvedId);
            setQueryResponse(initialResponse);

            const monthlyBenefit = Number(
                String(initialResponse?.monthly_benefit_value ?? 0).replace(/[^\d.]/g, "")
            ) || 0;
            const eligibleCount = initialResponse?.eligible_schemes?.length || 0;
            const alertContent = getBenefitsAlertContent(selectedLanguage, monthlyBenefit, eligibleCount);

            toast({
                title: alertContent.title,
                description: alertContent.description,
            });
            speakBenefitsAlert(alertContent.voiceText);

            // Auto-select first scheme if none selected
            if (initialResponse.eligible_schemes.length > 0) {
                setSelectedScheme(initialResponse.eligible_schemes[0]);
            } else if (initialResponse.recommended_schemes.length > 0) {
                setSelectedScheme(initialResponse.recommended_schemes[0]);
            }

            setShowProfileCompletion(false);
        } catch (err: any) {
            // If Aadhaar not found, show the profile completion modal
            setUserProfile(null);
            setQueryResponse(null);
            setSelectedScheme(null);
            openSmartIntake({ aadhaar_masked: "XXXX-XXXX-XXXX", citizen_id: "", name: "", age: 0, ration_card: "None", monthly_income: 0, occupation: "", language: "English", state: "", caste: "General" });
            setError("Verify the Aadhaar-linked mobile number to securely access your profile, or complete your profile.");
        } finally {
            setIsLoading(false);
        }
    };

    const submitManualProfile = async (profile: CitizenProfile) => {
        setIsLoading(true);
        try {
            const normalizedProfile = {
                ...profile,
                citizen_id: activeCitizenId || profile.citizen_id,
                state: profile.state,
                caste: profile.caste,
                language: selectedLanguage
            };
            setUserProfile(normalizedProfile);
            const initialResponse = await submitQuery("What benefits am I eligible for?", normalizedProfile, activeCitizenId || profile.citizen_id);
            setQueryResponse(initialResponse);

            const monthlyBenefit = Number(
                String(initialResponse?.monthly_benefit_value ?? 0).replace(/[^\d.]/g, "")
            ) || 0;
            const eligibleCount = initialResponse?.eligible_schemes?.length || 0;
            const alertContent = getBenefitsAlertContent(selectedLanguage, monthlyBenefit, eligibleCount);

            toast({
                title: alertContent.title,
                description: alertContent.description,
            });
            speakBenefitsAlert(alertContent.voiceText);

            // Auto-select first scheme
            if (initialResponse.eligible_schemes.length > 0) {
                setSelectedScheme(initialResponse.eligible_schemes[0]);
            } else if (initialResponse.recommended_schemes.length > 0) {
                setSelectedScheme(initialResponse.recommended_schemes[0]);
            }

            setShowProfileCompletion(false);
            setError(null);
        } catch (err: any) {
            setError("Failed to determine eligibility with provided data.");
        } finally {
            setIsLoading(false);
        }
    };

    const runQuery = async (
        query: string,
        simulate: boolean = false,
        profileOverride: CitizenProfile | null = null,
        aadhaarOverride: string = ""
    ) => {
        try {
            if (simulate) {
                const baseResponse = queryResponse || mockQueryResponse;
                const currentLikelihood = baseResponse?.ml_prediction?.approval_likelihood ?? 0.5;
                const queryLower = (query || "").toLowerCase();
                const categoryBoost =
                    queryLower.includes("health") ? 0.08 :
                        queryLower.includes("pension") ? 0.06 :
                            queryLower.includes("education") ? 0.05 :
                                queryLower.includes("ration") ? 0.04 : 0.03;
                const jitter = Math.random() * 0.04;
                const simulatedLikelihood = Math.min(
                    0.98,
                    Math.max(0.1, currentLikelihood + categoryBoost + jitter)
                );

                const currentMonthly = Number(
                    String(baseResponse?.monthly_benefit_value ?? 0).replace(/[^\d.]/g, "")
                ) || 0;
                const simulatedMonthly = Math.round(currentMonthly * (1 + categoryBoost / 2));

                const simulatedResponse: QueryResponse = {
                    ...baseResponse,
                    monthly_benefit_value: simulatedMonthly,
                    ml_prediction: {
                        ...baseResponse.ml_prediction,
                        approval_likelihood: simulatedLikelihood
                    },
                    explanation: `Simulation completed for: ${query}`
                };
                setQueryResponse(simulatedResponse);
                return;
            }

            setIsLoading(true);
            setError(null);
            const effectiveProfile = profileOverride || userProfile;
            const effectiveCitizenId = aadhaarOverride || activeCitizenId || (effectiveProfile?.citizen_id ?? "");

            const response = await submitQuery(query, effectiveProfile, effectiveCitizenId);
            setQueryResponse(response);
            if (profileOverride) {
                setUserProfile(profileOverride);
            }

            // Preserve simulator/quick-link selection; otherwise auto-select first result.
            const isPinnedSimulatorSelection =
                !!selectedScheme &&
                typeof selectedScheme.id === "string" &&
                (selectedScheme.id.startsWith("sim-") || selectedScheme.id.startsWith("quick-"));

            if (!isPinnedSimulatorSelection && !selectedScheme) {
                if (response.eligible_schemes.length > 0) {
                    setSelectedScheme(response.eligible_schemes[0]);
                } else if (response.recommended_schemes.length > 0) {
                    setSelectedScheme(response.recommended_schemes[0]);
                }
            }
        } catch (err: any) {
            setError(err.message || "Query failed");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAssistedMode = () => setIsAssistedMode(!isAssistedMode);
    const openSchemeDetails = (scheme: any | null = null) => {
        if (scheme) setSelectedScheme(scheme);
        setShowSchemeDetails(true);
    };
    const closeSchemeDetails = () => setShowSchemeDetails(false);

    const startApplication = (scheme: any) => {
        setSelectedScheme(scheme);
        setIsApplying(true);
    };

    const cancelApplication = () => {
        setIsApplying(false);
    };

    const resetAll = () => {
        setUserProfile(null);
        setSmartIntakePrefill(null);
        setQueryResponse(null);
        setError(null);
        setSelectedLanguage("English");
        setShowProfileCompletion(false);
        setIsApplying(false);
        setShowSchemeDetails(false);
    };

    return (
        <BBNContext.Provider value={{
            userProfile,
            selectedLanguage,
            smartIntakePrefill,
            queryResponse,
            isLoading,
            error,
            isAssistedMode,
            selectedScheme,
            showSchemeDetails,
            showProfileCompletion,
            activeTab,
            llmMode,
            isLLMModeLoading,
            llmModeError,
            setSelectedScheme,
            openSchemeDetails,
            closeSchemeDetails,
            setShowProfileCompletion,
            openSmartIntake,
            setActiveTab,
            updateLLMMode,
            setSelectedLanguage: updateSelectedLanguage,
            setAadhaar,
            submitManualProfile,
            runQuery,
            isApplying,
            isVaultModalOpen,
            openVaultModal,
            closeVaultModal,
            toggleVaultModal,
            startApplication,
            cancelApplication,
            toggleAssistedMode,
            resetAll
        }}>
            {children}
        </BBNContext.Provider>
    );
};

export const useBBN = () => {
    const context = useContext(BBNContext);
    if (context === undefined) {
        throw new Error('useBBN must be used within a BBNProvider');
    }
    return context;
};

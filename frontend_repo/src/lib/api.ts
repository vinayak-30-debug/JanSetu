const DEFAULT_API_BASE =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
    : "http://127.0.0.1:8000/api/v1";
const API_BASE = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, "");
const API_BASE_FALLBACKS =
  typeof window !== "undefined"
    ? [
        `http://${window.location.hostname}:8000/api/v1`,
        "http://127.0.0.1:8000/api/v1",
        "http://localhost:8000/api/v1",
      ]
    : ["http://127.0.0.1:8000/api/v1"];
export type LLMMode = "online" | "offline" | "auto";

async function parseJsonSafe(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

export interface CitizenProfile {
  name: string;
  aadhaar_no: string;
  phone?: string;
  age: number;
  ration_card: string;
  monthly_income: number;
  annual_income?: number;
  occupation: string;
  language: string;
  state: string;
  caste: string;
  gender?: string;
  bpl_status?: boolean;
  land_ownership?: boolean;
  student_status?: boolean;
  bank_account?: boolean;
  head_of_family?: boolean;
  resident?: boolean;
  informal_worker?: boolean;
}

export interface SchemeInfo {
  id: string;
  title: string;
  category: string;
  description: string;
  coverage: string;
  due_date: string;
  eligible: boolean;
  scheme_scope?: string;
  reason_eligible?: string;
  reason_not_eligible?: string;
  estimated_benefit?: any;
  required_states?: string[];
  official_url?: string;
  benefits?: any;
  ministry?: string;
  application_process?: string[];
}

export interface QueryResponse {
  eligible_policies: number;
  eligible_schemes: SchemeInfo[];
  not_eligible_schemes: SchemeInfo[];
  monthly_benefit_value: number;
  ml_prediction: {
    approval_likelihood: number;
  };
  decision_output: {
    document_advice: string[];
  };
  explanation: string;
  reasoning_details?: string;
  recommended_schemes: SchemeInfo[];
}

export interface SchemeCatalogItem {
  policy_id: string;
  name: string;
  description: string;
  ministry: string;
  category: string;
  benefits: any;
  subsidy_details: any;
  eligibility_criteria: any;
  application_process: string[];
  official_url?: string;
  scheme_scope: "Central" | "State";
  required_states: string[];
}

export interface SchemeCatalogResponse {
  total_schemes: number;
  central_schemes: SchemeCatalogItem[];
  state_schemes: SchemeCatalogItem[];
}

export const mockQueryResponse: QueryResponse = {
  eligible_policies: 5,
  eligible_schemes: [],
  not_eligible_schemes: [],
  monthly_benefit_value: 5000,
  ml_prediction: {
    approval_likelihood: 0.85,
  },
  decision_output: {
    document_advice: ["Aadhaar", "Income Certificate"],
  },
  explanation: "You are highly eligible for the PM-Kisan scheme.",
  reasoning_details:
    "AI analyzed your profile and matched it with agricultural ministry data...",
  recommended_schemes: [],
};

export async function fetchCitizenProfile(
  aadhaarNo: string
): Promise<CitizenProfile> {
  const res = await fetch(`${API_BASE}/citizen/by-aadhaar/${aadhaarNo}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function submitQuery(
  query: string,
  profile?: CitizenProfile | null,
  aadhaar_no?: string
): Promise<QueryResponse> {

  // ✅ Always send a valid profile to backend
  const safeProfile = profile
    ? {
        user_id: "user",
        name: profile.name,
        income: (profile.annual_income ?? (profile.monthly_income * 12)), // Prefer exact annual if available
        occupation: profile.occupation,
        state: profile.state,
        caste: profile.caste,
        aadhaar_no: profile.aadhaar_no,
        phone: profile.phone,
        age: profile.age,
        gender: profile.gender,
        bpl_status: profile.bpl_status,
        land_ownership: profile.land_ownership,
        student_status: profile.student_status,
        bank_account: profile.bank_account,
        head_of_family: profile.head_of_family,
        resident: profile.resident,
        informal_worker: profile.informal_worker
      }
    : {
        user_id: "guest",
        occupation: "unknown",
        state: "India",
        caste: "general"
      };

  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      profile: safeProfile,
      aadhaar_no: aadhaar_no || ""
    }),
  });

  if (!res.ok) throw new Error("Failed to submit query");

  const data = await res.json();

  // Mapping function for Consistency
  const mapScheme = (s: any, isEligible: boolean) => ({
    id: s.policy_id || s.id,
    title: s.name || s.title,
    category: s.category,
    description: s.description,
    coverage: s.benefits?.amount || s.coverage || "N/A",
    due_date: s.deadline || s.due_date || "N/A",
    eligible: isEligible,
    scheme_scope: s.scheme_scope,
    reason_eligible: s.reason_eligible,
    reason_not_eligible: s.reason_not_eligible,
    estimated_benefit: s.estimated_benefit,
    required_states: s?.eligibility_criteria?.required_states || [],
    official_url: s.official_url,
    ministry: s.ministry,
    application_process: s.application_process
  });

  return {
    ...data,
    eligible_schemes: (data.eligible_schemes || []).map((s: any) =>
      mapScheme(s, true)
    ),
    not_eligible_schemes: (data.not_eligible_schemes || []).map((s: any) =>
      mapScheme(s, false)
    ),
    recommended_schemes: (data.recommended_schemes || []).map((s: any) =>
      mapScheme(s, false)
    )
  };
}

export const mockProfile: CitizenProfile = {
  name: "Rohit",
  aadhaar_no: "123456789012",
  age: 29,
  ration_card: "White Card",
  monthly_income: 20000,
  annual_income: 240000,
  occupation: "Self-employed",
  language: "English",
  state: "Andhra Pradesh",
  caste: "General"
};

export async function getLLMMode(): Promise<LLMMode> {
  const res = await fetch(`${API_BASE}/llm/mode`);
  if (!res.ok) throw new Error("Failed to fetch LLM mode");
  const data = await res.json();
  return data.mode as LLMMode;
}

export async function setLLMMode(mode: LLMMode): Promise<LLMMode> {
  const res = await fetch(`${API_BASE}/llm/mode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) throw new Error("Failed to set LLM mode");
  const data = await res.json();
  return data.mode as LLMMode;
}

export async function fetchSchemeCatalog(): Promise<SchemeCatalogResponse> {
  const bases = Array.from(new Set([API_BASE, ...API_BASE_FALLBACKS].map((b) => b.replace(/\/$/, ""))));
  let lastError = "Failed to fetch scheme catalog";

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/policies/all`);
      if (!res.ok) {
        lastError = `Scheme catalog request failed (${res.status})`;
        continue;
      }
      return res.json();
    } catch (err: unknown) {
      if (err instanceof Error) {
        lastError = err.message || lastError;
      }
    }
  }

  throw new Error(lastError);
}

export async function sendRegistrationOtp(phone: string): Promise<{ ok: boolean; phone: string; message: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
  } catch {
    throw new Error(`Cannot reach backend at ${API_BASE}. Start backend and retry.`);
  }
  const data = await parseJsonSafe(res);
  if (!res.ok) throw new Error(data?.detail || "Failed to send OTP");
  return data;
}

export async function verifyRegistrationOtp(
  phone: string,
  code: string
): Promise<{ ok: boolean; phone: string; verified: boolean }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
  } catch {
    throw new Error(`Cannot reach backend at ${API_BASE}. Start backend and retry.`);
  }
  const data = await parseJsonSafe(res);
  if (!res.ok) throw new Error(data?.detail || "Failed to verify OTP");
  return data;
}

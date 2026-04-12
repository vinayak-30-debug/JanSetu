import React, { useState } from "react";
import { useBBN } from "@/context/BBNContext";
import {
  ShieldCheck,
  User,
  CreditCard,
  CheckCircle2,
  Upload,
  Clock,
  ArrowRight,
  ArrowLeft,
  FileText,
  Fingerprint,
} from "lucide-react";

export function ApplyNowPage() {
  const { selectedScheme, userProfile, cancelApplication } = useBBN();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isScanning, setIsScanning] = useState<string | null>(null);
  const [verifiedDocs, setVerifiedDocs] = useState<string[]>([
    "Aadhaar Card Copy",
    "Income Certificate",
  ]);

  if (!selectedScheme || !userProfile) return null;

  const scanDocument = (docName: string) => {
    setIsScanning(docName);
    setTimeout(() => {
      setIsScanning(null);
      setVerifiedDocs((prev) => [...prev, docName]);
    }, 3000);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 2000);
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 size={48} className="text-success" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Application Submitted!</h2>
            <p className="text-muted-foreground">
              Your application for{" "}
              <span className="text-foreground font-semibold">{selectedScheme.title}</span> has
              been successfully received by the {selectedScheme.ministry || "ministry"}.
            </p>
          </div>
          <div className="p-4 bg-muted rounded-xl flex items-center gap-4 text-left border border-border">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                Tracking ID
              </p>
              <p className="text-lg font-mono font-bold uppercase">
                BBN-{Math.random().toString(36).substr(2, 9)}
              </p>
            </div>
          </div>
          <button
            onClick={cancelApplication}
            className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold shadow-lg hover:shadow-primary/20 transition-all"
          >
            GO BACK TO DASHBOARD
          </button>
          <p className="text-xs text-muted-foreground">
            Our AI Orchestrator will monitor the progress of your application and notify you of any
            updates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-in slide-in-from-bottom duration-500">
      {isScanning && (
        <div className="fixed inset-0 z-[70] bg-primary/90 backdrop-blur-xl flex flex-col items-center justify-center text-primary-foreground p-6">
          <div className="w-64 h-80 border-4 border-dashed border-white/50 rounded-2xl relative overflow-hidden mb-8">
            <div className="absolute inset-x-0 h-1 bg-white shadow-[0_0_20px_rgba(255,255,255,1)] animate-[scan_2s_ease-in-out_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <Upload size={80} />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold italic">BBN AI Scanning...</h2>
            <p className="text-white/70">Extracting telemetry from {isScanning}</p>
            <div className="flex gap-1 justify-center mt-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-white animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <header className="p-6 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={cancelApplication}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Benefit Application</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck size={12} className="text-primary" />
              Secure Government Submission Portal
            </p>
          </div>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
          Step {step} of 3
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20 flex justify-center">
        <div className="max-w-4xl w-full">
          <div className="flex items-center gap-4 mb-12">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-2 group">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      step >= s
                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {step > s ? <CheckCircle2 size={20} /> : s}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      step >= s ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {s === 1 ? "Verify" : s === 2 ? "Documents" : "Confirm"}
                  </span>
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-0.5 rounded-full ${step > s ? "bg-primary" : "bg-border"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
            {step === 1 && (
              <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Review Your Information</h2>
                  <p className="text-muted-foreground">
                    We've pre-filled your application using your verified BBN profile. Please
                    confirm these details are correct.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-muted/30 border border-border group hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                          Full Name
                        </p>
                        <p className="text-lg font-bold">{userProfile.name}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border flex items-center gap-2 text-xs text-success font-bold">
                      <ShieldCheck size={14} />
                      Aadhaar Verified
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-muted/30 border border-border group hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info">
                        <Fingerprint size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                          Aadhaar Number
                        </p>
                        <p className="text-lg font-mono font-bold tracking-tighter">
                          XXXX-XXXX-{userProfile.aadhaar_no.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border flex items-center gap-2 text-xs text-success font-bold">
                      <ShieldCheck size={14} />
                      Biometrically Authenticated
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-muted/30 border border-border group hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                          Monthly Income
                        </p>
                        <p className="text-lg font-bold">
                          Rs {Number(userProfile.monthly_income || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-2">
                          Annual Income
                        </p>
                        <p className="text-lg font-bold">
                          Rs {Number(userProfile.annual_income ?? (Number(userProfile.monthly_income || 0) * 12)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border flex items-center gap-2 text-xs text-success font-bold">
                      <ShieldCheck size={14} />
                      Income Certificate Linked
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-muted/30 border border-border group hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                          State Residency
                        </p>
                        <p className="text-lg font-bold">{userProfile.state || "Andhra Pradesh"}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border flex items-center gap-2 text-xs text-success font-bold">
                      <ShieldCheck size={14} />
                      Domicile Verified
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
                  <Clock className="text-primary flex-shrink-0" size={24} />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Real-time Verification</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Our AI agent has cross-referenced your profile with the scheme documents. You
                      are a perfect match for{" "}
                      <span className="text-primary font-bold">{selectedScheme.title}</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Required Documents</h2>
                  <p className="text-muted-foreground">
                    Upload the following documents to complete your application. Files should be in
                    PDF or PNG format.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { name: "Aadhaar Card Copy", icon: Fingerprint },
                    { name: "Income Certificate", icon: CreditCard },
                    { name: "Photograph", icon: User },
                    { name: "Caste Certificate", icon: Upload },
                  ].map((doc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground">
                          <doc.icon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
                            Max size 2MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {verifiedDocs.includes(doc.name) ? (
                          <span className="text-xs font-bold text-success flex items-center gap-1">
                            <ShieldCheck size={14} /> VERIFIED
                          </span>
                        ) : (
                          <button
                            onClick={() => scanDocument(doc.name)}
                            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                          >
                            UPLOAD & SCAN
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right duration-300 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                    <ShieldCheck size={40} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Confirm & Submit</h2>
                    <p className="text-muted-foreground">
                      You are about to submit your application for{" "}
                      <strong>{selectedScheme.title}</strong>. This process is digitally signed and
                      secure.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-between">
              <button
                onClick={() => (step > 1 ? setStep(step - 1) : cancelApplication())}
                className="px-6 py-2.5 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                {step === 1 ? "CANCEL" : "BACK"}
              </button>

              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-8 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                >
                  CONTINUE
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-12 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "SUBMITTING..." : "SUBMIT APPLICATION"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

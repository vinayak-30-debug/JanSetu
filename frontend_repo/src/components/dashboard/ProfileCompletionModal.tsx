import React, { useEffect, useMemo, useState } from 'react';
import { useBBN } from '@/context/BBNContext';
import { X } from 'lucide-react';
import { sendRegistrationOtp, verifyRegistrationOtp, fetchCitizenProfile } from '@/lib/api';

export function ProfileCompletionModal() {
    const { showProfileCompletion, smartIntakePrefill, setShowProfileCompletion, submitManualProfile, isAssistedMode, isLoading, startApplication, selectedScheme } = useBBN();
    const [rawInput, setRawInput] = useState('');
    const [consent, setConsent] = useState(false);

    useEffect(() => {
        return () => {
            setRawInput('');
        };
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        age: '',
        state: 'Telangana',
        gender: '',
        occupation: '',
        monthly_income: '',
        caste: '',
        land_ownership: '',
        bpl_status: '',
        head_of_family: '',
        student_status: '',
        bank_account: ''
    });
    const [phoneError, setPhoneError] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState('');
    const [otpInfo, setOtpInfo] = useState('');
    const [otpSentTo, setOtpSentTo] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    const [isOtpLoading, setIsOtpLoading] = useState(false);
    const [casteCertificateFile, setCasteCertificateFile] = useState<File | null>(null);

    const occupationLower = (formData.occupation || '').toLowerCase();
    const isFarmer = occupationLower.includes('farmer');
    const isFemale = (formData.gender || '').toLowerCase() === 'female';
    const isSenior = Number(formData.age || 0) >= 60;
    const isStudent = occupationLower.includes('student');
    const isInformal = occupationLower.includes('informal') || occupationLower.includes('daily wage') || occupationLower.includes('worker');

    const followUps = useMemo(() => {
        const fields: Array<{ key: string; label: string; options: string[] }> = [];
        if (isFarmer) fields.push({ key: 'land_ownership', label: 'Do you own land?', options: ['Yes', 'No'] });
        if (isFemale) fields.push({ key: 'head_of_family', label: 'Are you head of family?', options: ['Yes', 'No'] });
        if (isSenior) fields.push({ key: 'bpl_status', label: 'Do you have BPL status?', options: ['Yes', 'No'] });
        if (isStudent) fields.push({ key: 'student_status', label: 'Are you currently a student?', options: ['Yes', 'No'] });
        if (isInformal) fields.push({ key: 'bank_account', label: 'Do you have a bank account?', options: ['Yes', 'No'] });
        return fields.slice(0, 3); // total questions <= 7 (4 base + up to 3 follow-ups)
    }, [isFarmer, isFemale, isSenior, isStudent, isInformal]);

    useEffect(() => {
        if (!showProfileCompletion || !smartIntakePrefill) return;
        setFormData((prev) => ({
            ...prev,
            state: smartIntakePrefill.state || prev.state,
            occupation: smartIntakePrefill.occupation || prev.occupation,
        }));
    }, [showProfileCompletion, smartIntakePrefill]);

    if (!showProfileCompletion) return null;

    const resetOtpState = () => {
        setOtpCode('');
        setOtpError('');
        setOtpInfo('');
        setOtpSentTo('');
        setOtpVerified(false);
    };

    const sendOtp = async () => {
        const digitsOnlyPhone = (formData.phone || '').replace(/\D/g, '');
        if (!/^\d{10}$/.test(digitsOnlyPhone)) {
            setPhoneError('Phone number must be exactly 10 digits for OTP verification.');
            return;
        }

        setIsOtpLoading(true);
        setOtpError('');
        setOtpInfo('');
        setOtpVerified(false);
        try {
            if (rawInput && !consent) {
                setOtpError('Consent is required to verify the Aadhaar-linked mobile number.');
                return;
            }
            const resp = await sendRegistrationOtp(digitsOnlyPhone, rawInput, consent);
            setOtpSentTo(resp.phone);
            setOtpInfo(`OTP sent to ${resp.phone}`);
        } catch (err: any) {
            if (import.meta.env.DEV) {
                setOtpSentTo(digitsOnlyPhone);
                setOtpInfo(`OTP sent to ${digitsOnlyPhone}`);
            } else {
                setOtpError(err?.message || 'Failed to send OTP');
            }
        } finally {
            setIsOtpLoading(false);
        }
    };

    const verifyOtp = async () => {
        const digitsOnlyPhone = (formData.phone || '').replace(/\D/g, '');
        if (!/^\d{10}$/.test(digitsOnlyPhone)) {
            setPhoneError('Phone number must be exactly 10 digits for OTP verification.');
            return;
        }
        if (!/^\d{4,8}$/.test((otpCode || '').trim())) {
            setOtpError('Enter a valid numeric OTP.');
            return;
        }

        setIsOtpLoading(true);
        setOtpError('');
        setOtpInfo('');
        try {
            await verifyRegistrationOtp(digitsOnlyPhone, otpCode.trim(), rawInput, consent);
            setOtpVerified(true);
            setOtpInfo('Phone number verified successfully.');
        } catch (err: any) {
            if (import.meta.env.DEV && /^\d{4,8}$/.test(otpCode.trim())) {
                setOtpVerified(true);
                setOtpInfo('Phone number verified successfully.');
            } else {
                setOtpVerified(false);
                setOtpError(err?.message || 'OTP verification failed');
            }
        } finally {
            setIsOtpLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const digitsOnlyPhone = (formData.phone || '').replace(/\D/g, '');
        if (!/^\d{10}$/.test(digitsOnlyPhone)) {
            setPhoneError('Phone number must be exactly 10 digits for OTP verification.');
            return;
        }
        if (!otpVerified) {
            setOtpError('Please verify OTP before continuing.');
            return;
        }

        let resolvedCitizenId = smartIntakePrefill?.citizen_id || '';
        let resolvedMaskedAadhaar =
            (smartIntakePrefill as any)?.masked_aadhaar ||
            smartIntakePrefill?.aadhaar_masked ||
            'XXXX-XXXX-XXXX';

        let lookupFailed = false;
        const cleanedRaw = (rawInput || '').trim();
        if (cleanedRaw.length === 12 && /^\d+$/.test(cleanedRaw)) {
            try {
                const lookupRes = await fetchCitizenProfile(cleanedRaw);
                if (lookupRes && lookupRes.citizen_id) {
                    resolvedCitizenId = lookupRes.citizen_id;
                    resolvedMaskedAadhaar = lookupRes.aadhaar_masked || resolvedMaskedAadhaar;
                } else {
                    lookupFailed = true;
                }
            } catch {
                lookupFailed = true;
            } finally {
                // Immediately DISCARD the raw Aadhaar from React state
                setRawInput('');
            }
        } else {
            // DISCARD the raw Aadhaar from React state
            setRawInput('');
        }

        if (lookupFailed || !resolvedCitizenId) {
            setOtpError("Aadhaar verification failed. Please try again.");
            return;
        }

        const safeAge = Math.max(0, Math.min(120, Number(formData.age || 0)));
        const safeMonthlyIncome = Math.max(0, Number(formData.monthly_income || 0));
        submitManualProfile({
            name: formData.name,
            citizen_id: resolvedCitizenId,
            aadhaar_masked: resolvedMaskedAadhaar,
            phone: digitsOnlyPhone,
            age: safeAge,
            ration_card: 'None',
            monthly_income: safeMonthlyIncome,
            occupation: formData.occupation,
            language: 'English',
            state: formData.state,
            caste: formData.caste,
            gender: formData.gender,
            bpl_status: formData.bpl_status === 'Yes',
            land_ownership: formData.land_ownership === 'Yes',
            student_status: formData.student_status === 'Yes',
            bank_account: formData.bank_account === 'Yes',
            head_of_family: formData.head_of_family === 'Yes',
            resident: true,
            informal_worker: isInformal
        });
        if (startApplication) {
            startApplication(selectedScheme || {
                title: "PM Kisan Samman Nidhi",
                ministry: "Ministry of Agriculture & Farmers Welfare"
            });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "phone") {
            const cleaned = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, phone: cleaned }));
            if (phoneError) setPhoneError('');
            resetOtpState();
            return;
        }
        if (name === "age") {
            const n = Number(value || 0);
            const clamped = Math.max(0, Math.min(120, n));
            setFormData(prev => ({ ...prev, [name]: Number.isNaN(n) ? "" : String(clamped) }));
            return;
        }
        if (name === "monthly_income") {
            const n = Number(value || 0);
            const clamped = Math.max(0, n);
            setFormData(prev => ({ ...prev, [name]: Number.isNaN(n) ? "" : String(clamped) }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCasteCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setCasteCertificateFile(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className={`bg-card border border-border rounded-3xl shadow-elevated w-full max-w-xl overflow-hidden flex flex-col my-8 ${isAssistedMode ? 'max-w-2xl scale-105' : ''}`}>
                <div className="p-8 border-b border-border bg-gradient-to-r from-primary to-primary-light text-primary-foreground relative">
                    <h2 className={`font-bold leading-tight ${isAssistedMode ? 'text-4xl mb-2' : 'text-2xl mb-1'}`}>Smart Intake</h2>
                    <p className={`${isAssistedMode ? 'text-xl' : 'text-sm'} opacity-90`}>Verify the Aadhaar-linked mobile number to securely access an existing profile, or complete smart registration.</p>
                    <button onClick={() => setShowProfileCompletion(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input required name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border outline-none" />
                        <div className="space-y-1">
                            <input
                                name="aadhaar"
                                value={rawInput}
                                onChange={(e) => setRawInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                placeholder="Aadhaar Number (12 digits, optional)"
                                autoComplete="off"
                                inputMode="numeric"
                                maxLength={12}
                                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border outline-none"
                            />
                            <p className="text-[11px] text-muted-foreground">Your full Aadhaar is encrypted and never shown</p>
                        </div>
                        <div className="space-y-1">
                            <input
                                required
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone Number (10 digits)"
                                autoComplete="off"
                                inputMode="numeric"
                                maxLength={10}
                                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border outline-none"
                            />
                            <p className="text-[11px] text-muted-foreground">OTP will be sent to this mobile number.</p>
                            {rawInput && (
                                <label className="flex gap-2 text-[11px] text-muted-foreground">
                                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                                    I consent to use my Aadhaar-linked mobile for this lookup.
                                </label>
                            )}
                            {phoneError && <p className="text-[11px] text-destructive font-semibold">{phoneError}</p>}
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={sendOtp}
                                    disabled={isOtpLoading}
                                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                                >
                                    {isOtpLoading ? 'Please wait...' : 'Send OTP'}
                                </button>
                                {otpSentTo && <span className="text-[11px] text-muted-foreground self-center">Sent: {otpSentTo}</span>}
                            </div>
                            <div className="flex gap-2 pt-1">
                                <input
                                    name="otp"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode((e.target.value || '').replace(/\D/g, '').slice(0, 8))}
                                    placeholder="Enter OTP"
                                    inputMode="numeric"
                                    maxLength={8}
                                    className="w-full px-4 py-2 rounded-xl bg-muted/50 border border-border outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={verifyOtp}
                                    disabled={isOtpLoading}
                                    className="px-3 py-2 rounded-lg bg-foreground text-background text-xs font-semibold disabled:opacity-50"
                                >
                                    Verify OTP
                                </button>
                            </div>
                            {otpInfo && <p className="text-[11px] text-emerald-600 font-semibold">{otpInfo}</p>}
                            {otpError && <p className="text-[11px] text-destructive font-semibold">{otpError}</p>}
                        </div>
                        <input required type="number" min={0} max={120} name="age" value={formData.age} onChange={handleChange} placeholder="Age (0-120)" className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border outline-none" />
                        <select required name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border outline-none">
                            <option value="Telangana">Telangana</option>
                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="West Bengal">West Bengal</option>
                            <option value="Rajasthan">Rajasthan</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Madhya Pradesh">Madhya Pradesh</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Bihar">Bihar</option>
                            <option value="Assam">Assam</option>
                            <option value="Himachal Pradesh">Himachal Pradesh</option>
                        </select>
                        <select required name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border outline-none">
                            <option value="">Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        <input required name="occupation" value={formData.occupation} onChange={handleChange} placeholder="Occupation (e.g. Farmer)" className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border outline-none" />
                        <input type="number" min={0} name="monthly_income" value={formData.monthly_income} onChange={handleChange} placeholder="Monthly Income (>= 0)" className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border outline-none" />
                        <input name="caste" value={formData.caste} onChange={handleChange} placeholder="Caste (SC/ST/OBC/General)" className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border outline-none" />
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">Upload Caste Certificate</label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                onChange={handleCasteCertificateUpload}
                                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border outline-none text-sm"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                {casteCertificateFile ? `Selected: ${casteCertificateFile.name}` : "Accepted formats: PDF, JPG, PNG, WEBP"}
                            </p>
                        </div>
                    </div>

                    {followUps.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <p className="text-sm font-semibold text-foreground">Quick follow-up questions</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {followUps.map((f) => (
                                    <div key={f.key} className="space-y-1">
                                        <label className="text-xs text-muted-foreground">{f.label}</label>
                                        <select name={f.key} value={(formData as any)[f.key]} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border outline-none">
                                            <option value="">Select</option>
                                            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button type="submit" disabled={isLoading} className="w-full py-4 rounded-xl bg-foreground text-background font-bold disabled:opacity-50">
                        {isLoading ? 'Checking eligibility...' : 'Find Eligible Schemes'}
                    </button>
                </form>
            </div>
        </div>
    );
}

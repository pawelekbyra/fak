"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkDisplayNameAvailability, completeFirstLoginSetup } from '@/lib/setup-actions';
import { Loader2, Check, X, ShieldCheck, Mail, ChevronRight, Lock } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Zod Schemas for individual steps
const PasswordSchema = z.string()
  .min(8, 'Hasło musi mieć min. 8 znaków')
  .regex(/[A-Z]/, 'Wymagana duża litera')
  .regex(/[0-9]/, 'Wymagana cyfra');

const Step1Schema = z.object({
  newPassword: PasswordSchema,
  newPasswordConfirm: z.string(),
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: "Hasła muszą być identyczne",
  path: ["newPasswordConfirm"],
});

const Step2Schema = z.object({
  displayName: z.string().min(3, 'Min. 3 znaki').max(30, 'Max. 30 znaków'),
});

const Step3Schema = z.object({
  emailConsent: z.boolean(),
  emailLanguage: z.enum(['pl', 'en']),
});

// Combined schema for final submission
const FinalSchema = Step1Schema.merge(Step2Schema).merge(Step3Schema);
type FinalFormValues = z.infer<typeof FinalSchema>;

export default function SetupPage() {
  const { user, setUser } = useUser();
  const { update } = useSession();
  const { addToast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<FinalFormValues>>({
    emailConsent: false,
    emailLanguage: 'pl'
  });

  // Step 2 Specifics
  const [displayNameAvailable, setDisplayNameAvailable] = useState<boolean | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);

  const updateFormData = (data: Partial<FinalFormValues>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black p-4 relative overflow-hidden font-sans text-white">
        {/* Background Atmosphere */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none opacity-50" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -ml-32 -mb-32 pointer-events-none opacity-50" />

        <div className="w-full max-w-md relative z-10">
            <AnimatePresence mode="wait">
                {currentStep === 1 && (
                    <Step1
                        key="step1"
                        onNext={(data) => {
                            updateFormData(data);
                            setCurrentStep(2);
                        }}
                        initialData={formData}
                    />
                )}
                {currentStep === 2 && (
                    <Step2
                        key="step2"
                        onNext={(data) => {
                            updateFormData(data);
                            setCurrentStep(3);
                        }}
                        initialData={formData}
                        displayNameAvailable={displayNameAvailable}
                        setDisplayNameAvailable={setDisplayNameAvailable}
                        isCheckingName={isCheckingName}
                        setIsCheckingName={setIsCheckingName}
                    />
                )}
                {currentStep === 3 && (
                    <Step3
                        key="step3"
                        onNext={async (data) => {
                            updateFormData(data);
                            setIsSubmitting(true);
                            const finalData = { ...formData, ...data } as FinalFormValues;
                            const result = await completeFirstLoginSetup(finalData);

                            if (result.success) {
                                addToast('Witamy w Polutku!', 'success');

                                try {
                                    // Instead of relying on update(), we re-authenticate to force a fresh session token.
                                    // This guarantees the 'isFirstLogin' flag is updated in the cookie.
                                    const loginIdentifier = user?.email || user?.username || '';

                                    if (loginIdentifier) {
                                        const signInResult = await signIn('credentials', {
                                            redirect: false,
                                            login: loginIdentifier,
                                            password: finalData.newPassword
                                        });

                                        if (signInResult?.ok) {
                                             // Update local context to reflect changes immediately in UI if visible
                                            if (user) {
                                                setUser({
                                                    ...user,
                                                    isFirstLogin: false,
                                                    displayName: finalData.displayName,
                                                    emailConsent: finalData.emailConsent,
                                                    emailLanguage: finalData.emailLanguage
                                                });
                                            }
                                            // Set language in localStorage to skip preloader
                                            if (typeof window !== 'undefined') {
                                                localStorage.setItem('language', 'pl'); // Default to PL as setup is in PL
                                            }
                                            // Force reload to apply new session
                                            window.location.href = '/';
                                        } else {
                                            console.error("Re-login failed", signInResult);
                                            // Fallback: try to redirect anyway, maybe update() worked
                                            await update({ force: true });
                                            window.location.href = '/';
                                        }
                                    } else {
                                        // Fallback if no identifier found (unlikely)
                                        await update({ force: true });
                                        window.location.href = '/';
                                    }

                                } catch (e) {
                                    console.error("Session setup failed", e);
                                    // Fallback redirect
                                    window.location.href = '/';
                                }

                            } else {
                                addToast(result.message || 'Błąd.', 'error');
                                setIsSubmitting(false);
                            }
                        }}
                        initialData={formData}
                        isSubmitting={isSubmitting}
                    />
                )}
            </AnimatePresence>

            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mt-8">
                {[1, 2, 3].map(step => (
                    <div
                        key={step}
                        className={`h-1 rounded-full transition-all duration-300 ${step === currentStep ? 'w-8 bg-pink-500' : 'w-2 bg-white/20'}`}
                    />
                ))}
            </div>
        </div>
    </div>
  );
}

// --- Step Components ---

function Step1({ onNext, initialData }: { onNext: (data: any) => void, initialData: any }) {
    const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isValid },
    } = useForm<z.infer<typeof Step1Schema>>({
        resolver: zodResolver(Step1Schema),
        defaultValues: {
            newPassword: initialData.newPassword || '',
            newPasswordConfirm: initialData.newPasswordConfirm || ''
        },
        mode: 'onChange'
    });

    const watchedPassword = watch('newPassword');

    useEffect(() => {
        if (!watchedPassword) { setPasswordStrength('weak'); return; }
        let score = 0;
        if (watchedPassword.length >= 8) score++;
        if (/[A-Z]/.test(watchedPassword)) score++;
        if (/[0-9]/.test(watchedPassword)) score++;
        if (watchedPassword.length >= 12) score++;
        if (score <= 2) setPasswordStrength('weak');
        else if (score === 3) setPasswordStrength('medium');
        else setPasswordStrength('strong');
    }, [watchedPassword]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
             <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 border border-white/10 text-pink-500">
                    <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Bezpieczeństwo</h2>
                <p className="text-white/60 text-sm">
                    Do logowania będziesz używać adresu email, na który założono konto. Ustal teraz nowe, bezpieczne hasło.
                </p>
            </div>

            <form onSubmit={handleSubmit(onNext)} className="space-y-6">
                 <div className="space-y-2">
                    <div className="relative">
                        <Input
                            type="password"
                            {...register('newPassword')}
                            className={`bg-black/40 border-white/10 text-white h-14 px-4 text-lg rounded-xl focus:border-pink-500 focus:ring-0 transition-all ${errors.newPassword ? 'border-red-500' : ''}`}
                            placeholder="Nowe hasło"
                        />
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
                             <div className={`w-2 h-2 rounded-full transition-colors ${watchedPassword ? (passwordStrength === 'weak' ? 'bg-red-500' : (passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500')) : 'bg-white/10'}`} />
                        </div>
                    </div>

                    {/* Visual Strength Bar */}
                    <div className="flex gap-1 h-1 px-1 opacity-70">
                        <div className={`flex-1 rounded-full transition-all duration-500 ${watchedPassword && ['weak','medium','strong'].includes(passwordStrength) ? (passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-white/10'}`}></div>
                        <div className={`flex-1 rounded-full transition-all duration-500 ${watchedPassword && ['medium','strong'].includes(passwordStrength) ? (passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-white/10'}`}></div>
                        <div className={`flex-1 rounded-full transition-all duration-500 ${watchedPassword && ['strong'].includes(passwordStrength) ? 'bg-green-500' : 'bg-white/10'}`}></div>
                    </div>
                    {errors.newPassword && <p className="text-xs text-red-400 pl-1">{errors.newPassword.message}</p>}
                </div>

                <div className="space-y-2">
                    <Input
                        type="password"
                        {...register('newPasswordConfirm')}
                        className={`bg-black/40 border-white/10 text-white h-14 px-4 text-lg rounded-xl focus:border-pink-500 focus:ring-0 transition-all ${errors.newPasswordConfirm ? 'border-red-500' : ''}`}
                        placeholder="Potwierdź hasło"
                    />
                    {errors.newPasswordConfirm && <p className="text-xs text-red-400 pl-1">{errors.newPasswordConfirm.message}</p>}
                </div>

                <Button
                    type="submit"
                    disabled={!isValid}
                    className="w-full h-14 bg-white text-black hover:bg-gray-200 font-bold text-lg rounded-xl flex items-center justify-center gap-2 group"
                >
                    Dalej <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </Button>
            </form>
        </motion.div>
    );
}


function Step2({
    onNext, initialData, displayNameAvailable, setDisplayNameAvailable, isCheckingName, setIsCheckingName
}: {
    onNext: (data: any) => void, initialData: any,
    displayNameAvailable: boolean | null, setDisplayNameAvailable: any,
    isCheckingName: boolean, setIsCheckingName: any
}) {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isValid },
    } = useForm<z.infer<typeof Step2Schema>>({
        resolver: zodResolver(Step2Schema),
        defaultValues: { displayName: initialData.displayName || '' },
        mode: 'onChange'
    });

    const watchedDisplayName = watch('displayName');

    useEffect(() => {
        const checkName = async () => {
            if (!watchedDisplayName || watchedDisplayName.length < 3) {
                setDisplayNameAvailable(null);
                return;
            }
            setIsCheckingName(true);
            try {
                const available = await checkDisplayNameAvailability(watchedDisplayName);
                setDisplayNameAvailable(available);
            } catch (e) {
                setDisplayNameAvailable(null);
            } finally {
                setIsCheckingName(false);
            }
        };
        const timer = setTimeout(checkName, 500);
        return () => clearTimeout(timer);
    }, [watchedDisplayName, setDisplayNameAvailable, setIsCheckingName]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
             <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 border border-white/10 text-pink-500">
                    <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Tożsamość</h2>
                <p className="text-white/60 text-sm">
                    Nazwa użytkownika jest tylko wyświetlana w aplikacji. Możesz wpisać co chcesz.
                </p>
            </div>

            <form onSubmit={handleSubmit(onNext)} className="space-y-8">
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-white/30 pl-1">Twoja ksywka</label>
                    <div className="relative">
                        <Input
                            type="text"
                            {...register('displayName')}
                            className={`bg-black/40 border-white/10 text-white h-14 px-4 text-lg rounded-xl pr-12 focus:border-pink-500 focus:ring-0 transition-all ${displayNameAvailable === false ? 'border-red-500' : (displayNameAvailable === true ? 'border-green-500' : '')}`}
                            placeholder="Np. PolutekMaster"
                            autoComplete="off"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {isCheckingName ? (
                                <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
                            ) : displayNameAvailable === true ? (
                                <Check className="w-5 h-5 text-green-500" />
                            ) : displayNameAvailable === false ? (
                                <X className="w-5 h-5 text-red-500" />
                            ) : null}
                        </div>
                    </div>
                    {errors.displayName ? (
                        <p className="text-xs text-red-400 pl-1">{errors.displayName.message}</p>
                    ) : displayNameAvailable === false ? (
                        <p className="text-xs text-red-400 pl-1">Ta nazwa jest już zajęta.</p>
                    ) : null}
                </div>

                <Button
                    type="submit"
                    disabled={!isValid || displayNameAvailable === false || isCheckingName}
                    className="w-full h-14 bg-white text-black hover:bg-gray-200 font-bold text-lg rounded-xl flex items-center justify-center gap-2 group"
                >
                    Dalej <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </Button>
            </form>
        </motion.div>
    );
}

function Step3({ onNext, initialData, isSubmitting }: { onNext: (data: any) => void, initialData: any, isSubmitting: boolean }) {
    const [emailConsent, setEmailConsent] = useState(initialData.emailConsent || false);
    const [emailLanguage, setEmailLanguage] = useState(initialData.emailLanguage || 'pl');

    const handleEnter = () => {
        onNext({ emailConsent, emailLanguage });
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
             <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 border border-white/10 text-pink-500">
                    <Mail size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Kontakt</h2>
                <p className="text-white/60 text-sm">
                    Czy chcesz otrzymywać powiadomienia o nowościach i statusie konta na maila?
                </p>
            </div>

            <div className="space-y-8">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                    <span className="font-medium">Zgoda na mailing</span>
                    <ToggleSwitch isActive={emailConsent} onToggle={() => setEmailConsent(!emailConsent)} />
                </div>

                <AnimatePresence>
                    {emailConsent && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <label className="text-xs uppercase font-bold text-white/30 pl-1 mb-2 block">Język wiadomości</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEmailLanguage('pl')}
                                    className={`flex-1 h-12 rounded-xl border font-bold transition-all ${emailLanguage === 'pl' ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'bg-black/20 border-white/10 text-white/40 hover:bg-white/5'}`}
                                >
                                    Polski 🇵🇱
                                </button>
                                <button
                                    onClick={() => setEmailLanguage('en')}
                                    className={`flex-1 h-12 rounded-xl border font-bold transition-all ${emailLanguage === 'en' ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'bg-black/20 border-white/10 text-white/40 hover:bg-white/5'}`}
                                >
                                    English 🇬🇧
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Button
                    onClick={handleEnter}
                    disabled={isSubmitting}
                    className="w-full h-16 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-2xl tracking-widest rounded-xl shadow-lg shadow-pink-900/30 active:scale-[0.98] transition-all"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'ENTER'}
                </Button>
            </div>
        </motion.div>
    );
}

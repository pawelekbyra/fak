"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkDisplayNameAvailability, completeFirstLoginSetup } from '@/lib/setup-actions';
import { Loader2, Check, X, ShieldCheck } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Schema duplication for client-side feedback (matching server-side)
const PasswordSchema = z.string()
  .min(8, 'Hasło musi mieć min. 8 znaków')
  .regex(/[A-Z]/, 'Wymagana duża litera')
  .regex(/[0-9]/, 'Wymagana cyfra');

const SetupSchema = z.object({
  newPassword: PasswordSchema,
  newPasswordConfirm: z.string(),
  displayName: z.string().min(3, 'Min. 3 znaki').max(30, 'Max. 30 znaków'),
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: "Hasła muszą być identyczne",
  path: ["newPasswordConfirm"],
});

type SetupFormValues = z.infer<typeof SetupSchema>;

export default function SetupPage() {
  const { user, setUser } = useUser();
  const { addToast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayNameAvailable, setDisplayNameAvailable] = useState<boolean | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);

  // Password Strength Visuals
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(SetupSchema),
    mode: 'onChange'
  });

  const watchedPassword = watch('newPassword');
  const watchedDisplayName = watch('displayName');

  // Check Password Strength
  useEffect(() => {
    if (!watchedPassword) {
      setPasswordStrength('weak');
      return;
    }
    let score = 0;
    if (watchedPassword.length >= 8) score++;
    if (/[A-Z]/.test(watchedPassword)) score++;
    if (/[0-9]/.test(watchedPassword)) score++;
    if (watchedPassword.length >= 12) score++;

    if (score <= 2) setPasswordStrength('weak');
    else if (score === 3) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  }, [watchedPassword]);

  // Debounce Display Name Check
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
  }, [watchedDisplayName]);

  const onSubmit = async (data: SetupFormValues) => {
    if (displayNameAvailable === false) return;

    setIsSubmitting(true);
    const result = await completeFirstLoginSetup(data);

    if (result.success) {
      addToast(result.message || 'Konfiguracja zakończona!', 'success');
      // Update local user context to update flags
      if (user) {
        setUser({ ...user, isFirstLogin: false, displayName: data.displayName });
      }
      // Navigate to home which will now be accessible
      window.location.href = '/';
    } else {
      addToast(result.message || 'Błąd konfiguracji.', 'error');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black p-4 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md relative z-10"
        >
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-6 border border-white/10 shadow-lg shadow-pink-500/20">
                    <ShieldCheck className="w-8 h-8 text-pink-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">Witaj w Polutek!</h1>
                    <p className="text-white/60 leading-relaxed">
                    Zalogowałeś/aś się po raz pierwszy. Dla bezpieczeństwa ustaw nowe hasło i wybierz unikalną nazwę wyświetlaną.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Password Fields */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider font-semibold text-white/50 ml-1">Nowe Hasło</label>
                            <div className="relative">
                                <Input
                                    type="password"
                                    {...register('newPassword')}
                                    className={`bg-black/40 border-white/10 text-white h-12 pr-10 ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : 'focus:border-pink-500 focus:ring-pink-500'}`}
                                    placeholder="Min. 8 znaków, duża litera, cyfra"
                                />
                                {/* Strength Indicator Dot */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                                    <div className={`w-2 h-2 rounded-full transition-colors ${watchedPassword ? (passwordStrength === 'weak' ? 'bg-red-500' : (passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500')) : 'bg-white/20'}`} />
                                </div>
                            </div>
                            {errors.newPassword && <p className="text-xs text-red-400 ml-1">{errors.newPassword.message}</p>}

                            {/* Visual Strength Bar */}
                            <div className="flex gap-1 h-1 mt-1 px-1">
                                <div className={`flex-1 rounded-full transition-all duration-300 ${watchedPassword && ['weak','medium','strong'].includes(passwordStrength) ? (passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-white/5'}`}></div>
                                <div className={`flex-1 rounded-full transition-all duration-300 ${watchedPassword && ['medium','strong'].includes(passwordStrength) ? (passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-white/5'}`}></div>
                                <div className={`flex-1 rounded-full transition-all duration-300 ${watchedPassword && ['strong'].includes(passwordStrength) ? 'bg-green-500' : 'bg-white/5'}`}></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider font-semibold text-white/50 ml-1">Potwierdź Hasło</label>
                            <Input
                                type="password"
                                {...register('newPasswordConfirm')}
                                className={`bg-black/40 border-white/10 text-white h-12 ${errors.newPasswordConfirm ? 'border-red-500 focus:ring-red-500' : 'focus:border-pink-500 focus:ring-pink-500'}`}
                                placeholder="Powtórz nowe hasło"
                            />
                            {errors.newPasswordConfirm && <p className="text-xs text-red-400 ml-1">{errors.newPasswordConfirm.message}</p>}
                        </div>
                    </div>

                    {/* Display Name Field */}
                    <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider font-semibold text-white/50 ml-1">Nazwa Wyświetlana</label>
                    <div className="relative">
                        <Input
                        type="text"
                        {...register('displayName')}
                        className={`bg-black/40 border-white/10 text-white h-12 pr-10 ${displayNameAvailable === false ? 'border-red-500' : (displayNameAvailable === true ? 'border-green-500' : '')}`}
                        placeholder="Np. JanKowalski"
                        autoComplete="off"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingName ? (
                            <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                        ) : displayNameAvailable === true ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : displayNameAvailable === false ? (
                            <X className="w-4 h-4 text-red-500" />
                        ) : null}
                        </div>
                    </div>

                    {errors.displayName ? (
                        <p className="text-xs text-red-400 ml-1">{errors.displayName.message}</p>
                    ) : displayNameAvailable === false ? (
                        <p className="text-xs text-red-400 ml-1">Nazwa zajęta.</p>
                    ) : (
                        <p className="text-[10px] text-white/30 ml-1">
                        Służy tylko do wyświetlania w aplikacji. Loginem pozostaje email.
                        </p>
                    )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-6 rounded-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-900/20 active:scale-[0.98] transition-all"
                        disabled={!isValid || isSubmitting || displayNameAvailable === false || isCheckingName}
                    >
                    {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Zapisywanie...</>
                    ) : (
                        'Zapisz i Przejdź do Aplikacji'
                    )}
                    </Button>

                </form>
            </div>
            <div className="text-center mt-6">
                <p className="text-xs text-white/20">Polutek © 2024</p>
            </div>
        </motion.div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkDisplayNameAvailability, completeFirstLoginSetup } from '@/lib/setup-actions';
import { Loader2, Check, X, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { motion } from 'framer-motion';

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

export default function FirstLoginSetupModal() {
  const { user, setUser } = useUser();
  const { addToast } = useToast();
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
    trigger
  } = useForm<SetupFormValues>({
    resolver: zodResolver(SetupSchema),
    mode: 'onChange'
  });

  const watchedPassword = watch('newPassword');
  const watchedDisplayName = watch('displayName');

  useEffect(() => {
    console.log('User status in FirstLoginSetupModal:', user);

    // Kluczowy warunek:
    if (user && user.isLoggedIn && user.isFirstLogin) {
      console.log('WARUNEK SPEŁNIONY: Pokazuję modal pierwszego logowania.');
    } else {
      console.log('WARUNEK NIESPEŁNIONY: isFirstLogin jest FAŁSZ lub brakuje obiektu user.');
    }
  }, [user]);

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
      // Update local user context to remove the modal immediately
      if (user) {
        setUser({ ...user, isFirstLogin: false, displayName: data.displayName });
      }
      // window.location.reload(); // Hard reload to ensure all states are clean? Or rely on setUser
    } else {
      addToast(result.message || 'Błąd konfiguracji.', 'error');
    }
    setIsSubmitting(false);
  };

  // If user is not logged in or not first login, don't render (double check)
  // But this component should be conditionally rendered by parent anyway.
  if (!user?.isFirstLogin) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 mb-4 border border-gray-700">
               <ShieldCheck className="w-6 h-6 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Witaj! Zakończ Konfigurację</h2>
            <p className="text-sm text-gray-400">
              Zalogowałeś/aś się po raz pierwszy. Dla bezpieczeństwa ustaw nowe hasło i wybierz unikalną nazwę wyświetlaną.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Password Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300 ml-1">Nowe Hasło</label>
                <div className="relative">
                    <Input
                      type="password"
                      {...register('newPassword')}
                      className={`bg-gray-800/50 border-gray-700 text-white pr-10 ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : 'focus:border-pink-500 focus:ring-pink-500'}`}
                      placeholder="Min. 8 znaków, duża litera, cyfra"
                    />
                    {/* Strength Indicator Dot */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                         <div className={`w-2 h-2 rounded-full transition-colors ${watchedPassword ? (passwordStrength === 'weak' ? 'bg-red-500' : (passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500')) : 'bg-gray-600'}`} />
                    </div>
                </div>
                {errors.newPassword && <p className="text-xs text-red-400 ml-1">{errors.newPassword.message}</p>}

                {/* Visual Strength Bar (Optional but nice) */}
                {watchedPassword && (
                    <div className="flex gap-1 h-1 mt-1 px-1">
                        <div className={`flex-1 rounded-full ${['weak','medium','strong'].includes(passwordStrength) ? (passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-700'}`}></div>
                        <div className={`flex-1 rounded-full ${['medium','strong'].includes(passwordStrength) ? (passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-700'}`}></div>
                        <div className={`flex-1 rounded-full ${['strong'].includes(passwordStrength) ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                    </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300 ml-1">Potwierdź Hasło</label>
                <Input
                  type="password"
                  {...register('newPasswordConfirm')}
                  className={`bg-gray-800/50 border-gray-700 text-white ${errors.newPasswordConfirm ? 'border-red-500 focus:ring-red-500' : 'focus:border-pink-500 focus:ring-pink-500'}`}
                  placeholder="Powtórz nowe hasło"
                />
                {errors.newPasswordConfirm && <p className="text-xs text-red-400 ml-1">{errors.newPasswordConfirm.message}</p>}
              </div>
            </div>

            {/* Display Name Field */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300 ml-1">Nazwa Wyświetlana</label>
              <div className="relative">
                <Input
                  type="text"
                  {...register('displayName')}
                  className={`bg-gray-800/50 border-gray-700 text-white pr-10 ${displayNameAvailable === false ? 'border-red-500' : (displayNameAvailable === true ? 'border-green-500' : '')}`}
                  placeholder="Np. JanKowalski"
                  autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingName ? (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
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
                <p className="text-[10px] text-gray-500 ml-1">
                   Służy tylko do wyświetlania w aplikacji. Loginem pozostaje email.
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-gray-200 font-bold py-6 rounded-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </motion.div>
    </div>
  );
}

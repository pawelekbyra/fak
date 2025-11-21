"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { changePassword } from '@/lib/actions';
import { useToast } from '@/context/ToastContext';

const PasswordTab: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = newPassword === confirmPassword;
  const isValidLength = newPassword.length >= 6;
  const isFormValid = passwordsMatch && isValidLength && newPassword.length > 0;

  useEffect(() => {
      if (confirmPassword && !passwordsMatch) {
          setError(t('passwordsDoNotMatch') || 'Passwords do not match');
      } else if (newPassword && !isValidLength) {
          setError(t('passwordMinLength') || 'Password must be at least 6 characters');
      } else {
          setError(null);
      }
  }, [newPassword, confirmPassword, passwordsMatch, isValidLength, t]);

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid) return;

    setIsSaving(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await changePassword(null, formData);

      if (result.success) {
        addToast(result.message || t('passwordChangeSuccess'), 'success');
        (event.target as HTMLFormElement).reset();
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(result.message || t('passwordChangeError'));
      }
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="tab-pane active p-4" id="password-tab">
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="text-lg font-bold mb-5 flex items-center gap-3 text-white">
            <span className="w-1 h-6 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></span>
            {t('changePasswordTitle')}
        </h3>
        <form id="passwordForm" onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 ml-1">{t('currentPasswordLabel')}</label>
            <Input
                type="password"
                name="currentPassword"
                placeholder={t('currentPasswordPlaceholder')}
                required
                autoComplete="current-password"
                className="bg-black/20 border-white/10 text-white focus:border-pink-500/50 focus:bg-black/40 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 ml-1">{t('newPasswordLabel')}</label>
            <Input
                type="password"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                required
                autoComplete="new-password"
                className="bg-black/20 border-white/10 text-white focus:border-pink-500/50 focus:bg-black/40 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 ml-1">{t('confirmPasswordLabel')}</label>
            <Input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                required
                autoComplete="new-password"
                className={`bg-black/20 border-white/10 text-white focus:bg-black/40 transition-all ${confirmPassword && !passwordsMatch ? 'border-red-500 focus:border-red-500' : 'focus:border-pink-500/50'}`}
            />
            {error && (
                <p className="text-xs text-red-400 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
            {!error && (
                <p className="text-xs text-white/50 mt-1 ml-1">
                  {t('passwordMinLength')}
                </p>
            )}
          </div>

          <div className="pt-4">
            <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-pink-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving || !isFormValid}
            >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSaving ? t('changingPassword') : t('changePasswordButton')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordTab;

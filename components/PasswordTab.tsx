"use client";

import React, { useState } from 'react';
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

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await changePassword(null, formData);

      if (result.success) {
        addToast(result.message || t('passwordChangeSuccess'), 'success');
        (event.target as HTMLFormElement).reset();
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
    <div className="tab-pane active p-4 max-w-md mx-auto" id="password-tab">
      <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-inner space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight mb-2 flex items-center gap-2">
            {t('changePasswordTitle')}
        </h3>
        <form id="passwordForm" onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider pl-1">{t('currentPasswordLabel')}</label>
            <Input
                type="password"
                name="currentPassword"
                placeholder={t('currentPasswordPlaceholder')}
                required
                autoComplete="current-password"
                className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-pink-500/50 focus:ring-pink-500/20 transition-all h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider pl-1">{t('newPasswordLabel')}</label>
            <Input
                type="password"
                name="newPassword"
                placeholder={t('newPasswordPlaceholder')}
                required
                autoComplete="new-password"
                className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-pink-500/50 focus:ring-pink-500/20 transition-all h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider pl-1">{t('confirmPasswordLabel')}</label>
            <Input
                type="password"
                name="confirmPassword"
                placeholder={t('confirmPasswordPlaceholder')}
                required
                autoComplete="new-password"
                className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-pink-500/50 focus:ring-pink-500/20 transition-all h-11 rounded-xl"
            />
            <p className="text-[10px] text-white/40 pl-1">
              {t('passwordMinLength')}
            </p>
          </div>
          <Button
            type="submit"
            className="w-full bg-pink-600 hover:bg-pink-700 active:scale-95 transition-all h-12 text-base font-semibold rounded-xl shadow-lg shadow-pink-900/20 mt-4"
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? t('changingPassword') : t('changePasswordButton')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PasswordTab;

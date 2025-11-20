"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useTranslation } from '@/context/LanguageContext';
import { deleteAccount } from '@/lib/actions';
import { useToast } from '@/context/ToastContext';

interface DeleteTabProps {
    onClose?: () => void;
}

const DeleteTab: React.FC<DeleteTabProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const DELETE_CONFIRM_TEXT = t('deleteAccountConfirmText');

  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { logout } = useUser();

  const handleDeleteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmation !== DELETE_CONFIRM_TEXT) {
      setStatus({ type: 'error', message: t('deleteAccountConfirmError') });
      addToast(t('deleteAccountConfirmError'), 'error');
      return;
    }

    setIsSaving(true);
    setStatus(null);

    const formData = new FormData(event.currentTarget);
    // Ensure the key matches what the server action expects ('confirm_text')
    // The input has name="confirm_text", so formData already contains it.
    // But we append it manually just in case or if logic required it (redundant but safe).
    if (!formData.get('confirm_text')) {
         formData.append('confirm_text', confirmation);
    }

    try {
      const result = await deleteAccount(null, formData);

      if (result.success) {
        setStatus({ type: 'success', message: result.message });
        addToast(result.message, 'success');

        // Smooth transition: wait a bit, then logout and close
        setTimeout(() => {
          logout();
          if (onClose) onClose();
        }, 2000);
      } else {
        throw new Error(result.message || t('deleteAccountError'));
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message });
      addToast(error.message || t('deleteAccountError'), 'error');
      setIsSaving(false);
    }
  };

  return (
    <div className="tab-pane active p-4" id="delete-tab">
      <div className="profile-section bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="section-title text-lg font-bold mb-5 flex items-center gap-3"><span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></span>{t('deleteAccountTitle')}</h3>
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
          <h4 className="text-red-400 font-bold mb-3 text-base">{t('warningTitle')}</h4>
          <p className="text-white/80 text-sm leading-relaxed">
            {t('deleteAccountWarning')}
          </p>
        </div>
        <form id="deleteForm" onSubmit={handleDeleteSubmit}>
          <div className="form-group mb-4">
            <label className="form-label text-sm font-medium mb-2 block">{t('deleteAccountPrompt')} <strong>{DELETE_CONFIRM_TEXT}</strong></label>
            <Input
              type="text"
              placeholder={DELETE_CONFIRM_TEXT}
              id="deleteConfirmation"
              name="confirm_text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
            <p className="text-xs text-white/60 mt-2">
              {t('deleteAccountInfo')}
            </p>
          </div>
          <Button
            type="submit"
            variant="destructive"
            className="w-full mt-4"
            disabled={confirmation !== DELETE_CONFIRM_TEXT || isSaving}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? t('deleting') : t('deleteAccountButton')}
          </Button>
          {status && (
            <div className={`mt-4 text-sm p-3 rounded-md ${status.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {status.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default DeleteTab;

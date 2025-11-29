"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { deleteAccount } from '@/lib/actions';

interface DeleteTabProps {
  onClose?: () => void;
}

const DeleteTab: React.FC<DeleteTabProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const DELETE_CONFIRM_TEXT = t('deleteAccountConfirmText');

  const [confirmation, setConfirmation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { logout } = useUser();

  const handleDeleteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmation.trim() !== DELETE_CONFIRM_TEXT) {
      addToast(t('deleteAccountConfirmError'), 'error');
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append('confirm_text', confirmation);

    try {
      const result = await deleteAccount(null, formData);

      if (result.success) {
        addToast(result.message || 'Twoje konto zostało usunięte. Zostałeś wylogowany.', 'success');
        setTimeout(() => {
          logout();
          if (onClose) onClose();
        }, 2000);
      } else {
        throw new Error(result.message || t('deleteAccountError'));
      }
    } catch (error: any) {
      addToast(error.message, 'error');
      setIsSaving(false);
    }
  };

  return (
    <div className="tab-pane active p-4" id="delete-tab">
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="text-lg font-bold mb-5 flex items-center gap-3 text-white">
            <span className="w-1 h-6 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></span>
            {t('deleteAccountTitle')}
        </h3>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6">
          <h4 className="text-red-400 font-bold mb-2 text-base flex items-center gap-2">
              ⚠️ {t('warningTitle')}
          </h4>
          <p className="text-white/70 text-sm leading-relaxed">
            {t('deleteAccountWarning')}
          </p>
        </div>

        <form id="deleteForm" onSubmit={handleDeleteSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 ml-1">
                {t('deleteAccountPrompt')} <strong className="text-white">{DELETE_CONFIRM_TEXT}</strong>
            </label>
            <Input
              type="text"
              placeholder={DELETE_CONFIRM_TEXT}
              id="deleteConfirmation"
              name="confirm_text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="bg-black/20 border-white/10 text-white focus:border-red-500/50 focus:bg-black/40 transition-all"
            />
            <p className="text-xs text-white/50 mt-1 ml-1">
              {t('deleteAccountInfo')}
            </p>
          </div>

          <div className="pt-4">
              <Button
                type="submit"
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-red-900/20 active:scale-[0.98] transition-all"
                disabled={confirmation !== DELETE_CONFIRM_TEXT || isSaving}
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSaving ? t('deleting') : t('deleteAccountButton')}
              </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteTab;

"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
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
    if (confirmation !== DELETE_CONFIRM_TEXT) {
      addToast(t('deleteAccountConfirmError'), 'error');
      return;
    }

    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    // We need to append the confirmation text manually if the input doesn't have a name matching what the action expects,
    // but we can just give the input the name 'confirm_text'.
    formData.append('confirm_text', confirmation);

    try {
      const result = await deleteAccount(null, formData);

      if (result.success) {
        addToast(result.message, 'success');
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
    <div className="tab-pane active p-4 max-w-md mx-auto" id="delete-tab">
      <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-inner space-y-6">

        <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                 <AlertTriangle size={20} />
             </div>
             <h3 className="text-lg font-bold text-white tracking-tight">{t('deleteAccountTitle')}</h3>
        </div>

        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <h4 className="text-red-400 font-bold mb-2 text-sm">{t('warningTitle')}</h4>
          <p className="text-red-200/60 text-xs leading-relaxed">
            {t('deleteAccountWarning')}
          </p>
        </div>

        <form id="deleteForm" onSubmit={handleDeleteSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider pl-1">
                {t('deleteAccountPrompt')} <strong className="text-white select-all">{DELETE_CONFIRM_TEXT}</strong>
            </label>
            <Input
              type="text"
              placeholder={DELETE_CONFIRM_TEXT}
              id="deleteConfirmation"
              name="confirm_text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-red-500/50 focus:ring-red-500/20 transition-all h-11 rounded-xl"
            />
            <p className="text-[10px] text-white/40 pl-1">
              {t('deleteAccountInfo')}
            </p>
          </div>
          <Button
            type="submit"
            variant="destructive"
            className="w-full mt-2 bg-red-600 hover:bg-red-700 active:scale-95 transition-all h-12 text-base font-semibold rounded-xl shadow-lg shadow-red-900/20"
            disabled={confirmation !== DELETE_CONFIRM_TEXT || isSaving}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? t('deleting') : t('deleteAccountButton')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DeleteTab;

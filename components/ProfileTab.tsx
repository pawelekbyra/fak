"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Crown, Edit2, Camera } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { updateUserProfile } from '@/lib/actions';
import { cn } from '@/lib/utils';
import ToggleSwitch from './ui/ToggleSwitch';

interface ProfileTabProps {
    onClose: () => void;
}

const initialState = {
  success: false,
  message: '',
};

const ProfileTab: React.FC<ProfileTabProps> = ({ onClose }) => {
  const { user: profile, checkUserStatus } = useUser();
  const { t } = useTranslation();
  const { addToast } = useToast();

  // Hydrate local state from profile
  const [emailConsent, setEmailConsent] = useState(profile?.emailConsent || false);
  const [language, setLanguage] = useState(profile?.emailLanguage || 'pl');

  // useFormState hook for server action
  const [state, formAction] = useFormState(updateUserProfile, initialState);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when profile changes (e.g., after save and re-fetch)
  useEffect(() => {
      if (profile) {
          setEmailConsent(profile.emailConsent || false);
          setLanguage(profile.emailLanguage || 'pl');
      }
  }, [profile]);

  // Handle state updates from server action
  useEffect(() => {
    if (state.message) {
      if (state.success) {
        addToast(state.message, 'success');
        checkUserStatus(); // Refresh user data context
      } else {
        addToast(state.message, 'error');
      }
    }
  }, [state, addToast, checkUserStatus]);

  const handleAvatarEditClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  if (!profile) {
    return <div className="p-5 text-center text-white/50">{t('loadingProfile')}</div>;
  }

  const currentAvatar = previewUrl || profile.avatar;

  return (
    <div className="tab-pane active p-4 max-w-md mx-auto" id="profile-tab">
      {/* Main Form wraps everything */}
      <form action={formAction} id="profileForm" className="space-y-6">

        {/* Avatar Section */}
        <div className="flex flex-col items-center text-center relative z-10">
            <div className="relative w-24 h-24 mb-4 group cursor-pointer" onClick={handleAvatarEditClick}>
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/10 shadow-xl bg-zinc-900 flex items-center justify-center transition-all group-hover:border-pink-500/50">
                    {currentAvatar ? (
                        <Image
                          src={currentAvatar}
                          alt={t('avatarAlt')}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          id="userAvatar"
                          unoptimized={!!previewUrl} // unoptimized for blob urls
                        />
                    ) : (
                        <span className="text-4xl text-zinc-500 font-bold">{profile.displayName?.charAt(0).toUpperCase()}</span>
                    )}
                </div>

                <div className="absolute bottom-0 right-0 bg-pink-600 rounded-full p-1.5 border-4 border-[#121212] shadow-sm text-white">
                     <Camera size={14} />
                </div>

                {/* File Input inside the form */}
                <input
                    type="file"
                    name="avatar"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />
            </div>

            <div className="flex flex-col items-center gap-1">
                <h3 className="text-xl font-bold text-white tracking-tight" id="displayName">{profile.displayName}</h3>
                <p className="text-sm text-white/40 font-medium" id="userEmail">{profile.email}</p>

                {profile.role === 'patron' && (
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 px-3 py-0.5 rounded-full text-xs font-bold mt-2">
                        <Crown size={12} />
                        <span>{t('patronTier')}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Combined Form Fields */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-5 space-y-5 shadow-inner">

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider pl-1">{t('displayName') || 'Display Name'}</label>
              <div className="relative">
                  <Input
                    type="text"
                    name="displayName"
                    defaultValue={profile.displayName || ''}
                    placeholder={t('displayNamePlaceholder') || 'Your Name'}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-pink-500/50 focus:ring-pink-500/20 transition-all h-11 rounded-xl"
                  />
                  <Edit2 className="absolute right-3 top-1/2 -translate-y-1/2 text-white/10 pointer-events-none" size={14} />
              </div>
            </div>

            {/* Email (Read only for now mostly, but editable here) */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider pl-1">{t('email')}</label>
                <Input
                  type="email"
                  name="email"
                  defaultValue={profile.email}
                  placeholder={t('emailPlaceholder')}
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-pink-500/50 focus:ring-pink-500/20 transition-all h-11 rounded-xl"
                />
            </div>

            {/* Separator */}
            <div className="h-px bg-white/5 my-2" />

            {/* Email Consent */}
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                  <label className="text-sm font-medium text-white">{t('emailConsent')}</label>
                  <p className="text-xs text-white/40 pr-4">Receive updates and notifications via email.</p>
              </div>
              <ToggleSwitch
                isActive={emailConsent}
                onToggle={() => setEmailConsent(prev => !prev)}
              />
              {/* Hidden input to submit the state */}
              <input type="hidden" name="emailConsent" value={emailConsent.toString()} />
            </div>

            {/* Language Selector (Conditional) */}
            {emailConsent && (
                <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider pl-1">{t('emailLanguage')}</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setLanguage('pl')}
                            className={cn(
                                "h-10 rounded-xl text-sm font-medium border transition-all",
                                language === 'pl'
                                    ? "bg-pink-500/10 border-pink-500 text-pink-400"
                                    : "bg-black/20 border-white/5 text-white/40 hover:bg-white/5"
                            )}
                        >
                            🇵🇱 {t('polish')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setLanguage('en')}
                            className={cn(
                                "h-10 rounded-xl text-sm font-medium border transition-all",
                                language === 'en'
                                    ? "bg-pink-500/10 border-pink-500 text-pink-400"
                                    : "bg-black/20 border-white/5 text-white/40 hover:bg-white/5"
                            )}
                        >
                            🇬🇧 {t('english')}
                        </button>
                        {/* Hidden input to submit the selected language */}
                        <input type="hidden" name="emailLanguage" value={language} />
                    </div>
                </div>
            )}
        </div>

        <SaveButton t={t} />
      </form>
    </div>
  );
};

// Component for the submit button to handle pending state
function SaveButton({ t }: { t: any }) {
  const { pending } = useFormStatus();
  return (
    <Button
        type="submit"
        className="w-full bg-pink-600 hover:bg-pink-700 active:scale-95 transition-all h-12 text-base font-semibold rounded-xl shadow-lg shadow-pink-900/20"
        disabled={pending}
    >
      {pending ? (
          <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              {t('saving')}
          </div>
      ) : t('saveChanges')}
    </Button>
  );
}

export default ProfileTab;

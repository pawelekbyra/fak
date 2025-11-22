"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ToggleSwitch from './ui/ToggleSwitch';
import { Crown, Pencil, Camera } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { updateUserProfile } from '@/lib/actions';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';
import CropModal from './CropModal';
import { UserBadge } from './UserBadge';

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

  // State for fields
  const [emailConsent, setEmailConsent] = useState(false);
  const [emailLanguage, setEmailLanguage] = useState('pl');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isCropOpen, setIsCropOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);

  // Initialize state from profile when available
  useEffect(() => {
    if (profile) {
      // No need to cast to any, as User interface in lib/db.interfaces.ts now includes these fields
      if (profile.emailConsent !== undefined) setEmailConsent(profile.emailConsent);
      if (profile.emailLanguage) setEmailLanguage(profile.emailLanguage);
    }
  }, [profile]);

  // useFormState hook for server action
  const [state, formAction] = useFormState(updateUserProfile, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImage(e.target.result as string);
          setIsCropOpen(true);
        }
      };
      reader.readAsDataURL(file);
      // Reset input so the same file can be selected again
      event.target.value = '';
    }
  };

  const handleCropSave = (croppedBlob: Blob | null) => {
    if (croppedBlob) {
      const file = new File([croppedBlob], 'avatar.png', { type: 'image/png' });
      setCroppedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
    setIsCropOpen(false);
  };

  const handleSubmit = (formData: FormData) => {
    if (croppedFile) {
      formData.set('avatar', croppedFile);
    }
    formAction(formData);
  };

  if (!profile) {
    return <div className="p-5 text-center text-white/60">{t('loadingProfile')}</div>;
  }

  const currentAvatar = previewUrl || profile.avatar || DEFAULT_AVATAR_URL;

  return (
    <div className="tab-pane active p-4" id="profile-tab">
      <form action={handleSubmit} id="profileForm" className="space-y-4">

        {/* Avatar Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center text-center">
            <div className="relative w-24 h-24 mb-4 group cursor-pointer" onClick={handleAvatarEditClick}>
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/10 shadow-lg bg-gray-800 flex items-center justify-center relative">
                    <Image
                      src={currentAvatar}
                      alt={t('avatarAlt')}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      id="userAvatar"
                      unoptimized={!!previewUrl}
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Camera className="text-white w-8 h-8" />
                    </div>
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-pink-600 border-2 border-[#2d2d2d] rounded-full text-white flex items-center justify-center hover:bg-pink-500 transition-colors shadow-lg"
                  title={t('changeAvatarTitle')}
                >
                   <Pencil size={14} />
                </button>

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
                <h3 className="text-xl font-bold text-white" id="displayName">{profile.displayName}</h3>
                <UserBadge role={profile.role} className="mb-1" />
                {(profile as any).bio && <p className="text-xs text-white/70 max-w-[240px] text-center">{(profile as any).bio}</p>}
                <p className="text-sm text-white/50" id="userEmail">{profile.email}</p>
            </div>
        </div>

        {/* Combined Form Fields */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-lg font-bold mb-5 flex items-center gap-3 text-white">
            <span className="w-1 h-6 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></span>
            {t('accountSettings')}
          </h3>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">{t('displayName') || 'Display Name'}</label>
              <Input
                type="text"
                name="displayName"
                defaultValue={profile.displayName || ''}
                placeholder={t('displayNamePlaceholder') || 'Your Name'}
                className="bg-black/20 border-white/10 text-white focus:border-pink-500/50 focus:bg-black/40 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">{t('bio') || 'Coś o sobie'}</label>
              <textarea
                name="bio"
                defaultValue={(profile as any).bio || ''}
                placeholder={t('bioPlaceholder') || 'Napisz coś o sobie...'}
                rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-pink-500/50 focus:bg-black/40 focus:outline-none transition-all resize-none placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">{t('email')}</label>
              <Input
                type="email"
                name="email"
                defaultValue={profile.email}
                placeholder={t('emailPlaceholder')}
                className="bg-black/20 border-white/10 text-white focus:border-pink-500/50 focus:bg-black/40 transition-all"
              />
            </div>

            <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-white/90">{t('emailConsent')}</label>
                        <span className="text-xs text-white/50">{t('emailConsentDesc') || 'Receive updates and notifications via email'}</span>
                    </div>
                    <ToggleSwitch isActive={emailConsent} onToggle={() => setEmailConsent(p => !p)} />
                    {/* Hidden input to submit the toggle value */}
                    <input type="hidden" name="emailConsent" value={emailConsent.toString()} />
                </div>

                {emailConsent && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                         <label className="text-sm font-medium text-white/80 ml-1">{t('emailLanguage')}</label>
                         <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setEmailLanguage('pl')}
                                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all border ${
                                    emailLanguage === 'pl'
                                    ? 'bg-pink-600/20 border-pink-500 text-pink-400'
                                    : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'
                                }`}
                            >
                                {t('polish')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setEmailLanguage('en')}
                                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all border ${
                                    emailLanguage === 'en'
                                    ? 'bg-pink-600/20 border-pink-500 text-pink-400'
                                    : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'
                                }`}
                            >
                                {t('english')}
                            </button>
                            <input type="hidden" name="emailLanguage" value={emailLanguage} />
                         </div>
                    </div>
                )}
            </div>
          </div>

          <div className="mt-6">
            <SaveButton t={t} />
          </div>
        </div>
      </form>

      {isCropOpen && (
        <CropModal
          isOpen={isCropOpen}
          onClose={() => setIsCropOpen(false)}
          imageSrc={selectedImage}
          onCropComplete={handleCropSave}
        />
      )}
    </div>
  );
};

function SaveButton({ t }: { t: any }) {
  const { pending } = useFormStatus();
  return (
    <Button
        type="submit"
        className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-pink-900/20 active:scale-[0.98] transition-all"
        disabled={pending}
    >
      {pending ? (
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{t('saving')}</span>
        </div>
      ) : t('saveChanges')}
    </Button>
  );
}

export default ProfileTab;

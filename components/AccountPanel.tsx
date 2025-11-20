"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import ProfileTab from './ProfileTab';
import PasswordTab from './PasswordTab';
import DeleteTab from './DeleteTab';
import { useTranslation } from '@/context/LanguageContext';
import { X, ChevronLeft, Upload, User, Lock, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface AccountPanelProps {
  onClose: () => void;
}

type Tab = 'profile' | 'password' | 'delete';

const AccountPanel: React.FC<AccountPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { t } = useTranslation();
  const { user } = useUser();

  useEffect(() => {
    // If the user logs out while this panel is open, close it automatically.
    if (!user) {
      onClose();
    }
  }, [user, onClose]);

  const handleTabClick = (tab: Tab) => {
      setActiveTab(tab);
  }

  const canPublish = user?.role === 'admin' || user?.role === 'author' || user?.role === 'creator';

  const tabs = [
      { id: 'profile', label: t('profileTab'), icon: User },
      { id: 'password', label: t('passwordTab'), icon: Lock },
      { id: 'delete', label: t('deleteTab'), icon: Trash2 },
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="absolute top-0 left-0 h-full w-full max-w-md bg-[#090909] flex flex-col border-r border-white/5 shadow-2xl"
        initial={{ x: '-100%' }}
        animate={{ x: '0%' }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div
            className="relative flex-shrink-0 flex items-center justify-between px-4 bg-[#121212] border-b border-white/5"
            style={{ height: 'var(--topbar-height, 60px)', paddingTop: 'var(--safe-area-top)'}}
        >
          <h2 className="text-lg font-bold text-white tracking-tight">{t(`${activeTab}Tab`)}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-all active:scale-95"
            aria-label={t('closeAccountAriaLabel')}
          >
              <X size={20} />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex-shrink-0 grid grid-cols-3 p-2 gap-2 bg-[#090909]">
          {tabs.map((tab) => (
             <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as Tab)}
                className={cn(
                    "flex flex-col items-center justify-center py-3 rounded-xl transition-all text-xs font-medium gap-1.5",
                    activeTab === tab.id
                        ? "bg-pink-600/10 text-pink-500"
                        : "bg-zinc-900/50 text-white/40 hover:bg-zinc-900 hover:text-white/60"
                )}
             >
                <tab.icon size={18} />
                {tab.label}
             </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                >
                    {activeTab === 'profile' && <ProfileTab onClose={onClose} />}
                    {activeTab === 'password' && <PasswordTab />}
                    {activeTab === 'delete' && <DeleteTab onClose={onClose} />}
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Bottom Action (Publish) */}
        {canPublish && (
          <div className="p-4 border-t border-white/5 bg-[#121212]">
             <Button
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5 h-12 rounded-xl text-base font-semibold flex items-center gap-2 justify-center active:scale-95 transition-all"
                onClick={() => window.location.href = '/admin/slides'}
             >
                 <Upload size={18} />
                 {t('publishButton')}
             </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AccountPanel;

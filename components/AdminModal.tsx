"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Film, Mail, Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/store/useStore';
import { createUserByAdmin } from '@/lib/admin-actions';
import { cn } from '@/lib/utils';
import UserManagementTable from './UserManagementTable';

export default function AdminModal() {
    const { isAdminModalOpen, closeAdminModal } = useStore();
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'users' | 'slides'>('users');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isAdminModalOpen) return null;

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSubmitting(true);
        try {
            const result = await createUserByAdmin(email);
            if (result.success) {
                addToast(result.message || 'Użytkownik utworzony pomyślnie. Email wysłany.', 'success');
                setEmail('');
            } else {
                addToast(result.message || 'Wystąpił błąd.', 'error');
            }
        } catch (error: any) {
            addToast(error.message || 'Wystąpił błąd.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute inset-0 z-[10300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                className="w-full max-w-2xl bg-[#1c1c1e] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#28282a]">
                    <h2 className="text-xl font-bold text-white tracking-wide">Panel Administratora</h2>
                    <button
                        onClick={closeAdminModal}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-4 gap-4 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            activeTab === 'users'
                                ? "bg-pink-500 text-white"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Users size={16} />
                        Użytkownicy
                    </button>
                    <button
                        onClick={() => setActiveTab('slides')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            activeTab === 'slides'
                                ? "bg-pink-500 text-white"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Film size={16} />
                        Slajdy
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#18181b]">
                    {activeTab === 'users' && (
                        <div className="space-y-8">
                            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                <h3 className="text-lg font-semibold text-white mb-4">Dodaj nowego użytkownika</h3>
                                <p className="text-sm text-white/50 mb-6">
                                    System utworzy konto z tymczasowym hasłem i wyśle instrukcje na podany adres email.
                                </p>
                                <form onSubmit={handleCreateUser} className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-white/70 uppercase">Adres Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="user@example.com"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !email}
                                        className="w-full py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Przetwarzanie...
                                            </>
                                        ) : (
                                            "Utwórz użytkownika"
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* User Management List */}
                            <div className="pt-4 border-t border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Zarządzaj Użytkownikami</h3>
                                <UserManagementTable />
                            </div>
                        </div>
                    )}

                    {activeTab === 'slides' && (
                        <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-4">
                            <Film size={48} strokeWidth={1} className="opacity-50" />
                            <p>Zarządzanie slajdami - w przygotowaniu</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

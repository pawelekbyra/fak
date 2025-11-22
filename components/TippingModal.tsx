"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useUser } from '@/context/UserContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/store/useStore';
import { X, ChevronRight, ChevronLeft, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK!);

const CheckoutForm = ({ clientSecret, onClose }: { clientSecret: string, onClose: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { addToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
        });

        if (error) {
            addToast(error.message || 'Wystąpił błąd', 'error');
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            addToast('Płatność udana!', 'success');
            onClose();
        }
    };

    const { t } = useTranslation();

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-6 min-h-[200px]">
                <PaymentElement options={{ layout: 'tabs' }} />
            </div>
            <button
                disabled={isProcessing || !stripe || !elements}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#34c759] to-[#28a745] shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
                {isProcessing ? (t('processing') || "Przetwarzanie...") : (t('payNow') || "Zapłać teraz")}
            </button>
        </form>
    );
};

const TippingModal = () => {
  const { isLoggedIn, user } = useUser();
  const { addToast } = useToast();
  const { t, lang } = useTranslation();
  const { isTippingModalOpen, closeTippingModal } = useStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    amount: 10,
    currency: 'PLN',
    create_account: false,
    terms_accepted: false,
  });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
        // If logged in, skip step 0 (email) but set email from user
        setFormData(prev => ({ ...prev, email: user?.email || '' }));
        if (currentStep === 0) setCurrentStep(1);
    } else {
        if (!isTippingModalOpen) setCurrentStep(0);
    }
  }, [isLoggedIn, user, isTippingModalOpen]);

  if (!isTippingModalOpen) return null;

  const handleNext = async () => {
    // Step 0: Email validation
    if (currentStep === 0) {
        if (!formData.create_account && !isLoggedIn) {
             // Allowed to proceed without account? Assuming yes for guests if backend handles it,
             // but usually email is needed for Stripe receipt.
             // Let's require email if they want to create account OR if we enforce it.
             // Based on prototype: "Email (opcjonalnie)" often appears, but for "create account" it is mandatory.
        }
        if (formData.create_account) {
            if (!formData.email) {
                addToast(t('errorEmailRequired') || 'Podaj adres email', 'error');
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                addToast(t('errorInvalidEmail') || 'Nieprawidłowy email', 'error');
                return;
            }
        }
        setCurrentStep(1);
    }
    // Step 1: Amount
    else if (currentStep === 1) {
        if (formData.amount <= 0) {
            addToast(t('errorMinTipAmount', { minAmount: '0', currency: formData.currency }) || 'Kwota musi być większa od 0', 'error');
            return;
        }
        setIsProcessing(true);
        try {
            const res = await fetch('/api/payments/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: formData.amount,
                    currency: formData.currency,
                    countryCodeHint: 'PL', // Should be dynamic based on lang
                    email: formData.email,
                    createAccount: formData.create_account,
                    language: 'pl'
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setClientSecret(data.clientSecret);
                setCurrentStep(2);
            } else {
                addToast(data.error || t('errorCreatingPayment') || 'Błąd tworzenia płatności', 'error');
            }
        } catch (error) {
            addToast(t('errorUnexpected') || 'Wystąpił niespodziewany błąd', 'error');
        } finally {
            setIsProcessing(false);
        }
    }
  };

  const handleBack = () => {
      if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const steps = [
      { id: 0, title: "Dane" },
      { id: 1, title: "Kwota" },
      { id: 2, title: "Płatność" }
  ];

  // Calculate progress percentage
  const progress = ((currentStep + 1) / steps.length) * 100;

  const suggestedAmounts = [10, 20, 50];

  return (
    <div className="fixed inset-0 z-[10200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-[90%] max-w-[420px] max-h-[85vh] flex flex-col rounded-[20px] border border-white/10 shadow-2xl overflow-hidden bg-gradient-to-b from-[#28282a] to-[#1c1c1e]"
      >
        {/* Header */}
        <div className="relative p-5 text-center border-b border-white/5 shrink-0">
            <h2 className="text-xl font-semibold text-white tracking-wide">Bramka Napiwkowa</h2>
            <button
                onClick={closeTippingModal}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-white/10">
            <motion.div
                className="h-full bg-gradient-to-r from-[#ff0055] to-[#ff4081] shadow-[0_0_10px_rgba(255,0,85,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
            <AnimatePresence mode="wait">
                {currentStep === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6 flex-1"
                    >
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-medium text-white">Twoje dane</h3>
                            <p className="text-sm text-gray-400">Zostaw namiar na siebie, aby otrzymać dostęp.</p>
                        </div>

                        <div className="space-y-4">
                            {!isLoggedIn && (
                                <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setFormData(prev => ({ ...prev, create_account: !prev.create_account }))}>
                                    <span className="text-sm font-medium text-white">Załóż konto (opcjonalne)</span>
                                    <div className={cn("w-6 h-6 rounded border flex items-center justify-center transition-colors", formData.create_account ? "bg-[#ff0055] border-[#ff0055]" : "border-white/30")}>
                                        {formData.create_account && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                    </div>
                                </div>
                            )}

                            <div className={cn("space-y-2 overflow-hidden transition-all duration-300", (formData.create_account || !isLoggedIn) ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0")}>
                                <input
                                    type="email"
                                    placeholder="Adres email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff0055] focus:bg-black/40 transition-all"
                                />
                                <p className="text-xs text-gray-500 text-center">
                                    {formData.create_account ? "Wyślemy Ci hasło na ten adres." : "Potrzebny do potwierdzenia płatności."}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentStep === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6 flex-1"
                    >
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-medium text-white">Wybierz kwotę</h3>
                            <p className="text-sm text-gray-400">Ile chcesz przekazać twórcy?</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {suggestedAmounts.map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => setFormData({ ...formData, amount })}
                                    className={cn(
                                        "py-3 rounded-xl font-semibold transition-all border",
                                        formData.amount === amount
                                            ? "bg-[#ff0055] border-[#ff0055] text-white shadow-[0_0_15px_rgba(255,0,85,0.4)] transform scale-105"
                                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                                    )}
                                >
                                    {amount} {formData.currency}
                                </button>
                            ))}
                        </div>

                        <div className="relative group">
                            <div className="flex items-center bg-black/30 border border-white/10 rounded-xl overflow-hidden focus-within:border-[#ff0055] focus-within:shadow-[0_0_0_2px_rgba(255,0,85,0.2)] transition-all">
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    className="flex-1 bg-transparent text-center text-2xl font-bold text-white py-4 focus:outline-none"
                                    placeholder="0"
                                />
                                <div className="pr-4">
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                                        className="bg-transparent text-white/50 font-medium text-lg focus:outline-none cursor-pointer hover:text-white transition-colors"
                                    >
                                        <option value="PLN" className="bg-[#1c1c1e]">PLN</option>
                                        <option value="EUR" className="bg-[#1c1c1e]">EUR</option>
                                        <option value="USD" className="bg-[#1c1c1e]">USD</option>
                                        <option value="GBP" className="bg-[#1c1c1e]">GBP</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentStep === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6 flex-1"
                    >
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-medium text-white">Płatność</h3>
                            <div className="inline-block bg-white/10 px-3 py-1 rounded-lg">
                                <span className="text-sm font-bold text-white">{formData.amount.toFixed(2)} {formData.currency}</span>
                            </div>
                        </div>

                        {clientSecret && (
                            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#ff0055', colorBackground: '#18181b', colorText: '#ffffff' } } }}>
                                <CheckoutForm clientSecret={clientSecret} onClose={closeTippingModal} />
                            </Elements>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Footer Buttons */}
        {currentStep < 2 && (
            <div className="px-5 pt-0 pb-5 flex gap-3 bg-[#1c1c1e] z-10">
                {currentStep > 0 && (
                    <button
                        onClick={handleBack}
                        className="px-5 py-3.5 rounded-xl font-semibold text-white/60 bg-transparent border border-white/10 hover:bg-white/5 hover:text-white transition-all"
                    >
                        Wstecz
                    </button>
                )}
                <button
                    onClick={handleNext}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#ff0055] to-[#ff4081] shadow-[0_4px_15px_rgba(255,0,85,0.3)] hover:shadow-[0_6px_20px_rgba(255,0,85,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                    {isProcessing ? (
                        <span className="animate-pulse">Przetwarzanie...</span>
                    ) : (
                        <>
                            Dalej <ChevronRight size={18} />
                        </>
                    )}
                </button>
            </div>
        )}

        {/* Stripe Logo Footer - Always visible at bottom */}
        <div className="pb-4 pt-2 flex items-center justify-center bg-[#1c1c1e] z-10 border-t border-white/5">
             <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
                  <span className="text-[10px] text-white/60 font-medium">Powered by</span>
                  <div className="relative h-4 w-10">
                      <Image
                        src="/stripe.png"
                        alt="Stripe"
                        layout="fill"
                        objectFit="contain"
                      />
                  </div>
             </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TippingModal;

"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useUser } from '@/context/UserContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/store/useStore';
import { X, ChevronRight, ChevronLeft, CreditCard, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Trophy } from 'lucide-react';

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
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 border border-white/10"
            >
                {isProcessing ? (t('processing') || "Przetwarzanie...") : (t('payNow') || "Zapłać teraz")}
            </button>
        </form>
    );
};

const TippingModal = () => {
  const { isLoggedIn, user } = useUser();
  const { addToast } = useToast();
  const { t } = useTranslation();
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
        setFormData(prev => ({ ...prev, email: user?.email || '' }));
        if (currentStep === 0) setCurrentStep(1);
    } else {
        if (!isTippingModalOpen) setCurrentStep(0);
    }
  }, [isLoggedIn, user, isTippingModalOpen]);

  if (!isTippingModalOpen) return null;

  const handleNext = async () => {
    if (currentStep === 0) {
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
                    countryCodeHint: 'PL',
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

  const progress = ((currentStep + 1) / steps.length) * 100;

  const suggestedAmounts = [10, 20, 50];

  return (
    <div className="fixed inset-0 z-[10200] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-[90%] max-w-[420px] max-h-[85vh] flex flex-col rounded-[24px] border border-purple-500/30 shadow-[0_0_80px_-20px_rgba(124,58,237,0.6)] overflow-hidden bg-gradient-to-br from-yellow-900/20 via-gray-900 to-black"
      >
        {/* Header */}
        <div className="relative p-6 text-center border-b border-white/5 shrink-0 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className="text-yellow-400 w-5 h-5" />
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 tracking-wide">
                    Bramka Napiwkowa
                </h2>
            </div>
            <button
                onClick={closeTippingModal}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-white/5 relative overflow-hidden">
            <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col relative">
            {/* Glow Effect Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[200px] bg-yellow-900/20 blur-[60px] pointer-events-none rounded-full mix-blend-screen" />

            <AnimatePresence mode="wait">
                {currentStep === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6 flex-1 relative z-10"
                    >
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-medium text-white">Dziękuję za wsparcie!</h3>
                            <p className="text-sm text-yellow-200/60">Zostaw namiar na siebie, aby otrzymać dostęp.</p>
                        </div>

                        <div className="space-y-4">
                            {!isLoggedIn && (
                                <div 
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300",
                                        formData.create_account 
                                            ? "bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]" 
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                    onClick={() => setFormData(prev => ({ ...prev, create_account: !prev.create_account }))}
                                >
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                        <span className="text-sm font-medium text-white">Założyć konto Patrona?</span>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300", 
                                        formData.create_account ? "bg-purple-600 border-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]" : "border-white/30"
                                    )}>
                                        {formData.create_account && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                    </div>
                                </div>
                            )}

                            <div className={cn("space-y-2 overflow-hidden transition-all duration-300", formData.create_account ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0")}>
                                <div className="group relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-xl blur opacity-0 group-focus-within:opacity-50 transition duration-500"></div>
                                    <input
                                        type="email"
                                        placeholder="Twój adres email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="relative w-full bg-[#0f0f13] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-transparent focus:ring-0 transition-all"
                                    />
                                </div>
                                <p className="text-xs text-purple-200/40 text-center">
                                    Na ten adres wyślemy dane dostępowe do Twojego konta Patrona.
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
                        className="space-y-6 flex-1 relative z-10"
                    >
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-medium text-white">Wybierz kwotę</h3>
                            <p className="text-sm text-yellow-200/60">Ile chcesz przekazać twórcy?</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {suggestedAmounts.map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => setFormData({ ...formData, amount })}
                                    className={cn(
                                        "py-3 rounded-xl font-semibold transition-all border relative overflow-hidden group",
                                        formData.amount === amount
                                            ? "border-purple-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] transform scale-105 z-10"
                                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
                                    )}
                                >
                                    {formData.amount === amount && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/80 via-purple-600/80 to-fuchsia-600/80 -z-10" />
                                    )}
                                    {amount} {formData.currency}
                                </button>
                            ))}
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-xl blur opacity-20 group-focus-within:opacity-70 transition duration-500"></div>
                            
                            <div className="relative flex items-center bg-[#0f0f13] border border-white/10 rounded-xl overflow-hidden">
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    className="flex-1 bg-transparent text-center text-3xl font-bold text-white py-6 focus:outline-none z-10"
                                    placeholder="0"
                                />
                                <div className="pr-4 z-10">
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                                        className="bg-transparent text-yellow-300 font-medium text-lg focus:outline-none cursor-pointer hover:text-white transition-colors"
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
                        className="space-y-6 flex-1 relative z-10"
                    >
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-medium text-white">Płatność</h3>
                            <div className="inline-block bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 px-4 py-1.5 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                                <span className="text-base font-bold text-white drop-shadow-md">{formData.amount.toFixed(2)} {formData.currency}</span>
                            </div>
                        </div>

                        {clientSecret && (
                            <Elements 
                                stripe={stripePromise} 
                                options={{ 
                                    clientSecret, 
                                    appearance: { 
                                        theme: 'night', 
                                        variables: { 
                                            colorPrimary: '#d946ef',
                                            colorBackground: '#0a0a0f', 
                                            colorText: '#ffffff',
                                            colorDanger: '#ff453a',
                                            fontFamily: 'inherit',
                                            borderRadius: '12px'
                                        } 
                                    } 
                                }}
                            >
                                <CheckoutForm clientSecret={clientSecret} onClose={closeTippingModal} />
                            </Elements>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Footer Buttons */}
        {currentStep < 2 && (
            <div className="px-6 pt-0 pb-6 flex gap-3 bg-transparent z-20 relative">
                {currentStep > 0 && (
                    <button
                        onClick={handleBack}
                        className="px-5 py-3.5 rounded-xl font-semibold text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
                    >
                        Wstecz
                    </button>
                )}
                <button
                    onClick={handleNext}
                    disabled={isProcessing}
                    className="group flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_6px_30px_rgba(124,58,237,0.5)] hover:scale-[1.02] active:scale-95 transition-all border border-white/10"
                >
                    {isProcessing ? (
                        <span className="animate-pulse">Przetwarzanie...</span>
                    ) : (
                        <>
                            No jacha! <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        )}

        {/* Stripe Logo Footer */}
        <div className="pb-4 pt-2 flex items-center justify-center bg-[#0a0a0f]/50 backdrop-blur-sm z-10 border-t border-white/5">
             <div className="flex items-center gap-2 opacity-40 grayscale hover:grayscale-0 hover:opacity-80 transition-all duration-300">
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

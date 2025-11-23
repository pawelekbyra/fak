"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useUser } from '@/context/UserContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/store/useStore';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK!);

// Logo Stripe w wersji BIAŁEJ (dla ciemnego tła)
const StripeLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="25" viewBox="0 0 120 60" fillRule="evenodd" fill="#ffffff">
        <path d="M101.547 30.94c0-5.885-2.85-10.53-8.3-10.53-5.47 0-8.782 4.644-8.782 10.483 0 6.92 3.908 10.414 9.517 10.414 2.736 0 4.805-.62 6.368-1.494v-4.598c-1.563.782-3.356 1.264-5.632 1.264-2.23 0-4.207-.782-4.46-3.494h11.24c0-.3.046-1.494.046-2.046zM90.2 28.757c0-2.598 1.586-3.678 3.035-3.678 1.402 0 2.897 1.08 2.897 3.678zm-14.597-8.345c-2.253 0-3.7 1.057-4.506 1.793l-.3-1.425H65.73v26.805l5.747-1.218.023-6.506c.828.598 2.046 1.448 4.07 1.448 4.115 0 7.862-3.3 7.862-10.598-.023-6.667-3.816-10.3-7.84-10.3zm-1.38 15.84c-1.356 0-2.16-.483-2.713-1.08l-.023-8.53c.598-.667 1.425-1.126 2.736-1.126 2.092 0 3.54 2.345 3.54 5.356 0 3.08-1.425 5.38-3.54 5.38zm-16.4-17.196l5.77-1.24V13.15l-5.77 1.218zm0 1.747h5.77v20.115h-5.77zm-6.185 1.7l-.368-1.7h-4.966V40.92h5.747V27.286c1.356-1.77 3.655-1.448 4.368-1.195v-5.287c-.736-.276-3.425-.782-4.782 1.7zm-11.494-6.7L34.535 17l-.023 18.414c0 3.402 2.552 5.908 5.954 5.908 1.885 0 3.264-.345 4.023-.76v-4.667c-.736.3-4.368 1.356-4.368-2.046V25.7h4.368v-4.897h-4.37zm-15.54 10.828c0-.897.736-1.24 1.954-1.24a12.85 12.85 0 0 1 5.7 1.47V21.47c-1.908-.76-3.793-1.057-5.7-1.057-4.667 0-7.77 2.437-7.77 6.506 0 6.345 8.736 5.333 8.736 8.07 0 1.057-.92 1.402-2.207 1.402-1.908 0-4.345-.782-6.276-1.84v5.47c2.138.92 4.3 1.3 6.276 1.3 4.782 0 8.07-2.368 8.07-6.483-.023-6.85-8.782-5.632-8.782-8.207z"/>
    </svg>
);

const CheckoutForm = ({ clientSecret, onClose }: { clientSecret: string, onClose: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { addToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const { t } = useTranslation();

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

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-4 min-h-[200px] mix-blend-screen">
                <PaymentElement 
                    options={{ 
                        layout: 'tabs',
                        appearance: {
                            theme: 'night',
                            variables: {
                                colorPrimary: '#ffffff',
                                colorBackground: '#262626',
                                colorText: '#ffffff',
                                colorDanger: '#ef4444',
                                fontFamily: 'inherit',
                                borderRadius: '8px',
                            }
                        }
                    }} 
                />
            </div>
            {/* White Button for high contrast */}
            <button
                disabled={isProcessing || !stripe || !elements}
                className="w-full py-3 rounded-lg font-black text-black text-lg bg-white border border-white/20 shadow-[0_5px_15px_rgba(255,255,255,0.1)] hover:shadow-[0_8px_20px_rgba(255,255,255,0.2)] hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 tracking-widest relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                {isProcessing ? (t('processing') || "PRZETWARZANIE...") : "ENTER"}
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
        if (!isTippingModalOpen) {
            setCurrentStep(0);
            setFormData(prev => ({ ...prev, create_account: false }));
        }
    }
  }, [isLoggedIn, user, isTippingModalOpen, currentStep]);

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
    <div className="fixed inset-0 z-[10200] flex items-center justify-center pointer-events-none">
      <motion.div
        className="fixed inset-0 z-[-1] pointer-events-auto"
        onClick={closeTippingModal}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        // NEW BACKGROUND: Deep Dark Premium with animated subtle gradient
        className="relative w-[90%] max-w-[420px] max-h-[85vh] flex flex-col rounded-[20px] shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden bg-neutral-950 border border-white/10 pointer-events-auto"
      >
        {/* Subtle Animated Background Gradient (Mesh effect) */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950 animate-[spin_20s_linear_infinite] z-0 pointer-events-none opacity-50"></div>
        
        {/* Noise Texture for material feel */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/noise.png')] z-0"></div>

        {/* Top Highlight Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/20 z-20"></div>

        {/* Header - Compact */}
        <div className="relative pt-5 pb-3 px-5 text-center shrink-0 z-10">
            <h2 className="text-xl font-bold text-white tracking-wide drop-shadow-sm opacity-90">
                Bramka Napiwkowa
            </h2>
            {/* Close Button X: top-3 right-3, white */}
            <button
                onClick={closeTippingModal}
                className="absolute right-3 top-3 p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
            >
                <X size={20} strokeWidth={2.5} />
            </button>
        </div>

        {/* Progress Bar - Compact */}
        <div className="h-1 w-full bg-white/5 relative overflow-hidden z-10 mb-1">
            <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            />
        </div>

        {/* Body - Compact Padding */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col relative z-10">
            <AnimatePresence mode="wait">
                {currentStep === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4 flex-1"
                    >
                        <div className="text-left">
                            <p className="text-lg font-bold text-white tracking-wide">Założyć konto patrona?</p>
                        </div>

                        <div className="space-y-3">
                            {!isLoggedIn && (
                                <div 
                                    className={cn(
                                        "flex items-center justify-start p-4 gap-3 rounded-xl border cursor-pointer transition-all duration-300 group relative overflow-hidden",
                                        formData.create_account 
                                            ? "bg-white/10 border-white/20 shadow-lg" 
                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                    )}
                                    onClick={() => setFormData(prev => ({ ...prev, create_account: !prev.create_account }))}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 z-10", 
                                        formData.create_account 
                                            ? "bg-white border-white" 
                                            : "border-white/40 group-hover:border-white/60"
                                    )}>
                                        {formData.create_account && <div className="w-2 h-2 bg-black rounded-full" />}
                                    </div>
                                    
                                    <span className={cn("text-base font-bold transition-colors z-10", formData.create_account ? "text-white" : "text-white/70")}>
                                        No jacha!
                                    </span>
                                </div>
                            )}

                            <div className={cn("space-y-2 overflow-hidden transition-all duration-500", (formData.create_account) ? "max-h-[200px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2")}>
                                <div className="group relative">
                                    <input
                                        type="email"
                                        placeholder="Adres email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="relative w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10 focus:border-white/30 transition-all font-medium"
                                    />
                                </div>
                                <p className="text-[11px] text-white/50 text-center px-2">
                                    Na ten email wyślemy Ci <span className="text-white/90 font-bold">dane do logowania</span>.
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
                        className="space-y-5 flex-1 relative z-10"
                    >
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-bold text-white">Wybierz kwotę</h3>
                            <p className="text-xs text-white/50 font-medium uppercase tracking-wider">Ile chcesz przekazać?</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {suggestedAmounts.map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => setFormData({ ...formData, amount })}
                                    className={cn(
                                        "py-3 rounded-lg font-bold transition-all border relative overflow-hidden group",
                                        formData.amount === amount
                                            ? "bg-white border-white text-black shadow-lg scale-[1.02]"
                                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    {amount} {formData.currency}
                                </button>
                            ))}
                        </div>

                        <div className="relative group mt-2">
                            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-colors focus-within:bg-white/10 focus-within:border-white/20">
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    className="flex-1 bg-transparent text-center text-3xl font-black text-white py-4 focus:outline-none z-10 placeholder:text-white/10"
                                    placeholder="0"
                                />
                                <div className="pr-4 z-10 border-l border-white/10 pl-3">
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                                        className="bg-transparent text-white/80 font-bold text-sm focus:outline-none cursor-pointer hover:text-white transition-colors"
                                    >
                                        <option value="PLN" className="text-black">PLN</option>
                                        <option value="EUR" className="text-black">EUR</option>
                                        <option value="USD" className="text-black">USD</option>
                                        <option value="GBP" className="text-black">GBP</option>
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
                        className="space-y-4 flex-1 relative z-10"
                    >
                        <div className="text-center">
                            <div className="inline-block bg-white/5 border border-white/10 px-5 py-2 rounded-full shadow-inner">
                                <span className="text-xl font-black text-white">{formData.amount.toFixed(2)} {formData.currency}</span>
                            </div>
                        </div>

                        {clientSecret && (
                            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 mt-1">
                                <Elements 
                                    stripe={stripePromise} 
                                    options={{ 
                                        clientSecret, 
                                        appearance: { 
                                            theme: 'night', // Stripe Dark Theme
                                        } 
                                    }}
                                >
                                    <CheckoutForm clientSecret={clientSecret} onClose={closeTippingModal} />
                                </Elements>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Footer Buttons - Compact */}
        {currentStep < 2 && (
            <div className="px-5 pb-5 pt-0 flex gap-2 bg-transparent z-20 relative">
                {currentStep > 0 && (
                    <button
                        onClick={handleBack}
                        className="px-4 py-3 rounded-lg font-bold text-white/50 bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white transition-all text-sm"
                    >
                        Wstecz
                    </button>
                )}
                {/* Main Action Button - White for Contrast */}
                <button
                    onClick={handleNext}
                    disabled={isProcessing}
                    className="group flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-black text-lg text-black bg-white border border-white/20 shadow-[0_5px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_25px_rgba(255,255,255,0.25)] hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden tracking-widest"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    {isProcessing ? (
                        <span className="animate-pulse">PRZETWARZANIE...</span>
                    ) : (
                        "ENTER"
                    )}
                </button>
            </div>
        )}

        <div className="pb-3 pt-2 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10 border-t border-white/5">
             <div className="flex items-center gap-0 opacity-40 hover:opacity-80 transition-all duration-300">
                  <span className="text-[9px] text-white font-bold uppercase tracking-widest">Powered by</span>
                  <div className="relative flex items-center -ml-3">
                      <StripeLogo />
                  </div>
             </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TippingModal;

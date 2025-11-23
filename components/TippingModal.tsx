"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useUser } from '@/context/UserContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/store/useStore';
import { X, ChevronRight, Crown, Sparkles, Trophy } from 'lucide-react';
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
            <div className="mb-6 min-h-[200px] mix-blend-multiply">
                 {/* Stripe Elements with customized heavy variables for contrast on gold */}
                <PaymentElement 
                    options={{ 
                        layout: 'tabs',
                    }} 
                />
            </div>
            <button
                disabled={isProcessing || !stripe || !elements}
                // BLACK VIP BUTTON on GOLD Background
                className="w-full py-4 rounded-xl font-black text-white text-lg bg-neutral-900 border border-black/20 shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 tracking-widest relative overflow-hidden group"
            >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                
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
        // GOLDEN MODAL STYLING
        // Gradient: Rich Gold to Deep Amber
        // Text: Black for contrast
        className="relative w-[90%] max-w-[420px] max-h-[85vh] flex flex-col rounded-[24px] shadow-[0_0_100px_-20px_rgba(234,179,8,0.6)] overflow-hidden bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border border-white/20 pointer-events-auto"
      >
        {/* Shine Overlay (Texture) */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/noise.png')] mix-blend-overlay"></div>
        
        {/* Top Highlight Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/60 z-20"></div>

        {/* Header */}
        <div className="relative p-6 text-center shrink-0 border-b border-black/5 bg-white/10 backdrop-blur-sm z-10">
            <div className="flex items-center justify-center gap-2 mb-1">
                <Crown className="text-black w-5 h-5" />
                <h2 className="text-xl font-black text-black tracking-wide drop-shadow-sm opacity-90 whitespace-nowrap">
                    Bramka Napiwkowa
                </h2>
                <Sparkles className="text-white w-4 h-4 animate-pulse" />
            </div>
            <button
                onClick={closeTippingModal}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-black/40 hover:text-black hover:bg-black/10 rounded-full transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-black/10 relative overflow-hidden z-10">
            <motion.div
                className="h-full bg-neutral-900"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col relative z-10">
            
            <AnimatePresence mode="wait">
                {currentStep === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 flex-1 pt-2"
                    >
                        <div className="text-left space-y-2">
                            <div className="flex items-center justify-start gap-3 pl-1">
                                <div className="p-2 bg-black/10 rounded-full border border-black/5 shadow-inner">
                                   <Trophy className="w-5 h-5 text-black drop-shadow-sm" />
                                </div>
                                {/* Text is white as requested, with shadow for readability on gold */}
                                <p className="text-lg font-bold text-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] tracking-wide">Założyć konto Patrona?</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {!isLoggedIn && (
                                <div 
                                    className={cn(
                                        "flex items-center justify-start p-5 gap-4 rounded-2xl border cursor-pointer transition-all duration-500 group relative overflow-hidden",
                                        formData.create_account 
                                            ? "bg-neutral-900 border-neutral-900 shadow-xl" 
                                            : "bg-black/5 border-black/10 hover:bg-black/10 hover:border-black/20"
                                    )}
                                    onClick={() => setFormData(prev => ({ ...prev, create_account: !prev.create_account }))}
                                >
                                    {/* Checkbox Indicator on LEFT */}
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 z-10", 
                                        formData.create_account 
                                            ? "bg-white border-white scale-110" 
                                            : "border-black/40 group-hover:border-black/70"
                                    )}>
                                        {formData.create_account && <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full" />}
                                    </div>
                                    
                                    <span className={cn("text-base font-bold transition-colors z-10", formData.create_account ? "text-white" : "text-black/70")}>
                                        No Jacha
                                    </span>
                                </div>
                            )}

                            <div className={cn("space-y-3 overflow-hidden transition-all duration-500", (formData.create_account) ? "max-h-[200px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-4")}>
                                <div className="group relative">
                                    {/* Input background darker for contrast on gold */}
                                    <input
                                        type="email"
                                        placeholder="Adres email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="relative w-full bg-black/10 border border-black/5 rounded-xl px-5 py-4 text-black placeholder:text-black/40 focus:outline-none focus:bg-black/20 focus:border-black/30 transition-all shadow-inner font-medium"
                                    />
                                </div>
                                <p className="text-xs text-black/60 text-center px-4 leading-relaxed font-semibold">
                                    Na ten email wyślemy Ci <span className="text-black font-extrabold">dane do logowania</span>.
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
                            <h3 className="text-xl font-bold text-black/90">Wybierz kwotę</h3>
                            <p className="text-sm text-black/50 font-medium">Ile chcesz przekazać?</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {suggestedAmounts.map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => setFormData({ ...formData, amount })}
                                    className={cn(
                                        "py-4 rounded-xl font-bold transition-all border-2 relative overflow-hidden group shadow-sm",
                                        formData.amount === amount
                                            ? "bg-neutral-900 border-neutral-900 text-white transform scale-105 z-10 shadow-xl"
                                            : "bg-white/20 border-transparent text-black/60 hover:bg-white/40 hover:text-black"
                                    )}
                                >
                                    {amount} {formData.currency}
                                </button>
                            ))}
                        </div>

                        <div className="relative group mt-4">
                            <div className="relative flex items-center bg-black/10 border border-black/5 rounded-xl overflow-hidden transition-colors shadow-inner focus-within:bg-black/15">
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    className="flex-1 bg-transparent text-center text-4xl font-black text-black py-6 focus:outline-none z-10 placeholder:text-black/20"
                                    placeholder="0"
                                />
                                <div className="pr-6 z-10 border-l border-black/10 pl-4">
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                                        className="bg-transparent text-black/80 font-bold text-lg focus:outline-none cursor-pointer hover:text-black transition-colors"
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
                        className="space-y-6 flex-1 relative z-10"
                    >
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-bold text-black/80">Podsumowanie</h3>
                            <div className="inline-block bg-neutral-900 px-6 py-3 rounded-full mt-4 shadow-xl transform hover:scale-105 transition-transform">
                                <span className="text-2xl font-black text-yellow-400">{formData.amount.toFixed(2)} {formData.currency}</span>
                            </div>
                        </div>

                        {clientSecret && (
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 mt-2 shadow-inner">
                                <Elements 
                                    stripe={stripePromise} 
                                    options={{ 
                                        clientSecret, 
                                        appearance: { 
                                            theme: 'stripe',
                                            variables: { 
                                                colorPrimary: '#171717', // Neutral 900
                                                colorBackground: '#ffffff', 
                                                colorText: '#000000',
                                                colorDanger: '#ef4444',
                                                fontFamily: 'inherit',
                                                borderRadius: '12px',
                                            } 
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

        {/* Footer Buttons */}
        {currentStep < 2 && (
            <div className="px-6 pt-0 pb-6 flex gap-3 bg-transparent z-20 relative">
                {currentStep > 0 && (
                    <button
                        onClick={handleBack}
                        className="px-5 py-4 rounded-xl font-bold text-black/50 bg-black/5 border border-black/5 hover:bg-black/10 hover:text-black transition-all"
                    >
                        Wstecz
                    </button>
                )}
                <button
                    onClick={handleNext}
                    disabled={isProcessing}
                    // BLACK VIP BUTTON - The "Black Card" effect
                    className="group flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black text-lg text-white bg-neutral-900 border border-white/10 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.5)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden tracking-widest"
                >
                     {/* Shine effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    
                    {isProcessing ? (
                        <span className="animate-pulse">PRZETWARZANIE...</span>
                    ) : (
                        "ENTER"
                    )}
                </button>
            </div>
        )}

        {/* Footer Stripe */}
        <div className="pb-4 pt-2 flex items-center justify-center bg-black/5 backdrop-blur-sm z-10 border-t border-black/5">
             <div className="flex items-center gap-2 opacity-40 hover:opacity-80 transition-all duration-300 mix-blend-multiply">
                  <span className="text-[10px] text-black font-bold">Powered by</span>
                  <div className="relative h-4 w-10">
                      <Image
                        src="/stripe.png"
                        alt="Stripe"
                        layout="fill"
                        objectFit="contain"
                        className="invert" // Invert stripe logo to be black on gold
                      />
                  </div>
             </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TippingModal;

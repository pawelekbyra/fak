"use client";

import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useUser } from '@/context/UserContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/store/useStore';
import { X, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK!);

// Logo Stripe w wersji CZARNEJ
const StripeLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="25" viewBox="0 0 120 60" fillRule="evenodd" fill="#000000">
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
            <div className="mb-4 min-h-[200px] mix-blend-multiply">
                <PaymentElement 
                    options={{ 
                        layout: 'tabs',
                    }} 
                />
            </div>
            <button
                disabled={isProcessing || !stripe || !elements}
                className="w-full py-3 rounded-lg font-black text-white text-lg bg-neutral-900 border border-black/20 shadow-[0_5px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 tracking-widest relative overflow-hidden group"
            >
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
    recipient: '',
  });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // NOWY STAN DLA WŁASNEGO DROPDOWNA WALUTY
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoggedIn) {
        setFormData(prev => ({ ...prev, email: user?.email || '' }));
    } else {
        if (!isTippingModalOpen) {
            setCurrentStep(0);
            setFormData(prev => ({ ...prev, create_account: false, terms_accepted: false, recipient: '' }));
            setIsCurrencyDropdownOpen(false); // Reset dropdown state
        }
    }
  }, [isLoggedIn, user, isTippingModalOpen]);

  // Zamykanie dropdowna po kliknięciu poza nim
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setIsCurrencyDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleNext = async () => {
    if (currentStep === 0) {
        if (!formData.recipient) {
            addToast('Wybierz odbiorcę, aby kontynuować.', 'error');
            return;
        }
        if (formData.recipient === 'Nikt') {
            closeTippingModal();
            return;
        }
        if (isLoggedIn) {
            setCurrentStep(2);
        } else {
            setCurrentStep(1);
        }
    }
    else if (currentStep === 1) {
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
        setCurrentStep(2);
    }
    else if (currentStep === 2) {
        if (!formData.terms_accepted) {
            addToast('Musisz zaakceptować regulamin, aby kontynuować.', 'error');
            return;
        }
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
                setCurrentStep(3);
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
      if (currentStep === 2 && isLoggedIn) {
          setCurrentStep(0);
      } else if (currentStep > 0) {
          setCurrentStep(currentStep - 1);
      }
  };

  const steps = [
      { id: 0, title: "Odbiorca" },
      { id: 1, title: "Dane" },
      { id: 2, title: "Kwota" },
      { id: 3, title: "Płatność" }
  ];

  const totalSteps = isLoggedIn ? 3 : 4;
  const currentVisualStep = isLoggedIn && currentStep >= 1 ? currentStep - 1 : currentStep;
  const progress = ((currentVisualStep + 1) / totalSteps) * 100;

  const suggestedAmounts = [10, 20, 50];
  const currencies = ['PLN', 'EUR', 'USD', 'GBP'];

  return (
    <AnimatePresence>
      {isTippingModalOpen && (
        <div className="absolute inset-0 z-[10200] flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[-1] pointer-events-auto"
            onClick={closeTippingModal}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-[90%] max-w-[420px] max-h-[85vh] flex flex-col rounded-[20px] shadow-[0_0_100px_-20px_rgba(255,255,255,0.4)] overflow-hidden bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 border-[3px] border-black pointer-events-auto"
          >
        <div className="absolute inset-0 border-[6px] border-transparent rounded-[21px] pointer-events-none overflow-hidden z-[50]">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-0 animate-[shine-border_4s_infinite]" />
        </div>

        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/noise.png')] mix-blend-overlay z-0"></div>
        
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/70 z-20"></div>

        <div className="relative pt-5 pb-3 px-5 text-center shrink-0 z-10 border-b border-black/5 bg-white/10 backdrop-blur-sm">
            <h2 className="text-xl font-extrabold text-black tracking-tight drop-shadow-sm opacity-90">
                Bramka Napiwkowa
            </h2>
            <button
                onClick={closeTippingModal}
                className="absolute right-3 top-3 p-1.5 text-black/50 hover:text-black hover:bg-black/10 rounded-full transition-colors z-50"
            >
                <X size={20} strokeWidth={2.5} />
            </button>
        </div>

        <div className="h-1 w-full bg-black/10 relative overflow-hidden z-10 mb-1">
            <motion.div
                className="h-full bg-neutral-900"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            />
        </div>

        <div className="flex-1 overflow-visible px-5 pt-5 pb-0 flex flex-col relative z-10">
            <AnimatePresence mode="wait">
                {currentStep === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-2"
                    >
                        <div className="text-left">
                            <p className="text-lg font-bold text-black tracking-wide">Komu chcesz przekazać napiwek?</p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div 
                                className={cn(
                                    "flex items-center justify-start p-4 gap-4 rounded-xl border cursor-pointer transition-all duration-300 group relative overflow-hidden",
                                    formData.recipient === 'Paweł'
                                        ? "bg-neutral-900 border-neutral-900 shadow-lg" 
                                        : "bg-black/5 border-black/5 hover:bg-black/10"
                                )}
                                onClick={() => setFormData(prev => ({ ...prev, recipient: 'Paweł' }))}
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 z-10",
                                    formData.recipient === 'Paweł'
                                        ? "bg-white border-white"
                                        : "border-black/40 group-hover:border-black/60"
                                )}>
                                    {formData.recipient === 'Paweł' && <div className="w-2 h-2 bg-neutral-900 rounded-full" />}
                                </div>
                                
                                <span className={cn("text-base font-bold transition-colors z-10", formData.recipient === 'Paweł' ? "text-white" : "text-black/70")}>
                                    Pawłowi Polutkowi
                                </span>
                            </div>

                            <div 
                                className={cn(
                                    "flex items-center justify-start p-4 gap-4 rounded-xl border cursor-pointer transition-all duration-300 group relative overflow-hidden",
                                    formData.recipient === 'Nikt'
                                        ? "bg-neutral-900 border-neutral-900 shadow-lg" 
                                        : "bg-black/5 border-black/5 hover:bg-black/10"
                                )}
                                onClick={() => setFormData(prev => ({ ...prev, recipient: 'Nikt' }))}
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 z-10",
                                    formData.recipient === 'Nikt'
                                        ? "bg-white border-white"
                                        : "border-black/40 group-hover:border-black/60"
                                )}>
                                    {formData.recipient === 'Nikt' && <div className="w-2 h-2 bg-neutral-900 rounded-full" />}
                                </div>
                                
                                <span className={cn("text-base font-bold transition-colors z-10", formData.recipient === 'Nikt' ? "text-white" : "text-black/70")}>
                                    Nikomu
                                </span>
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
                        className="space-y-2"
                    >
                        <div className="text-left">
                            <p className="text-lg font-bold text-black tracking-wide">Założyć konto Patrona?</p>
                        </div>

                        <div className="space-y-2">
                            {!isLoggedIn && (
                                <div 
                                    className={cn(
                                        "flex items-center justify-start p-4 gap-3 rounded-xl border cursor-pointer transition-all duration-300 group relative overflow-hidden",
                                        formData.create_account 
                                            ? "bg-neutral-900 border-neutral-900 shadow-lg" 
                                            : "bg-black/5 border-black/5 hover:bg-black/10"
                                    )}
                                    onClick={() => setFormData(prev => ({ ...prev, create_account: !prev.create_account }))}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 z-10", 
                                        formData.create_account 
                                            ? "bg-white border-white" 
                                            : "border-black/40 group-hover:border-black/60"
                                    )}>
                                        {formData.create_account && <div className="w-2 h-2 bg-neutral-900 rounded-full" />}
                                    </div>
                                    
                                    <span className={cn("text-base font-bold transition-colors z-10", formData.create_account ? "text-white" : "text-black/70")}>
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
                                        className="relative w-full bg-black/5 border border-black/10 rounded-lg px-4 py-3 text-black placeholder:text-black/30 focus:outline-none focus:bg-black/10 focus:border-black/30 transition-all font-medium"
                                    />
                                </div>
                                <p className="text-[11px] text-black/50 text-center px-2">
                                    Na ten email otrzymasz <span className="text-black/90 font-bold">dane do logowania</span>.
                                </p>
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
                        className="space-y-3 flex-1 relative z-10"
                    >
                        {/* ZMIANA: Usunięto text-center, aby wyrównać do lewej */}
                        <div>
                            <h3 className="text-lg font-bold text-black">Wybierz lub wpisz kwotę napiwku</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {suggestedAmounts.map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => setFormData({ ...formData, amount })}
                                    className={cn(
                                        "py-3 rounded-lg font-bold transition-all border relative overflow-hidden group",
                                        formData.amount === amount
                                            ? "bg-neutral-900 border-neutral-900 text-white shadow-lg scale-[1.02]"
                                            : "bg-black/5 border-black/10 text-black/60 hover:bg-black/10 hover:text-black"
                                    )}
                                >
                                    {amount} {formData.currency}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center bg-black/5 border border-black/10 rounded-xl shadow-inner z-20 relative" ref={dropdownRef}>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                className="flex-1 w-full bg-transparent text-center text-3xl font-black text-black py-4 focus:outline-none placeholder:text-black/10 pl-4 rounded-l-xl"
                                placeholder="0"
                            />
                            
                            {/* Kontener dla triggera i listy */}
                            <div className="relative h-full">
                                {/* TRIGGER WALUTY */}
                                <div 
                                    className="h-full border-l border-black/10 flex items-center bg-black/5 hover:bg-black/10 transition-colors relative shrink-0 cursor-pointer pl-4 pr-10 rounded-r-xl"
                                    onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                                >
                                    <span className="font-bold text-lg text-black select-none">{formData.currency}</span>
                                    <motion.div
                                        animate={{ rotate: isCurrencyDropdownOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                                    >
                                        <ChevronDown className="w-4 h-4 text-black/50" />
                                    </motion.div>
                                </div>

                                {/* NOWA LISTA ROZWIJANA (SOLIDNY SZARY STYL, ZAKRYWA TRIGGER) */}
                                <AnimatePresence>
                                    {isCurrencyDropdownOpen && (
                                        <motion.div
                                            // ZMIANA POZYCJI: top-0 right-0 żeby zakryć trigger
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            style={{ originY: 0, originX: 1 }} // Rozwijanie z prawego górnego rogu
                                            // ZMIANA STYLU: Solidny szary kolor (bg-[#eeeeee]), brak rozmycia, wysoki z-index
                                            className="absolute top-0 right-0 min-w-[120px] bg-[#eeeeee] border border-black/10 rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)] overflow-hidden z-[70]"
                                        >
                                            <div className="py-1">
                                                {currencies.map((currency) => (
                                                    <button
                                                        key={currency}
                                                        onClick={() => {
                                                            setFormData({ ...formData, currency: currency as any });
                                                            setIsCurrencyDropdownOpen(false);
                                                        }}
                                                        // ZMIANA STYLU ELEMENTÓW LISTY: Ciemny tekst, ciemniejsze tło po najechaniu
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-4 py-3 text-left font-bold transition-colors relative group text-black",
                                                            formData.currency === currency 
                                                                ? "bg-black/10" 
                                                                : "hover:bg-black/5"
                                                        )}
                                                    >
                                                        <span>{currency}</span>
                                                        {formData.currency === currency && (
                                                            <Check size={16} className="text-black" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div 
                            className="flex items-center justify-center gap-3 cursor-pointer group relative z-10"
                            onClick={() => setFormData(prev => ({ ...prev, terms_accepted: !prev.terms_accepted }))}
                        >
                            <div className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                                formData.terms_accepted 
                                    ? "bg-neutral-900 border-neutral-900" 
                                    : "border-black/30 group-hover:border-black/60 bg-white/20"
                            )}>
                                {formData.terms_accepted && <Check size={14} className="text-white" strokeWidth={4} />}
                            </div>
                            <p className="text-sm font-medium text-black/70 group-hover:text-black transition-colors">
                                Akceptuję <span className="underline decoration-black/30 underline-offset-2">regulamin i Politykę Prywatności</span>
                            </p>
                        </div>
                    </motion.div>
                )}

                {currentStep === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4 flex-1 relative z-10"
                    >
                        <div className="text-center">
                            <div className="inline-block bg-black/5 border border-black/10 px-5 py-2 rounded-full shadow-inner">
                                <span className="text-xl font-black text-black">{formData.amount.toFixed(2)} {formData.currency}</span>
                            </div>
                        </div>

                        {clientSecret && (
                            <div className="bg-black/5 backdrop-blur-sm p-4 rounded-xl border border-black/10 mt-1">
                                <Elements 
                                    stripe={stripePromise} 
                                    options={{ 
                                        clientSecret, 
                                        appearance: { 
                                            theme: 'stripe',
                                            variables: { 
                                                colorPrimary: '#000000', 
                                                colorBackground: '#ffffff', 
                                                colorText: '#000000',
                                                colorDanger: '#ef4444',
                                                fontFamily: 'inherit',
                                                borderRadius: '8px',
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

        {currentStep < 3 && (
            <div className="px-5 pb-5 pt-3 flex gap-2 bg-transparent z-20 relative">
                {currentStep > 0 && (
                    <button
                        onClick={handleBack}
                        className="px-4 py-3 rounded-lg font-bold text-black/50 bg-black/5 border border-black/5 hover:bg-black/10 hover:text-black transition-all text-sm"
                    >
                        Wstecz
                    </button>
                )}
                <button
                    onClick={handleNext}
                    disabled={isProcessing}
                    className="group flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-black text-lg text-white bg-neutral-900 border border-black/20 shadow-[0_5px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.25)] hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden tracking-widest"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    {isProcessing ? (
                        <span className="animate-pulse">PRZETWARZANIE...</span>
                    ) : (
                        "ENTER"
                    )}
                </button>
            </div>
        )}

        <div className="pb-3 pt-2 flex items-center justify-center bg-black/5 backdrop-blur-sm z-10 border-t border-black/5">
             <div className="flex items-center gap-[3px] opacity-40 hover:opacity-80 transition-all duration-300">
                  <span className="text-[9px] text-black font-bold uppercase tracking-widest">Powered by</span>
                  <div className="relative flex items-center -ml-3 -mt-px -left-px">
                      <StripeLogo />
                  </div>
             </div>
        </div>
      </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TippingModal;

"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useUser } from '@/context/UserContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useStore } from '@/store/useStore';
import { X, ChevronLeft, CreditCard, Gift, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK!);

const CheckoutForm = ({ clientSecret, onClose }: { clientSecret: string, onClose: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { addToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
        });

        if (error) {
            addToast(error.message || 'Error processing payment', 'error');
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            addToast('Dzięki za wsparcie! ❤️', 'success');
            onClose();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement options={{ layout: 'tabs' }} />
            <Button
                disabled={isProcessing || !stripe || !elements}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
                {isProcessing ? "Przetwarzanie..." : "Wyślij Napiwek"}
            </Button>
        </form>
    );
};

const TippingModal = () => {
  const { isLoggedIn, user } = useUser();
  const { t, lang } = useTranslation();
  const { addToast } = useToast();
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
    if (isTippingModalOpen) {
        if (isLoggedIn) {
            setCurrentStep(1);
            if (user?.email) {
                setFormData(prev => ({ ...prev, email: user.email }));
            }
        } else {
            setCurrentStep(0);
        }
    }
  }, [isLoggedIn, user, isTippingModalOpen]);

  if (!isTippingModalOpen) return null;

  const handleNext = async () => {
    // Email Step
    if (currentStep === 0) {
      if (formData.create_account) {
          if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            addToast(t('errorInvalidEmail'), 'error');
            return;
          }
      }
      setCurrentStep(1);
    }
    // Amount Step
    else if (currentStep === 1) {
      const minAmount = formData.currency === 'PLN' ? 5 : 1;
      if (formData.amount < minAmount) {
        addToast(t('errorMinTipAmount', { minAmount: minAmount.toFixed(2), currency: formData.currency }), 'error');
        return;
      }
      if (!formData.terms_accepted) {
          addToast(t('errorTermsNotAccepted'), 'error');
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
                language: lang
            }),
        });
        const data = await res.json();
        if (res.ok) {
            setClientSecret(data.clientSecret);
            setCurrentStep(2);
        } else {
            addToast(data.error || 'Failed to initialize payment', 'error');
        }
      } catch (error) {
          addToast('Connection error', 'error');
      } finally {
          setIsProcessing(false);
      }
    }
  };

  const presetAmounts = [5, 10, 20, 50];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#1A1A1A] w-full max-w-[360px] rounded-3xl shadow-2xl overflow-hidden border border-white/10 relative flex flex-col"
      >
        {/* Header with Progress */}
        <div className="bg-gradient-to-r from-pink-500/10 to-purple-600/10 p-4 pb-2">
             <div className="flex justify-between items-center mb-4">
                {currentStep > 0 && currentStep < 2 ? (
                    <button onClick={() => setCurrentStep(currentStep - 1)} className="text-white/60 hover:text-white transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                ) : <div className="w-6" />}

                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Gift className="text-pink-500" size={20} />
                    Bramka Napiwkowa
                </h2>

                <button onClick={closeTippingModal} className="text-white/60 hover:text-white transition-colors">
                    <X size={24} />
                </button>
             </div>

             {/* Progress Bar */}
             <div className="flex gap-2 justify-center mb-2">
                 {[0, 1, 2].map((step) => (
                     <div
                        key={step}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            step <= currentStep ? "w-8 bg-gradient-to-r from-pink-500 to-purple-500" : "w-2 bg-white/10"
                        )}
                     />
                 ))}
             </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col justify-center min-h-[300px]">
            <AnimatePresence mode="wait">
                {currentStep === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <div className="text-center space-y-2 mb-6">
                            <h3 className="text-xl font-bold text-white">Chcesz dołączyć?</h3>
                            <p className="text-white/60 text-sm">Możesz przekazać napiwek anonimowo lub założyć konto, aby śledzić historię.</p>
                        </div>

                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="create_account"
                                    className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
                                    checked={formData.create_account}
                                    onChange={(e) => setFormData({ ...formData, create_account: e.target.checked })}
                                />
                                <label htmlFor="create_account" className="text-white text-sm cursor-pointer select-none">
                                    {t('tippingCreateAccountLabel')}
                                </label>
                            </div>

                            <AnimatePresence>
                                {formData.create_account && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <Input
                                            type="email"
                                            placeholder={t('emailPlaceholder')}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-pink-500 transition-colors"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <Button onClick={handleNext} className="w-full bg-white text-black font-bold py-6 rounded-xl hover:bg-gray-100 mt-4">
                            Dalej
                        </Button>
                    </motion.div>
                )}

                {currentStep === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                         <div className="text-center">
                            <span className="text-sm text-white/50 uppercase tracking-wider font-semibold">Kwota wsparcia</span>
                            <div className="flex justify-center items-end gap-2 mt-2">
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                    className="bg-transparent text-5xl font-bold text-white text-center w-32 focus:outline-none border-b-2 border-white/10 focus:border-pink-500 transition-colors pb-1"
                                />
                                <span className="text-2xl text-white/60 font-bold mb-2">{formData.currency}</span>
                            </div>
                         </div>

                         <div className="grid grid-cols-4 gap-2">
                             {presetAmounts.map(amt => (
                                 <button
                                    key={amt}
                                    onClick={() => setFormData({ ...formData, amount: amt })}
                                    className={cn(
                                        "py-2 rounded-xl text-sm font-bold transition-all",
                                        formData.amount === amt
                                            ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30 scale-105"
                                            : "bg-white/5 text-white/60 hover:bg-white/10"
                                    )}
                                 >
                                     {amt}
                                 </button>
                             ))}
                         </div>

                         <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl">
                            <input
                                type="checkbox"
                                id="terms"
                                className="mt-1 w-4 h-4 accent-pink-500 rounded cursor-pointer shrink-0"
                                checked={formData.terms_accepted}
                                onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                            />
                            <label htmlFor="terms" className="text-xs text-white/60 cursor-pointer select-none">
                                {t('tippingAcceptTerms')} <span className="text-pink-400 hover:underline">Regulamin</span>
                            </label>
                        </div>

                        <Button
                            onClick={handleNext}
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            {isProcessing ? "Przetwarzanie..." : "Przejdź do płatności"}
                        </Button>
                    </motion.div>
                )}

                {currentStep === 2 && clientSecret && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/30">
                                <CreditCard className="text-white" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Płatność bezpieczna</h3>
                            <p className="text-white/50 text-sm">Stripe zabezpiecza transakcję</p>
                        </div>

                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#ec4899' } } }}>
                            <CheckoutForm clientSecret={clientSecret} onClose={closeTippingModal}/>
                        </Elements>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default TippingModal;

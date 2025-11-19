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
import { X } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK!);

const CheckoutForm = ({ clientSecret, onClose }: { clientSecret: string, onClose: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { t } = useTranslation();
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
            addToast(error.message || 'An unexpected error occurred', 'error');
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            addToast('Payment successful!', 'success');
            onClose();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            <Button disabled={isProcessing || !stripe || !elements} className="mt-4 w-full">
                {isProcessing ? "Processing..." : "Pay now"}
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
    amount: 5,
    currency: 'PLN',
    create_account: false,
    terms_accepted: false,
  });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isTermsVisible, setIsTermsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      setCurrentStep(1);
      if (user?.email) {
        setFormData(prev => ({ ...prev, email: user.email }));
      }
    } else {
        setCurrentStep(0);
    }
  }, [isLoggedIn, user]);

  if (!isTippingModalOpen) return null;

  const handleNext = async () => {
    // Step 0 -> 1: Email validation
    if (currentStep === 0) {
      if (formData.create_account) {
        if (!formData.email) {
          addToast(t('errorEmailRequired', { lang: 'pl' }), 'error');
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          addToast(t('errorInvalidEmail', { lang: 'pl' }), 'error');
          return;
        }
      }
      setCurrentStep(1);
    }

    // Step 1 -> 2: Amount & terms validation and payment intent creation
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
            addToast(data.error || 'Failed to create payment intent', 'error');
        }
      } catch (error) {
          addToast('An unexpected error occurred', 'error');
      } finally {
          setIsProcessing(false);
      }
    }
  };

  const renderStep = () => {
    if (isTermsVisible) {
        return (
            <div>
                <h2 className="text-xl font-bold mb-4">{t('termsTitle')}</h2>
                <div className="space-y-2 text-sm text-gray-400">
                    <p>{t('termsContent1')}</p>
                    <p>{t('termsContent2')}</p>
                </div>
                <Button onClick={() => setIsTermsVisible(false)} className="mt-4">{t('back')}</Button>
            </div>
        );
    }
    switch (currentStep) {
      case 0:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">{t('tippingStep1Desc')}</h2>
            <div className="flex items-center space-x-2 mb-4">
                <input type="checkbox" id="create_account" checked={formData.create_account} onChange={(e) => setFormData({ ...formData, create_account: e.target.checked })} />
                <label htmlFor="create_account">{t('tippingCreateAccountLabel')}</label>
            </div>
            {formData.create_account && (
              <Input
                type="email"
                placeholder={t('emailPlaceholder')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            )}
          </div>
        );
      case 1:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">{t('tippingStep2Desc')}</h2>
             <div className="flex items-center space-x-2 mb-4">
                <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-2/3"
                />
                <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'PLN' | 'EUR' | 'USD' | 'GBP' })} className="w-1/3 p-2 rounded bg-gray-700">
                    <option value="PLN">PLN</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                </select>
             </div>
             <div className="flex items-center space-x-2">
                <input type="checkbox" id="terms_accepted" checked={formData.terms_accepted} onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })} />
                <label htmlFor="terms_accepted">
                    {t('tippingAcceptTerms')} <a href="#" onClick={(e) => { e.preventDefault(); setIsTermsVisible(true); }} className="underline">{t('termsLink')}</a>
                </label>
            </div>
          </div>
        );
      case 2:
        if (!clientSecret) return <div>Loading...</div>;
        const options: StripeElementsOptions = { clientSecret, appearance: { theme: 'night' } };
        return (
          <Elements stripe={stripePromise} options={options}>
            <h2 className="text-xl font-bold mb-4">{t('tippingSummaryLabel')}</h2>
            <p>{t('amount')}: {formData.amount.toFixed(2)} {formData.currency}</p>
            <CheckoutForm clientSecret={clientSecret} onClose={closeTippingModal}/>
          </Elements>
        );
      case 3:
        return <div>Processing...</div>; // Should be handled by CheckoutForm's isProcessing
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white w-full max-w-md relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('tipTitle')}</h2>
          <button onClick={closeTippingModal} className="text-white p-1 hover:bg-gray-700 rounded-full"><X size={24} /></button>
        </div>
        <div>{renderStep()}</div>
        {currentStep < 2 && !isTermsVisible && (
            <div className="mt-4 flex justify-end">
                <Button onClick={handleNext} disabled={isProcessing}>{t('tippingNext')}</Button>
            </div>
        )}
      </div>
    </div>
  );
};

export default TippingModal;

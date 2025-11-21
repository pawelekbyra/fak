"use client";

import React, { useState, useMemo, useCallback, memo } from 'react';
import { Input } from '@/components/ui/input'; 
import { Button } from '@/components/ui/button'; 
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { shallow } from 'zustand/shallow';

// --- Helper & Translations ---

const translations = {
    tippingTitle: 'Bramka Napiwkowa',
    tippingNext: 'DALEJ',
    tippingPay: 'PŁACĘ',
    tippingTermsTitle: 'Regulamin i Warunki',
    tippingSummaryLabel: 'Kwota napiwku:',
    changingButtonText: 'Przetwarzam...',
    emailPlaceholder: 'Twój adres email (opcjonalnie)',
    amountPlaceholder: 'Kwota',
    createAccountLabel: 'Stwórz konto, aby śledzić napiwki',
    termsLabel: 'Akceptuję regulamin',
    errorEmailRequired: 'Adres email jest wymagany.',
    errorInvalidEmail: 'Podaj poprawny adres email.',
    errorMinTipAmount: 'Minimalna kwota napiwku to {minAmount} {currency}.',
    errorTermsNotAccepted: 'Musisz zaakceptować regulamin.',
};

// Renamed to avoid "Rules of Hooks" confusion
const translate = (key: keyof typeof translations, replacements?: Record<string, string | number>): string => {
    let text = translations[key] || key;
    if (replacements) {
        for (const [k, v] of Object.entries(replacements)) {
            text = text.replace(`{${k}}`, String(v));
        }
    }
    return text;
};

// --- Logic Hook ---

const useTippingLogic = () => {
    // Integrate with Global Store
    const { isTippingModalOpen, closeTippingModal } = useStore(state => ({
        isTippingModalOpen: state.isTippingModalOpen,
        closeTippingModal: state.closeTippingModal
    }), shallow);

    const [currentStep, setCurrentStep] = useState(0); // 0, 1, 2
    const [isProcessing, setIsProcessing] = useState(false);
    const [isTermsVisible, setIsTermsVisible] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        createAccount: false,
        amount: 10.00,
        currency: 'EUR',
        termsAccepted: false,
    });
    const [localError, setLocalError] = useState('');

    const totalVisualSteps = 3;

    // Moved out to avoid dependency issues or memoized
    const steps = useMemo(() => [
        { label: 'Opcje', step: 0 },
        { label: 'Kwota', step: 1 },
        { label: 'Płatność', step: 2 },
    ], []);

    const stepLabels = useMemo(() => steps.map(s => s.label), [steps]);

    const handleNext = useCallback(() => {
        setLocalError('');
        
        if (currentStep === 0) {
            if (formData.createAccount && !formData.email) {
                setLocalError(translate('errorEmailRequired'));
                return;
            }
            setCurrentStep(1);

        } else if (currentStep === 1) {
            if (formData.amount < 1) {
                 setLocalError(translate('errorMinTipAmount', { minAmount: 1, currency: formData.currency }));
                 return;
            }
            if (!formData.termsAccepted) {
                 setLocalError(translate('errorTermsNotAccepted'));
                 return;
            }
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                setCurrentStep(2); 
            }, 500);
        }
    }, [currentStep, formData]);

    const handlePrev = useCallback(() => {
        setLocalError('');
        if (isTermsVisible) {
            setIsTermsVisible(false);
        } else {
            setCurrentStep(prev => Math.max(0, prev - 1));
        }
    }, [isTermsVisible]);

    const handleSubmit = useCallback(async () => {
        if (currentStep === 2) {
            setIsProcessing(true);
            
            await new Promise(resolve => setTimeout(resolve, 2000)); 

            setIsProcessing(false);
            closeTippingModal(); // Close on success
        }
    }, [currentStep, closeTippingModal]);

    const handleClose = useCallback(() => {
        closeTippingModal();
        // Reset state if needed, or let it persist
        // setCurrentStep(0);
    }, [closeTippingModal]);

    return {
        isOpen: isTippingModalOpen,
        currentStep,
        stepLabels,
        totalVisualSteps,
        isProcessing,
        isTermsVisible,
        formData,
        localError,
        setFormData,
        handleNext,
        handlePrev,
        handleSubmit,
        handleClose,
        setIsTermsVisible,
    };
};

// --- Sub-components ---

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    stepLabels: string[];
}

const ProgressBar = memo<ProgressBarProps>(({ currentStep, totalSteps, stepLabels }) => {
    const progressWidth = ((currentStep + 1) / totalSteps) * 100;
    const accentColor = 'bg-pink-600';

    return (
        <div className="w-full mb-6 pt-4 px-6">
            <div className="flex justify-between relative mb-2">
                {Array.from({ length: totalSteps }).map((_, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 z-10">
                        <div 
                            className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                                index <= currentStep ? "bg-pink-600 text-white" : "bg-gray-700 text-gray-400 border-2 border-gray-700"
                            )}
                        >
                            {index + 1}
                        </div>
                        <span className={cn(
                            "text-xs mt-1 transition-colors duration-300 text-center",
                            index <= currentStep ? "text-pink-600 font-medium" : "text-gray-500"
                        )}>
                            {stepLabels[index]}
                        </span>
                    </div>
                ))}
            </div>
            
            <div className="h-1 bg-gray-700 rounded-full relative overflow-hidden">
                <div 
                    className={cn(
                        "h-full rounded-full transition-all duration-500 ease-in-out",
                        accentColor
                    )} 
                    style={{ width: `${progressWidth}%` }} 
                />
            </div>
        </div>
    );
});

ProgressBar.displayName = 'ProgressBar';

interface StepProps {
    formData: ReturnType<typeof useTippingLogic>['formData'];
    setFormData: ReturnType<typeof useTippingLogic>['setFormData'];
}

const Step0Email = ({ formData, setFormData }: StepProps) => (
    <div className="space-y-6 px-6 py-4">
        <div className="flex items-center space-x-3">
            <input
                id="createAccount"
                type="checkbox"
                checked={formData.createAccount}
                onChange={(e) => setFormData(prev => ({ ...prev, createAccount: e.target.checked }))}
                className="
                    h-5 w-5 rounded border-gray-600 bg-gray-700 text-pink-600 
                    focus:ring-pink-500 focus:ring-offset-gray-900 focus:ring-2
                    appearance-none checked:bg-pink-600 checked:border-transparent 
                    transition duration-150 ease-in-out cursor-pointer
                "
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
            />
            <label htmlFor="createAccount" className="text-gray-300 cursor-pointer text-base">
                {translate('createAccountLabel')}
            </label>
        </div>
        
        <div className={cn("transition-all duration-300 overflow-hidden", formData.createAccount ? 'opacity-100 h-auto pt-2' : 'opacity-0 h-0 p-0 m-0')}>
            <label htmlFor="email" className="text-gray-400 text-sm mb-1 block">Email</label>
            <Input
                id="email"
                type="email"
                placeholder={translate('emailPlaceholder')}
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-pink-600"
                autoComplete="email"
            />
        </div>
    </div>
);

const Step1Amount = ({ formData, setFormData }: StepProps) => {
    const availableCurrencies = ['EUR', 'PLN', 'USD', 'GBP'];

    return (
        <div className="space-y-6 px-6 py-4">
            <label className="text-gray-400 text-sm mb-1 block">Kwota Napiwku</label>
            <div className="flex gap-4">
                <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min={formData.currency === 'PLN' ? 5 : 1}
                    placeholder={translate('amountPlaceholder')}
                    value={formData.amount > 0 ? formData.amount : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-pink-600"
                />
                
                <div className="relative">
                    <select
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className="
                            w-[100px] h-10 bg-gray-800 border border-gray-700 text-white 
                            rounded-md pl-3 pr-8 text-sm leading-5 focus:outline-none 
                            focus:border-pink-600 appearance-none transition duration-150
                        "
                    >
                        {availableCurrencies.map(c => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

            <div className="flex items-start space-x-3 pt-4">
                <input
                    id="termsAccepted"
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                    className="
                        h-5 w-5 rounded border-gray-600 bg-gray-700 text-pink-600 
                        focus:ring-pink-500 focus:ring-offset-gray-900 focus:ring-2
                        appearance-none checked:bg-pink-600 checked:border-transparent 
                        transition duration-150 ease-in-out cursor-pointer mt-1
                    "
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                />
                <label htmlFor="termsAccepted" className="text-gray-300 cursor-pointer text-base">
                    {translate('termsLabel')} (
                    <span 
                        onClick={() => setFormData(prev => ({ ...prev, isTermsVisible: true }))}
                        className="text-pink-600 hover:text-pink-400 transition cursor-pointer"
                    >
                        pokaż
                    </span>)
                </label>
            </div>
        </div>
    );
};

interface Step2PaymentProps {
    formData: ReturnType<typeof useTippingLogic>['formData'];
    isProcessing: boolean;
}

const Step2Payment = ({ formData, isProcessing }: Step2PaymentProps) => (
    <div className="space-y-6 px-6 py-4">
        <p id="tippingSummaryAmount" className="text-lg font-semibold text-center text-pink-500 border-b border-gray-700 pb-2">
            {translate('tippingSummaryLabel')} {(formData.amount || 0).toFixed(2)} {formData.currency.toUpperCase()}
        </p>

        <label className="text-gray-400 text-sm mb-2 block">Dane do płatności</label>
        
        <div id="payment-element" className={cn(
            "min-h-[150px] bg-gray-800 p-3 rounded-lg border-2 border-gray-700 flex items-center justify-center transition-all duration-300",
            !isProcessing && "opacity-100",
            isProcessing && "opacity-50"
        )}>
            {isProcessing ? (
                <p className="text-pink-500 font-medium">{translate('changingButtonText')}</p>
            ) : (
                <p className="text-gray-500">Stripe Payment Element (ładowanie formularza)</p>
            )}
        </div>

        <div id="payment-message" className="text-red-500 text-sm" />
    </div>
);

const TermsContent = ({ setIsTermsVisible }: { setIsTermsVisible: (val: boolean) => void }) => (
    <div className="absolute inset-0 z-50 bg-gray-900 rounded-lg p-6 flex flex-col">
        <h2 className="text-xl font-bold text-white text-center mb-4">{translate('tippingTermsTitle')}</h2>
        <div className="flex-1 overflow-y-auto text-gray-400 text-sm space-y-3 p-2 bg-gray-800 rounded-md">
            <p>To jest miejsce na szczegółowy regulamin dotyczący napiwków i płatności.</p>
            <p>1. Akceptacja regulaminu jest obowiązkowa w celu przejścia do płatności.</p>
            <p>2. Minimalna kwota napiwku wynosi 1 EUR / 5 PLN.</p>
            <p>3. Dziękujemy za wsparcie!</p>
            <p>Zgodnie z prototypem, ta treść jest wyświetlana, gdy użytkownik kliknie &quot;pokaż&quot; obok checkboxa z akceptacją regulacji.</p>
        </div>
        <div className="mt-4 flex justify-end">
            <Button
                onClick={() => setIsTermsVisible(false)}
                variant="outline"
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
                &larr; Powrót
            </Button>
        </div>
    </div>
);

// --- Main Component ---

const TippingModal = () => {
    const { 
        isOpen,
        currentStep, 
        stepLabels, 
        totalVisualSteps, 
        isProcessing, 
        isTermsVisible,
        formData, 
        localError,
        setFormData, 
        handleNext, 
        handlePrev, 
        handleSubmit, 
        handleClose,
        setIsTermsVisible
    } = useTippingLogic(); 

    if (!isOpen) return null;

    const title = isTermsVisible ? translate('tippingTermsTitle') : translate('tippingTitle');

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return <Step0Email formData={formData} setFormData={setFormData} />;
            case 1:
                return <Step1Amount formData={formData} setFormData={setFormData} />;
            case 2:
                return <Step2Payment formData={formData} isProcessing={isProcessing} />;
            case 3:
                return (
                    <div className="text-center p-8">
                        <svg className="mx-auto w-16 h-16 text-pink-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                            <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75"></path>
                        </svg>
                        <h3 className="mt-4 text-xl font-semibold text-white">{translate('changingButtonText')}</h3>
                        <p className="mt-2 text-gray-400">Proszę nie zamykać okna...</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={handleClose}>
            <div 
                className={cn(
                    "relative bg-gray-900 text-white rounded-xl shadow-2xl transition-all duration-300 p-0 border border-gray-700",
                    isTermsVisible ? "max-w-xl" : "max-w-md",
                    "w-full"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={handleClose} 
                    className="absolute top-3 right-3 text-gray-500 hover:text-white transition z-10 p-2"
                    aria-label="Zamknij"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <div className="p-6 pb-0">
                    <h2 className="text-center text-2xl font-bold text-white relative">
                        {title}
                    </h2>
                </div>

                {!isTermsVisible && currentStep < 3 && (
                    <ProgressBar 
                        currentStep={currentStep} 
                        totalSteps={totalVisualSteps} 
                        stepLabels={stepLabels}
                    />
                )}
                
                <div className="relative flex-1 min-h-[250px] overflow-y-auto">
                    {renderStepContent()}
                    {isTermsVisible && <TermsContent setIsTermsVisible={setIsTermsVisible} />}
                </div>

                {!isTermsVisible && currentStep < 3 && (
                    <div className="px-6 py-4 border-t border-gray-800">
                        {localError && (
                            <p className="text-red-400 text-sm mb-4 text-center">{localError}</p>
                        )}
                        
                        <div className="flex justify-between items-center gap-4">
                            {currentStep > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={handlePrev}
                                    className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                                    disabled={isProcessing}
                                >
                                    &larr; Wstecz
                                </Button>
                            )}

                            <Button
                                onClick={currentStep === 2 ? handleSubmit : handleNext}
                                disabled={isProcessing}
                                className={cn(
                                    "w-full bg-pink-600 text-white font-bold hover:bg-pink-700 transition duration-150",
                                    (currentStep === 0) ? "w-full" : (currentStep > 0 && currentStep < 2) ? "ml-auto" : "w-full"
                                )}
                            >
                                {isProcessing ? (
                                    <div className="flex items-center justify-center">
                                        <span className="animate-spin mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                                        {translate('changingButtonText')}
                                    </div>
                                ) : (
                                    currentStep === 2 ? translate('tippingPay') : translate('tippingNext')
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TippingModal;

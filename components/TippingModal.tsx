"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useUser } from '@/context/UserContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/store/useStore';
import { X, Sparkles, Heart, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK!);

const StripeLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="25" viewBox="0 0 120 60" fillRule="evenodd" fill="#000000">
        <path d="M101.547 30.94c0-5.885-2.85-10.53-8.3-10.53-5.47 0-8.782 4.644-8.782 10.483 0 6.92 3.908 10.414 9.517 10.414 2.736 0 4.805-.62 6.368-1.494v-4.598c-1.563.782-3.356 1.264-5.632 1.264-2.23 0-4.207-.782-4.46-3.494h11.24c0-.3.046-1.494.046-2.046zM90.2 28.757c0-2.598 1.586-3.678 3.035-3.678 1.402 0 2.897 1.08 2.897 3.678zm-14.597-8.345c-2.253 0-3.7 1.057-4.506 1.793l-.3-1.425H65.73v26.805l5.747-1.218.023-6.506c.828.598 2.046 1.448 4.07 1.448 4.115 0 7.862-3.3 7.862-10.598-.023-6.667-3.816-10.3-7.84-10.3zm-1.38 15.84c-1.356 0-2.16-.483-2.713-1.08l-.023-8.53c.598-.667 1.425-1.126 2.736-1.126 2.092 0 3.54 2.345 3.54 5.356 0 3.08-1.425 5.38-3.54 5.38zm-16.4-17.196l5.77-1.24V13.15l-5.77 1.218zm0 1.747h5.77v20.115h-5.77zm-6.185 1.7l-.368-1.7h-4.966V40.92h5.747V27.286c1.356-1.77 3.655-1.448 4.368-1.195v-5.287c-.736-.276-3.425-.782-4.782 1.7zm-11.494-6.7L34.535 17l-.023 18.414c0 3.402 2.552 5.908 5.954 5.908 1.885 0 3.264-.345 4.023-.76v-4.667c-.736.3-4.368 1.356-4.368-2.046V25.7h4.368v-4.897h-4.37zm-15.54 10.828c0-.897.736-1.24 1.954-1.24a12.85 12.85 0 0 1 5.7 1.47V21.47c-1.908-.76-3.793-1.057-5.7-1.057-4.667 0-7.77 2.437-7.77 6.506 0 6.345 8.736 5.333 8.736 8.07 0 1.057-.92 1.402-2.207 1.402-1.908 0-4.345-.782-6.276-1.84v5.47c2.138.92 4.3 1.3 6.276 1.3 4.782 0 8.07-2.368 8.07-6.483-.023-6.85-8.782-5.632-8.782-8.207z"/>
    </svg>
);

// --- DYNAMIC BACKGROUND ICONS ---
interface FloatingIconData {
    id: number;
    type: 'sparkle' | 'heart' | 'star';
    top: string;
    left: string;
    scale: number;
    duration: number;
}

const DynamicBackground = () => {
    const [icons, setIcons] = useState<FloatingIconData[]>([]);

    useEffect(() => {
        const addIcon = () => {
            const id = Date.now() + Math.random();
            const types: ('sparkle' | 'heart' | 'star')[] = ['sparkle', 'heart', 'star'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            const icon: FloatingIconData = {
                id,
                type,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                scale: 0.5 + Math.random() * 0.8,
                duration: 2 + Math.random() * 3,
            };

            setIcons(prev => [...prev, icon]);

            setTimeout(() => {
                setIcons(prev => prev.filter(i => i.id !== id));
            }, icon.duration * 1000);
        };

        // ZWIĘKSZONA GĘSTOŚĆ: co 30ms (ok. 3x częściej niż wcześniej)
        const interval = setInterval(addIcon, 30);
        
        // ZWIĘKSZONA PULA STARTOWA: 60 elementów
        for(let i=0; i<60; i++) addIcon();

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <AnimatePresence>
                {icons.map((icon) => (
                    <motion.div
                        key={icon.id}
                        className="absolute text-white/40"
                        style={{ top: icon.top, left: icon.left }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ 
                            opacity: [0, 0.9, 0], 
                            scale: [0, icon.scale, 0],
                            y: [0, -10 + Math.random() * 20, 0]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: icon.duration, ease: "easeInOut" }}
                    >
                        {icon.type === 'sparkle' && <Sparkles size={12} />}
                        {icon.type === 'heart' && <Heart size={14} fill="currentColor" />}
                        {icon.type === 'star' && <Star size={10} fill="currentColor" />}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// --- FIREWORKS SYSTEM ---

const SingleFirework = ({ top, left, scale }: { top: string, left: string, scale: number }) => {
    const particleCount = 20; 
    const particles = Array.from({ length: particleCount });

    return (
        <div className="absolute pointer-events-none z-0" style={{ top, left }}>
            {particles.map((_, i) => {
                const angle = (i / particleCount) * 360;
                const radians = (angle * Math.PI) / 180;
                const distance = (Math.random() * 80 + 30) * scale; 
                const targetX = Math.cos(radians) * distance;
                const targetY = Math.sin(radians) * distance + (Math.random() * 20);

                return (
                    <motion.div
                        key={i}
                        className="absolute bg-white rounded-full shadow-[0_0_6px_3px_rgba(255,255,255,0.6)]"
                        style={{ 
                            width: 3 * scale, 
                            height: 3 * scale 
                        }}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1.5 }}
                        animate={{
                            x: targetX,
                            y: targetY,
                            opacity: [1, 0.8, 0],
                            scale: [1.5, 0.5, 0],
                        }}
                        transition={{
                            duration: 1.2 + Math.random(),
                            ease: [0.25, 0.1, 0.25, 1],
                        }}
                    />
                );
            })}
        </div>
    );
};

const FireworksBackground = () => {
    const [fireworks, setFireworks] = useState<{ id: number; top: string; left: string; scale: number }[]>([]);

    useEffect(() => {
        // ZWIĘKSZONA CZĘSTOTLIWOŚĆ FAJERWERKÓW (co 130ms - 400ms)
        const spawnFirework = () => {
            const newId = Date.now() + Math.random();
            const top = `${Math.random() * 80 + 10}%`;
            const left = `${Math.random() * 80 + 10}%`;
            const scale = 0.5 + Math.random() * 1.0; 

            setFireworks(prev => [...prev, { id: newId, top, left, scale }]);

            setTimeout(() => {
                setFireworks(prev => prev.filter(fw => fw.id !== newId));
            }, 2500);
            
            // Kolejny wybuch bardzo szybko
            setTimeout(spawnFirework, 130 + Math.random() * 270);
        };

        const timeout = setTimeout(spawnFirework, 200);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px]">
            <AnimatePresence>
                {fireworks.map(fw => (
                    <SingleFirework key={fw.id} top={fw.top} left={fw.left} scale={fw.scale} />
                ))}
            </AnimatePresence>
        </div>
    );
};

// --- NEW: COMETS ANIMATION ---

const CometsBackground = () => {
    const [comets, setComets] = useState<{ id: number; top: string; left: string; scale: number }[]>([]);

    useEffect(() => {
        const spawnComet = () => {
            const newId = Date.now() + Math.random();
            // Startują głównie z prawej strony lub góry
            const startRight = Math.random() > 0.5;
            
            setComets(prev => [...prev, { 
                id: newId, 
                // Jeśli start z prawej: left > 100%, top losowy. Jeśli z góry: top < 0%, left losowy.
                top: startRight ? `${Math.random() * 60}%` : `-10%`, 
                left: startRight ? `110%` : `${50 + Math.random() * 50}%`,
                scale: 0.5 + Math.random() * 0.8
            }]);

            setTimeout(() => {
                setComets(prev => prev.filter(c => c.id !== newId));
            }, 2000); 

            // SPORO KOMET: co ok. 200-500ms
            setTimeout(spawnComet, 200 + Math.random() * 300);
        };

        const timeout = setTimeout(spawnComet, 500);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[24px]">
            <AnimatePresence>
                {comets.map(comet => (
                    <motion.div
                        key={comet.id}
                        className="absolute"
                        style={{ top: comet.top, left: comet.left, scale: comet.scale }}
                        initial={{ opacity: 0, x: 0, y: 0 }}
                        animate={{ 
                            opacity: [0, 1, 1, 0], 
                            x: -600, // Lot w lewo
                            y: 600   // Lot w dół
                        }}
                        transition={{ duration: 1.2 + Math.random() * 0.5, ease: "easeIn" }}
                    >
                        {/* Głowa komety */}
                        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" />
                        {/* Ogon komety */}
                        <div className="absolute top-0 right-0 w-[80px] h-[2px] bg-gradient-to-r from-transparent via-white/50 to-white origin-right transform -rotate-45 -translate-x-[78px] translate-y-[2px]" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};


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
            <div className="mb-6 min-h-[200px] mix-blend-multiply">
                <PaymentElement 
                    options={{ 
                        layout: 'tabs',
                    }} 
                />
            </div>
            <button
                disabled={isProcessing || !stripe || !elements}
                className="w-full py-4 rounded-xl font-black text-white text-lg bg-neutral-900 border border-black/20 shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 tracking-widest relative overflow-hidden group"
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
        className="relative w-[90%] max-w-[420px] max-h-[85vh] flex flex-col rounded-[24px] shadow-[0_0_100px_-20px_rgba(234,179,8,0.6)] overflow-hidden bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border-[3px] border-black pointer-events-auto"
      >
        <div className="absolute inset-0 border-[6px] border-transparent rounded-[21px] pointer-events-none overflow-hidden z-[50]">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 animate-[shine-border_4s_infinite]" />
        </div>

        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/noise.png')] mix-blend-overlay z-0"></div>

        {/* Dynamiczny background (gwiazdki, serca, iskry) */}
        <DynamicBackground />
        
        {/* Komety (WARSTWA KOMET) */}
        <CometsBackground />

        {/* Fajerwerki */}
        <FireworksBackground />
        
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/60 z-20"></div>

        <div className="relative p-6 text-center shrink-0 border-b border-black/5 bg-white/10 backdrop-blur-sm z-10">
            <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-xl font-black text-black tracking-wide drop-shadow-sm opacity-90 whitespace-nowrap">
                    Bramka Napiwkowa
                </h2>
                <Sparkles className="text-white w-4 h-4 animate-pulse" />
            </div>
            {/* Przycisk X: top-2 right-2 */}
            <button
                onClick={closeTippingModal}
                className="absolute right-2 top-2 p-2 text-black hover:text-black/70 hover:bg-black/5 rounded-full transition-colors z-50"
            >
                <X size={20} strokeWidth={3} />
            </button>
        </div>

        <div className="h-1.5 w-full bg-black/10 relative overflow-hidden z-10">
            <motion.div
                className="h-full bg-neutral-900"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            />
        </div>

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
                                <p className="text-lg font-bold text-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] tracking-wide">Założyć konto patrona?</p>
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
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 z-10", 
                                        formData.create_account 
                                            ? "bg-white border-white scale-110" 
                                            : "border-black/40 group-hover:border-black/70"
                                    )}>
                                        {formData.create_account && <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full" />}
                                    </div>
                                    
                                    <span className={cn("text-base font-bold transition-colors z-10", formData.create_account ? "text-white" : "text-black/70")}>
                                        No jacha!
                                    </span>
                                </div>
                            )}

                            <div className={cn("space-y-3 overflow-hidden transition-all duration-500", (formData.create_account) ? "max-h-[200px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-4")}>
                                <div className="group relative">
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
                                                colorPrimary: '#171717', 
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
                    className="group flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black text-lg text-white bg-neutral-900 border border-white/10 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.5)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden tracking-widest"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    {isProcessing ? (
                        <span className="animate-pulse">PRZETWARZANIE...</span>
                    ) : (
                        "ENTER"
                    )}
                </button>
            </div>
        )}

        <div className="pb-4 pt-2 flex items-center justify-center bg-black/5 backdrop-blur-sm z-10 border-t border-black/5">
             <div className="flex items-center gap-0 opacity-60 hover:opacity-100 transition-all duration-300">
                  <span className="text-[10px] text-black font-bold">Powered by</span>
                  <div className="relative flex items-center">
                      <StripeLogo />
                  </div>
             </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TippingModal;

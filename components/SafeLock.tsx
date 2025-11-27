'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Unlock, Lock, Delete, CornerDownLeft } from 'lucide-react';

const CORRECT_CODE = "96789";

export const SafeLock = () => {
    const [input, setInput] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (isError) {
            const timer = setTimeout(() => {
                setIsError(false);
                setInput("");
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isError]);

    const handlePress = (digit: string) => {
        if (isUnlocked || isError) return;
        if (input.length < 8) { // Arbitrary max length to prevent overflow
            setInput(prev => prev + digit);
        }
    };

    const handleDelete = () => {
        if (isUnlocked || isError) return;
        setInput(prev => prev.slice(0, -1));
    };

    const handleEnter = () => {
        if (input === CORRECT_CODE) {
            setIsUnlocked(true);
        } else {
            setIsError(true);
        }
    };

    if (isUnlocked) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center min-h-[300px] text-white space-y-4 py-10"
            >
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-2 ring-2 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    <Unlock size={40} className="text-green-500" />
                </div>
                <h3 className="font-bold text-xl text-green-400">Sejf Otwarty</h3>
                <p className="text-sm text-center px-8 text-white/60">
                    Masz dostęp do ukrytej zawartości.
                </p>
                {/* Mock Content */}
                <div className="grid grid-cols-3 gap-1 w-full mt-4 px-1 opacity-50 pointer-events-none grayscale">
                    {[1, 2, 3].map(i => (
                         <div key={i} className="aspect-[3/4] bg-neutral-800 rounded-sm relative">
                             <div className="absolute inset-0 flex items-center justify-center text-white/20 font-bold text-xs">SECRET</div>
                         </div>
                    ))}
                </div>
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col items-center pt-8 pb-12 px-4 w-full max-w-sm mx-auto select-none">
            {/* Display Screen */}
            <div className="mb-8 w-full">
                <div className={`
                    bg-[#0a0a0a] border-2 rounded-2xl h-20 flex items-center justify-center relative overflow-hidden shadow-inner
                    transition-colors duration-300
                    ${isError ? 'border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]' : 'border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]'}
                `}>
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                         style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
                    </div>

                    <AnimatePresence mode="wait">
                        {isError ? (
                            <motion.span
                                key="error"
                                initial={{ x: 0 }}
                                animate={{ x: [-10, 10, -10, 10, 0] }}
                                transition={{ duration: 0.4 }}
                                className="text-red-500 font-mono text-xl tracking-widest uppercase font-bold"
                            >
                                BŁĄD
                            </motion.span>
                        ) : (
                            <div className="flex gap-3">
                                {input.split('').map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-4 h-4 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                                    />
                                ))}
                                {input.length === 0 && (
                                    <span className="text-white/20 text-sm animate-pulse">PODAJ KOD</span>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4 w-full px-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <KeyButton key={digit} onClick={() => handlePress(digit.toString())}>
                        {digit}
                    </KeyButton>
                ))}

                {/* Bottom Row */}
                <div className="flex items-center justify-center">
                    <button
                        onClick={handleDelete}
                        className="w-16 h-16 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 active:scale-90 transition-all"
                    >
                        <Delete size={24} />
                    </button>
                </div>

                <KeyButton onClick={() => handlePress("0")}>0</KeyButton>

                <div className="flex items-center justify-center">
                    <button
                        onClick={handleEnter}
                        className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-900/30 active:scale-90 active:shadow-sm transition-all"
                    >
                        <CornerDownLeft size={28} />
                    </button>
                </div>
            </div>

            <p className="mt-8 text-xs text-white/20 font-mono tracking-widest">SECURE ACCESS V1.0</p>
        </div>
    );
};

const KeyButton = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => (
    <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className="
            relative w-full aspect-square rounded-full flex items-center justify-center
            bg-[#1a1a1a] border border-white/5
            text-2xl font-semibold text-white
            shadow-lg active:shadow-inner
            hover:bg-[#252525] hover:border-white/10
            transition-colors
        "
    >
        {children}
    </motion.button>
);

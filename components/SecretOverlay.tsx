import React from 'react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/context/LanguageContext';

const SecretOverlay: React.FC = () => {
    const { setActiveModal } = useStore(state => ({ setActiveModal: state.setActiveModal }));
    const { t } = useTranslation();

    const openLoginModal = () => {
        setActiveModal('login');
    };

    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-5 backdrop-blur-md bg-black/40" style={{ paddingBottom: '20%' }}>
            {/* Ikona kłódki (Heroicons outline) */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-6 text-white/90 drop-shadow-md">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-md">Top Secret</h2>
            <p className="text-base text-white/80 drop-shadow-sm">
                <button onClick={openLoginModal} className="underline decoration-2 underline-offset-2 border-white cursor-pointer font-semibold text-white">Zaloguj się</button> <span className="text-white/80">aby odblokować</span>
            </p>
        </div>
    );
};

export default SecretOverlay;

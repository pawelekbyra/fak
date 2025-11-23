import React from 'react';
import { useTranslation } from '@/context/LanguageContext';

const PwaOverlay: React.FC = () => {
    const { t } = useTranslation();

    const handleInstallClick = () => {
        // Trigger PWA install prompt if available (logic handled by global listener usually)
        // For now just show instruction or rely on browser UI
        const installEvent = (window as any).deferredPrompt;
        if (installEvent) {
            installEvent.prompt();
        } else {
             alert('Aby zainstalować aplikację, użyj menu przeglądarki (Dodaj do ekranu głównego).');
        }
    };

    return (
        <div className="absolute top-[var(--topbar-height)] left-0 w-full h-[calc(100%-var(--topbar-height)-var(--bottombar-height))] z-50 flex flex-col items-center justify-center text-center p-5 backdrop-blur-md bg-black/40">
            {/* Ikona kłódki (Heroicons outline) */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-6 text-white/90 drop-shadow-md">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-md">Treść Dostępna w Aplikacji</h2>
            <p className="text-base text-white/80 drop-shadow-sm">
                <button onClick={handleInstallClick} className="underline decoration-2 underline-offset-2 border-white cursor-pointer">{t('downloadApp') || 'Pobierz aplikację'}</button>, aby odblokować
            </p>
        </div>
    );
};

export default PwaOverlay;

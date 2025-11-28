"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Providers } from "@/components/Providers";
import AppLayout from "@/components/AppLayout";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Script from "next/script";

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Sprawdzenie, czy API jest dostępne i czy jesteśmy w przeglądarce
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(() => {
          // Opcjonalne logowanie
          console.log('Service Worker registered successfully.');
        })
        .catch(err => {
          console.error('Service Worker registration failed:', err);
        });
    }
  }, []);

  if (pathname?.startsWith("/robert") || pathname?.startsWith("/setup")) {
    return (
      <Providers>
        {children}
      </Providers>
    );
  }

  return (
    <Providers>
      <AppLayout>{children}</AppLayout>
      <Script
        data-name="BMC-Widget"
        data-cfasync="false"
        src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
        data-id="pawelperfect"
        data-description="Support me on Buy me a coffee!"
        data-message=""
        data-color="#FF5F5F"
        data-position="Right"
        data-x_margin="18"
        data-y_margin="18"
      />
    </Providers>
  );
}

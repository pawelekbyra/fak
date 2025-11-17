# Aplikacja do skrolowania typu tiktok z pionowym feedem z modelem dostepu do sekretnych slajdow po wplacie napiwka przez bramke stripe.

## Priorytetowy Plan Wdrożenia (Wersja Punktowa)

### Faza I: 🏗️ Fundament Architektoniczny i Danych (Szkielet MVP)
To jest ABSOLUTNA PODSTAWA – projekt bez tego nie ruszy.

1.  **Fundament Technologiczny**: Ustanowienie szkieletu projektu (Next.js App Router, TypeScript).
2.  **Typowanie Kodu**: Pełne wdrożenie TypeScript dla modeli danych (User, Comment, Slide, Donation).
3.  **Baza Danych**: Weryfikacja i stabilizacja połączenia z Neon (PostgreSQL), optymalizacja pod Serverless (connection pooling).
4.  **PRIORYTET WIZUALNY**: Pełne wdrożenie Tailwind CSS i przyjęcie Shadcn UI dla wszystkich standardowych komponentów (spójność i dostępność).
5.  **Konfiguracja Globalna**: Wczesna konfiguracja Internacjonalizacji (next-intl) i routingu pod obsługę języków (/[lang]/app/*).

### Faza II: 🔐 Core Backendu, Autoryzacja i Czytanie Danych
Celem jest bezpieczeństwo i wyświetlenie głównego feedu wideo.

1.  **System Autoryzacji**: Wdrożenie Custom JWT i Next.js Middleware do weryfikacji sesji i ochrony ścieżek.
2.  **Logika Uwierzytelniania**: Przeniesienie tworzenia konta/logowania do Route Handlers (/api/auth/).
3.  **Pobieranie Danych (Server-First)**: Przeniesienie głównej logiki pobierania danych (SLIDES, USERS) do asynchronicznych Server Components (read-only), wykorzystując fetch i Next.js Caching.
4.  **Wymuszenie Profilu**: Implementacja logiki wymuszenia uzupełnienia profilu (First Login Modal).

### Faza III: 💰 Płatności, Mutacje i Infrastruktura Wideo (Krytyczna Konwersja)
Faza kluczowa dla modelu biznesowego (płatności) i podstawowej funkcjonalności (dostarczanie wideo).

1.  **Infrastruktura Wideo (KRYTYCZNE)**: Wdrożenie CDN (Cloudflare Stream/AWS S3), ustawienie transkodowania Adaptive Streaming (HLS/DASH).
    *   **Brakujące Narzędzie**: Wdrożenie dedykowanego odtwarzacza wideo (np. hls.js).
2.  **Storage Assetów**: Migracja Avatars/Wideo/Obrazów na Oddzielny Storage (S3/Vercel Blob) i wdrożenie next/image.
    *   **Brakujące Narzędzie**: SDK dla chmury (@aws-sdk/client-s3 lub @vercel/blob).
3.  **Modal Napiwku (Płatności)**: Odtworzenie TippingModal.tsx i integracja z logiką Stripe (kontrola dostępu do sekretnych slajdów na podstawie modelu Donation).
4.  **PRIORYTET ZAPISU**: Przekształcenie logiki POST/PUT/DELETE (polubienia, komentarze, aktualizacje) na Next.js Server Actions ('use server').
5.  **Rewalidacja Danych**: Wdrożenie revalidatePath i revalidateTag w Server Actions.
6.  **Ograniczenie Częstości**: Zaimplementowanie Rate Limiting na krytycznych Server Actions i API Routes.
    *   **Brakujące Narzędzie**: Dedykowana biblioteka (np. rate-limiter-flexible lub upstash/redis).
7.  **Komentarze**: Konwersja logiki Własnego Systemu Komentarzy na Server Actions.

### Faza IV: ✨ Funkcjonalności Zaawansowane i Stan
Wdrożenie interaktywności i zarządzania stanem.

1.  **Zarządzanie Stanem UI**: Wdrożenie Zustand do zarządzania lekkim stanem (modal komentarzy, stan gracza wideo).
2.  **Walidacja Formularzy**: Wdrożenie React Hook Form do walidacji i kontroli pól formularzy.
3.  **Komponent Komentarzy**: Odtworzenie CommentsSection.jsx i integracja z Server Actions / Real-Time.
4.  **Real-Time Updates**: Integracja zewnętrznego serwisu (Pusher/Ably) dla polubień slajdów i komentarzy.
5.  **Web Push**: Pełne wdrożenie Notyfikacji Web Push (Service Worker, UI oraz logika subskrypcji).

### Faza V: ✅ Optymalizacja i Finalizacja (Produkcja)
Finalne szlify przed wdrożeniem i dbałość o jakość produkcyjną.

1.  **Monitorowanie Błędów**: Zintegrowanie Sentry do monitorowania błędów serwera (Server Actions) i klienta.
2.  **Analityka**: Dodanie Google Analytics 4 / Amplitude w app/layout.tsx.
3.  **SEO/Metadane**: Wprowadzenie Dynamicznych Metadanych Next.js (Open Graph/Twitter Cards).
4.  **Internacjonalizacja**: Uzupełnienie wszystkich brakujących tłumaczeń (i18n).
5.  **Generowanie Zasobów**: Automatyczne generowanie map witryny (sitemaps) i kanałów RSS.

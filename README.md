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

   📚 README: Ting Tong – Nowoczesny Ekosystem Monetyzacji (Next.js App Router)
Ting Tong to innowacyjna platforma wideo typu Progressive Web App (PWA), zaprojektowana w oparciu o architekturę Next.js (App Router) i hostowana na Vercel. Stanowi manifest twórczej suwerenności, łącząc wciągający format wideo (TikTok-style) z modelem bezpośredniego wsparcia finansowego (Patronite).

1. Architektura i Konfiguracja Bezpieczeństwa
Cel: Zapewnienie szybkiej, natywnej aplikacji opartej na React/Next.js, która obsługuje w pełni automatyczny lejek monetyzacji i bezpieczną komunikację Serverless.

Stos Technologiczny: Opiera się na Server Actions, Serverless Functions (API Routes) i globalnym zarządzaniu stanem za pomocą Zustand.

Weryfikacja Sesji: Kluczowa funkcja verifySession() z modułu lib/auth.ts musi chronić wszystkie Server Actions i Route Handlery wymagające autoryzacji (np. dodawanie komentarzy, lajkowanie).

Kluczowe Zmienne Środowiskowe (Vercel Secrets)
DATABASE_URL: Klucz do połączenia z bazą danych (np. Neon/Supabase).

SESSION_SECRET: Klucz do weryfikacji i szyfrowania sesji użytkowników.

VAPID_PRIVATE_KEY / NEXT_PUBLIC_VAPID_PUBLIC_KEY: Para kluczy do bezpiecznego podpisywania i rejestracji subskrypcji dla powiadomień WebPush.

STRIPE_SECRET_KEY: Klucz tajny do autoryzacji żądań API Stripe (tworzenie Payment Intent).

NEXT_PUBLIC_STRIPE_PK: Klucz publiczny Stripe do inicjalizacji biblioteki Stripe.js na frontendzie.

2. Wdrożony System Komentarzy (Logika Replyke + Server Actions)
System komentarzy został wdrożony, wiernie odtwarzając kluczowe mechanizmy logiki z projektu `replyke/monorepo`, ale z wykorzystaniem nowoczesnego stosu technologicznego opartego o Next.js Server Actions, co eliminuje potrzebę tworzenia dedykowanych API Routes.

A. Architektura Backendu (Server Actions)
Cała logika backendowa została umieszczona w pliku `lib/comment-actions.ts` i opiera się na czterech kluczowych akcjach serwerowych:
- `addComment`: Dodaje nowy komentarz lub odpowiedź.
- `updateComment`: Aktualizuje treść istniejącego komentarza.
- `deleteComment`: Realizuje miękkie usuwanie (soft delete) komentarza.
- `toggleCommentVote`: Obsługuje system głosowania (upvote/downvote).

Wszystkie akcje są zabezpieczone za pomocą funkcji `verifySession()` z `lib/auth.ts` i wykorzystują `zod` do walidacji danych wejściowych. Logika bazodanowa została zaimplementowana w `lib/db-postgres.ts` i jest w pełni zgodna ze schemą danych `replyke`.

B. Logika Frontendowa i Zarządzanie Stanem
- **Budowanie Drzewa Komentarzy (`lib/comments/tree.ts`):** Logika budowania zagnieżdżonej struktury komentarzy została wiernie przeniesiona z `replyke`, włącznie z kluczowym mechanizmem obronnym zapobiegającym dodawaniu odpowiedzi do nieistniejących rodziców.
- **Centralny Hak (`hooks/use-comment-section.ts`):** Cały stan i logika UI sekcji komentarzy są zarządzane przez ten hak. Odpowiada on za pobieranie danych, budowanie drzewa, obsługę interakcji (np. wybór komentarza do odpowiedzi) i wywoływanie Server Actions.
- **Zarządzanie Stanem Globalnym (Zustand):** Widoczność modala komentarzy jest kontrolowana przez globalny store Zustand (`store/useStore.ts`), co pozwala na jego otwieranie z dowolnego miejsca w aplikacji poprzez wywołanie `setActiveModal('comments')`.

C. Komponenty UI (`components/comments/`)
Interfejs użytkownika został zbudowany w sposób modularny i w pełni ostylowany w nowoczesnym, "tiktokowym" stylu (ciemny motyw, animacje `framer-motion`), wykorzystując bibliotekę `shadcn/ui` dla spójności wizualnej.
- `CommentsModal.tsx`: Główny komponent-modal, który integruje wszystkie pozostałe. Asynchronicznie pobiera komentarze po otwarciu i wyświetla stan ładowania.
- `CommentsList.tsx` i `CommentItem.tsx`: Odpowiedzialne za rekurencyjne renderowanie drzewa komentarzy.
- `CommentForm.tsx`: Formularz do dodawania komentarzy, zintegrowany z Server Actions.

D. Rekomendacje i Dalszy Rozwój
Obecna implementacja stanowi solidny fundament. Dalsze prace powinny skupić się na:
1.  **Powiadomienia w Czasie Rzeczywistym:** Integracja z usługą taką jak Pusher lub Ably, aby komentarze i głosy pojawiały się na żywo, bez potrzeby odświeżania.
2.  **Obsługa Załączników:** Rozbudowa `CommentForm` i `CommentItem` o możliwość dodawania i wyświetlania obrazów (np. GIF-ów), wykorzystując Vercel Blob.
3.  **Zaawansowana Moderacja:** Stworzenie panelu administracyjnego do zarządzania komentarzami (usuwanie, edycja).
4.  **Optymistyczne UI:** Udoskonalenie `useCommentSection` o mechanizmy optymistycznego UI, aby interfejs reagował natychmiastowo, a dane synchronizowały się w tle.

3. Wielokrokowy Modal Napiwków (TippingModal)
Komponent TippingModal.tsx musi odtworzyć wieloetapowy przepływ, który automatyzuje proces zostania Patronem.

Zarządzanie Stanem: Komponent wykorzystuje lokalny stan currentStep (0, 1, 2, 3) oraz flagę isTermsVisible (4) do kontrolowania widoku.

Krok 0/1: Walidacja Kwoty i Użytkownika:

Krok ten jest pomijany, jeśli użytkownik jest już zalogowany.

Wymaga poprawnego emaila (jeśli wybrano utworzenie konta) i minimalnej wpłaty: 5.00 PLN lub 1.00 w innych walutach (EUR, USD, GBP).

Akceptacja Regulaminu jest obowiązkowa, a kliknięcie linku przenosi do pełnego widoku warunków (Krok 4).

Krok Płatności (Inicjacja Intentu):

Po walidacji, komponent wywołuje POST /api/payments/create-intent (Server Action), aby bezpiecznie uzyskać clientSecret ze Stripe.

Wykorzystuje to do dynamicznego renderowania <PaymentElement />.

UX/Stylizacja:

Modal musi stosować dynamiczną zmianę wysokości (np. przez style inline lub bibliotekę) po załadowaniu Payment Element, aby uniknąć frustrujących skoków interfejsu (CSS: --tipping-fixed-height).

Kolor akcentu w elemencie płatności Stripe musi być ustawiony na #ff0055 (motyw night).

Finalizacja: Po stripe.confirmPayment(), Server Action POST /api/payments/handle-tip-success potwierdza pomyślny napiwek.

🛠️ Kierunki Rozwoju i Braki Infrastrukturalne
Przed pełną produkcją konieczne jest wdrożenie brakujących elementów infrastruktury:

Rate Limiting: Wdrożenie dedykowanego mechanizmu na Server Actions (/api/comments, /api/comments/like) do zapobiegania spamowi i nadużyciom.

Real-Time Updates: Integracja z usługą typu Pusher/Ably do natychmiastowego dostarczania powiadomień i aktualizacji komentarzy na żywo.

Storage SDK: Wdrożenie rozwiązania do przechowywania danych (np. Vercel Blob, S3) do zarządzania avatarami użytkowników oraz załącznikami obrazów w komentarzach.

Admin Panel: Ukończenie interfejsu administracyjnego dla zarządzania slajdami i użytkownikami.


Pełna Migracja Systemu Komentarzy i powiadomien- skopiowanie jej logiki i wswszystkeigo na varunki naszego projektu z projektu https://github.com/replyke/monorepo. zacznij od skompiowania badz przeczytania tego repo. mamy to miec do joty przepisane na nasz jezyk a na koncu stworzyc modal w ladnym tiktokowym stylu . Kopia 1:1 Logiki Replyke na Next.js/Vercel)🚨 Cel Projektu (Kopia Logiki Replyke)Zadaniem jest odtworzenie logiki systemu komentarzy i powiadomień z plików źródłowych Replyke (m.in. addCommentsToTree.ts, comment-section-context.tsx) oraz Route Handlers z projektu Fak, jako jednolity, kompleksowy system w środowisku Next.js App Router/Vercel. Wszelkie mechanizmy obronne i struktury danych z Replyke muszą zostać zachowane.I. 🔑 Konfiguracja Bezpieczeństwa i Backend (Vercel API Routes)Programista musi skonfigurować niezbędne zmienne i przenieść logikę serwerową do katalogu app/api/.ZmiennaLokalizacjaCelŹródło / WymaganeDATABASE_URLVercel SecretsPołączenie z bazą danych (np. Neon/Supabase).Wymagane dla lib/db.ts.SESSION_SECRETVercel SecretsKlucz do weryfikacji i szyfrowania sesji.Wymagane dla lib/auth.ts.VAPID_SUBJECTVercel SecretsKontakt e-mail lub URL dla WebPush.Wymagane przez web-push.VAPID_PRIVATE_KEYVercel SecretsKlucz Tajny WebPush. Używany do podpisywania powiadomień.Wymagany przez web-push.NEXT_PUBLIC_VAPID_PUBLIC_KEYFrontend (z prefiksem NEXT_PUBLIC_)Klucz Publiczny WebPush. Używany przez Service Worker i logikę rejestracji subskrypcji.Wymagany na kliencie.II. 🏗️ Integracja Brakującej Infrastruktury (Kluczowe dla Projektu)Programista musi wdrożyć poniższe, zanim logika komentarzy będzie w pełni produkcyjna:Ograniczenie Częstości (Rate Limiting) (Faza III): Wdrożenie dedykowanej biblioteki (rate-limiter-flexible / upstash/redis) na Server Actions dla dodawania komentarzy i likowania, aby zapobiec spamowi.Real-Time Updates (Pusher/Ably) (Faza IV): Integracja zewnętrznego serwisu (Pusher/Ably) do obsługi natychmiastowych powiadomień o nowych komentarzach, odpowiedziach i polubieniach.SDK Storage (Faza III): Wdrożenie SDK do przechowywania (np. S3/Vercel Blob) w celu zarządzania awatarami użytkowników, które są wyświetlane w sekcji komentarzy.Zarządzanie Stanem UI (Zustand) (Faza IV): Wdrożenie Zustand do globalnego zarządzania stanem modali komentarzy, odpowiedzi i notyfikacji.III. 🎯 Migracja Logiki Backendu i Frontend Core (Kopia 1:1)1. System Komentarzy (app/api/comments/route.ts)FunkcjonalnośćMetodaLogika (Kopia 1:1 z plików źródłowych)Pobieranie KomentarzyGETPrzyjmuje slideId. Wywołuje db.getComments(slideId). Wymaga walidacji slideId.Dodawanie KomentarzaPOST1. Autoryzacja: Wymaga verifySession() (401 Unauthorized). 2. Walidacja: Sprawdzenie slideId, text. Oczyszczenie tekstu: const sanitizedText = sanitize(text.trim()). 3. Sprawdzenie slajdu: Weryfikacja: const slide = await db.getSlide(slideId) (404 Not Found). 4. Zapis: `db.addComment(slideId, currentUser.id, sanitizedText, parentIdLikenowanie/GłosowaniePOST /api/comments/likeWymaga verifySession(). Odtworzenie logiki z pliku app/api/comments/like/route.ts (np. db.upvoteComment lub db.downvoteComment).2. System Powiadomień (app/api/notifications/route.ts)FunkcjonalnośćMetodaLogika (Kopia 1:1 z plików źródłowych)PobieranieGETWymaga: verifySession(). Pobiera: db.getNotifications(userId) i db.getUnreadNotificationCount(userId). Ustaw nagłówki Cache-Control: no-cache, no-store, must-revalidate.Rejestracja PWAPOSTWymaga: verifySession(). Zapisuje subskrypcję do bazy: db.savePushSubscription(userId, subscription, isPwaInstalled).Wysyłka (ADMIN)POST /api/notifications/sendAutoryzacja: Wymaga verifySession() i payload.user.role !== 'admin' (403 Forbidden). Użycie webpush.sendNotification().Oznaczanie jako PrzeczytanePOST /api/notifications/mark-as-readWymaga verifySession(). Odtworzenie logiki z pliku app/api/notifications/mark-as-read/route.ts (np. db.markNotificationsAsRead).3. Budowanie Drzewa Komentarzy (helpers/addCommentsToTree.ts)Programista musi skopiować i użyć dokładną logikę z pliku replyke/monorepo/.../addCommentsToTree.ts:Mechanizm Ochronny: W funkcji addSingleCommentToTree, jeśli newComment.parentId jest obecne, Musi zostać wdrożone sprawdzenie: if (!entityCommentsTree[newComment.parentId]) return entityCommentsTree;.Cel: Zapewnia to krytyczny mechanizm obronny przed błędami, które wystąpiłyby przy próbie dodania odpowiedzi do komentarza, którego obiekt rodzica nie jest jeszcze załadowany w stanie Redux/Zustand.Technika: Wszelkie aktualizacje drzewa muszą być wykonywane z użyciem niezmienności (immutability) poprzez operator spread ({...}).IV. 🖥️ Frontend UI, Service Worker i Stan1. Komponenty i Kontekst DanychZarządzanie Stanem: Odtworzenie CommentSectionContext oraz hooka useCommentSectionData w celu utrzymania entityCommentsTree i funkcji akcji (fetchComments, createComment, upvoteComment).Komponent CommentItem.tsx: Musi renderować: Awatar (pobierany z Storage SDK), Czas (FromNow – inferowane z replyke/monorepo), Treść (z parsowaniem Mentionów – inferowane z replyke/monorepo), i przyciski akcji (Odpowiedz, Polub).Formularz: Musi akceptować stan parentId do obsługi odpowiedzi i wysyłać go do Server Action.2. Service Worker i PWA NotificationsSerwis Klienta (Hook/Utility): Utworzenie modułu rejestrującego Service Worker i wysyłającego obiekt subskrypcji (z użyciem NEXT_PUBLIC_VAPID_PUBLIC_KEY) do POST /api/notifications.Plik Service Worker (public/sw.js): Upewnienie się, że logika nasłuchiwania na zdarzenie push i wyświetlania powiadomień (self.registration.showNotification(title, options)) jest poprawnie wdrożona w pliku.Musi obsługiwać notificationclick do przekierowania użytkownika na odpowiedni url z payloadu.

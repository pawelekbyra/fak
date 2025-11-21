# FAK / Ting Tong (Next-Gen) 🚀
Next-Gen Vertical Video Platform with Direct Creator Monetization.

Witaj w dokumentacji produkcyjnej wersji Ting Tong (FAK). To nie jest zwykły klon TikToka. To platforma, która oddaje władzę twórcom, eliminując pośredników i algorytmy. Projekt łączy wirusowość krótkich form wideo z modelem subskrypcyjnym (Patronite/OnlyFans), ale we własnym, kontrolowanym ekosystemie.

📚 **Spis Treści**
1. [💡 Filozofia: O co tu chodzi?](#-filozofia-o-co-tu-chodzi)
2. [🛠 Technologia: Na czym stoimy?](#-technologia-na-czym-stoimy)
3. [🚀 ROADMAPA: Co i dlaczego musimy zbudować?](#-roadmapa-co-i-dlaczego-musimy-zbudować)
    *   [Faza 1: Silnik Wideo (Płynność ponad wszystko)](#faza-1-silnik-wideo-płynność-ponad-wszystko)
    *   [Faza 2: Komentarze i Społeczność (Gold Standard)](#faza-2-komentarze-i-społeczność-gold-standard)
    *   [Faza 3: Architektura i Bezpieczeństwo Typów (Clean Code)](#faza-3-architektura-i-bezpieczeństwo-typów-clean-code)
4. [📦 Instalacja: Jak to odpalić?](#-instalacja-jak-to-odpalić)
5. [🔑 Zmienne Środowiskowe](#-zmienne-środowiskowe)

---

## 💡 Filozofia: O co tu chodzi?
Większość platform (TikTok, Instagram) traktuje użytkownika jak towar sprzedawany reklamodawcom. My budujemy "Anty-establishment creator economy".

Nasz model biznesowy opiera się na **Lejku Konwersji (Three-Tier Funnel)**:

1.  **Public (TOFU):** Dajemy ludziom darmowe próbki (wideo publiczne), aby budować zasięg organiczny.
2.  **PWA-Secret (MOFU):** Zachęcamy do instalacji aplikacji (PWA na pulpit), oferując treści "Soft-Locked". Budujemy retencję i możliwość wysyłania powiadomień Push.
3.  **Patron (BOFU):** To jest cel. Fani płacą bezpośrednio Twórcy (przez Stripe), aby odblokować pełny dostęp. Bez cenzury, bez ucinania zasięgów przez algorytmy.

---

## 🛠 Technologia: Na czym stoimy?
Projekt to nowoczesna aplikacja typu Serverless, zoptymalizowana pod mobile.

*   **Frontend:** Next.js 14 (App Router) – Hybrydowy rendering (SSR + CSR) dla szybkości i SEO.
*   **Baza Danych:** PostgreSQL (Neon) – Skalowalna baza SQL w chmurze.
*   **ORM:** Prisma – Typowane bezpiecznie zapytania do bazy danych.
*   **Styling:** Tailwind CSS + Shadcn UI – Komponenty interfejsu.
*   **State Management:** Zustand (Slice Pattern) – Modularne zarządzanie stanem aplikacji.
*   **Real-time:** Ably – Obsługa powiadomień i komentarzy na żywo.

---

## 🚀 ROADMAPA: Co i dlaczego musimy zbudować?
Oto aktualny plan prac technicznych, mający na celu przekształcenie prototypu w produkt klasy "Enterprise".

### Faza 1: Silnik Wideo (Płynność ponad wszystko)
Cel: Osiągnięcie "TikTokowej" płynności (0ms opóźnienia przy scrollowaniu) i eliminacja lagów.

#### 1.1. Wirtualizacja Feedu (react-virtuoso)
Zamiast renderować setki filmów naraz (co zabija pamięć RAM telefonu), używamy wirtualizacji.
*   [x] Wybór biblioteki: `react-virtuoso`.
*   [x] Wdrożenie: Zastąpienie manualnego scrollowania komponentem `<Virtuoso>`.
*   [x] Efekt: W DOM przeglądarki istnieją tylko 3 aktywne slajdy (poprzedni, obecny, następny). Reszta jest wirtualna.

#### 1.2. Architektura "Double Buffering" (Podwójny Odtwarzacz)
Eliminujemy czarny ekran przy zmianie wideo.
*   [x] Mechanizm: Dwa elementy `<video>` (Player A i Player B) w `GlobalVideoPlayer`.
*   [x] Logika: Gdy Player A odtwarza obecny film, Player B w tle ładuje i buforuje następny (`nextSlide`).
*   [x] Swap: Przy scrollu następuje natychmiastowa zamiana widoczności i start odtwarzania z Playera B.

### Faza 2: Komentarze i Społeczność (Gold Standard)
Cel: Obsługa tysięcy komentarzy, wątków (replies) i interakcji w czasie rzeczywistym bez obciążania bazy.

#### 2.1. Baza Danych (Schema Refactor)
Aktualizacja schematu Prisma, aby obsługiwał zaawansowane relacje.
*   [x] Self-Referencing Relation: Dodanie pola `parentId` w modelu `Comment` (obsługa odpowiedzi na komentarz).
*   [x] Comment Likes: Nowa tabela `CommentLike` łącząca Usera i Komentarz (unikalne lajki).
*   [x] Indeksy: Optymalizacja zapytań po `slideId` i `parentId`.

#### 2.2. Backend & DTO (Type Safety)
*   [x] Shared DTOs: Wprowadzenie `CommentWithRelations` w `lib/dto.ts` – jedno źródło prawdy dla typów Frontend/Backend.
*   [x] Zod Validation: Runtime walidacja odpowiedzi z API.
*   [ ] Cursor-Based Pagination: Zmiana endpointu `GET /api/comments` z pobierania wszystkiego na stronicowanie kursorowe (ładowanie po 20 sztuk).
*   [x] Logic Update: Aktualizacja `lib/db-postgres.ts` o obsługę mapowania zagnieżdżonych odpowiedzi i lajków.

#### 2.3. Frontend (UX)
*   [x] Optimistic Updates: Komentarz pojawia się natychmiast, zanim serwer potwierdzi zapis.
*   [ ] Nested UI: Renderowanie drzewiastej struktury dyskusji w `CommentsModal`.
*   [ ] Lazy Loading Replies: Przycisk "Pokaż odpowiedzi" zamiast ładowania wszystkiego naraz.

### Faza 3: Architektura i Bezpieczeństwo Typów (Clean Code)
Cel: Eliminacja długu technologicznego, poprawa stabilności i Developer Experience (DX).

*   [x] **Module Augmentation (NextAuth):** Rozszerzenie typów `Session` i `User` w `types/next-auth.d.ts`. Eliminacja rzutowania `as any` w `lib/auth.ts`.
*   [x] **Zustand Slice Pattern:** Podział monolitycznego magazynu stanu (`useStore`) na domeny logiczne:
    *   `createVideoSlice`: Odtwarzacz wideo.
    *   `createUISlice`: Modale i interfejs.
    *   `createContentSlice`: Zarządzanie feedem i slajdami.
    *   `createInteractionSlice`: Lajki i interakcje.
*   [x] **Zod Recursion Fix:** Poprawa definicji typów dla zagnieżdżonych komentarzy w `lib/validators.ts` poprzez jawne interfejsy TypeScript.

---

## 📦 Instalacja: Jak to odpalić?
Standardowa procedura startowa dla dewelopera.

1.  **Pobierz kod:**
    ```bash
    git clone <adres_repozytorium>
    cd ting-tong-next
    ```

2.  **Zainstaluj zależności:**
    ```bash
    npm install
    # lub
    yarn install
    ```

3.  **Skonfiguruj Bazę Danych:**
    Upewnij się, że masz plik `.env` (patrz sekcja niżej). Następnie zsynchronizuj schemat:
    ```bash
    npx prisma generate   # Generuje klienta TypeScript
    npx prisma db push    # Aktualizuje strukturę bazy danych na Neon/Postgres
    ```

4.  **Wgraj dane testowe (Seed):**
    Wypełnij bazę przykładowymi slajdami i użytkownikami:
    ```bash
    npm run db:seed-test
    ```

5.  **Uruchom serwer deweloperski:**
    ```bash
    npm run dev
    # lub
    yarn dev
    ```
    Aplikacja dostępna pod adresem: http://localhost:3000

---

## 🔑 Zmienne Środowiskowe
Utwórz plik `.env.local` w głównym katalogu. Wymagane klucze:

```env
# Baza Danych (Neon/Postgres)
DATABASE_URL="postgresql://..."

# Autoryzacja (NextAuth.js)
AUTH_SECRET="wygeneruj_losowy_string_openssl_rand_base64_32"
NEXTAUTH_URL="http://localhost:3000"

# Płatności (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Real-time (Ably)
ABLY_API_KEY="twoj_klucz_ably"

# Blob Storage (Vercel Blob - opcjonalnie dla wideo)
BLOB_READ_WRITE_TOKEN="..."
```

Status Projektu: **Active Development / Refactoring Phase**. Ostatnia aktualizacja dokumentacji: **Listopad 2025**.

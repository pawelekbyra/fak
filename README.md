# Polutek (Next-Gen) 🚀
Next-Gen Vertical Video Platform with Direct Creator Monetization.

Witaj w dokumentacji produkcyjnej wersji Polutek. To nie jest zwykły klon TikToka. To platforma, która oddaje władzę twórcom, eliminując pośredników i algorytmy. Projekt łączy wirusowość krótkich form wideo z modelem subskrypcyjnym (Patronite/OnlyFans), ale we własnym, kontrolowanym ekosystemie.

📚 **Spis Treści**
1. [💡 Filozofia: O co tu chodzi?](#-filozofia-o-co-tu-chodzi)
2. [🛠 Technologia: Na czym stoimy?](#-technologia-na-czym-stoimy)
3. [🚀 ROADMAPA: Co i dlaczego musimy zbudować?](#-roadmapa-co-i-dlaczego-musimy-zbudować)
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

*   [x] **Wirtualizacja Feedu:** Używamy `Virtuoso` zamiast renderować setki divów.
*   [x] **Double Buffering:** Dwa playery wideo działające na przemian (active/next), aby wyeliminować mruganie przy zmianie slajdu.

### Faza 2: Komentarze i Społeczność (Gold Standard)
Cel: Obsługa tysięcy komentarzy, wątków (replies) i interakcji w czasie rzeczywistym.

*   [x] **Schema Refactor:** Dodanie relacji `parentId` dla zagnieżdżonych komentarzy.
*   [x] **Optimistic UI:** Natychmiastowe dodawanie komentarzy na froncie przed odpowiedzią serwera.
*   [x] **Real-time:** Synchronizacja komentarzy przez WebSockets (Ably).
*   [x] **Auth Gate:** Warunkowe wyświetlanie formularza tylko dla zalogowanych.
*   [x] **Sticky Footer:** Pole tekstowe przyklejone do dołu na mobile.

### Faza 3: UX i Polish (Dopracowanie detali)
Cel: Poprawa wrażeń użytkownika (Look & Feel).

*   [x] **Profil Autora:** Połączenie Sidebara z backendem, wyświetlanie prawdziwych slajdów twórcy.
*   [x] **Interaktywne elementy:** Lepszy feedback przy klikaniu ikon (efekt tap) dla niezalogowanych.
*   [x] **TopBar:** Animowany "dropdown" przycisku logowania ("Nie masz psychy").

---

## 📦 Instalacja: Jak to odpalić?
Standardowa procedura startowa dla dewelopera.

1.  **Pobierz kod:**
    ```bash
    git clone <adres_repozytorium>
    cd polutek
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
    Napraw spójność danych autora i wgraj przykładowe treści:
    ```bash
    npx tsx scripts/fix-author-data.ts
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
Utwórz plik `.env` (lub `.env.local`) w głównym katalogu. Poniżej znajduje się szablon wymaganych zmiennych.

**Ważne:** Nigdy nie commituj prawdziwych haseł do repozytorium!

```env
# --- DATABASE (Neon / Vercel Postgres) ---
# Zalecany connection string (Pooling)
DATABASE_URL="postgresql://neondb_owner:*******@ep-plain-scene-agjwcwk3-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Opcjonalnie: Connection string bez poolingu (do migracji/deploy)
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:*******@ep-plain-scene-agjwcwk3.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Parametry pomocnicze (opcjonalne, zależnie od klienta SQL)
PGHOST="ep-plain-scene-agjwcwk3-pooler.c-2.eu-central-1.aws.neon.tech"
PGUSER="neondb_owner"
PGDATABASE="neondb"
# PGPASSWORD="***"

# --- AUTH (NextAuth.js) ---
AUTH_SECRET="wygeneruj_losowy_string_openssl_rand_base64_32"
NEXTAUTH_URL="http://localhost:3000"

# --- PAYMENT (Stripe) ---
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# --- REAL-TIME (Ably) ---
ABLY_API_KEY="twoj_klucz_ably"

# --- STACK (Auth / Analytics - opcjonalne) ---
NEXT_PUBLIC_STACK_PROJECT_ID="***"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="***"
STACK_SECRET_SERVER_KEY="***"
```

Status Projektu: **Active Development**. Ostatnia aktualizacja: **Listopad 2025**.

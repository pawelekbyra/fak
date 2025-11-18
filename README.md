# Ting Tong - Aplikacja Społecznościowa

## Opis Projektu

Ting Tong to nowoczesna aplikacja internetowa typu PWA (Progressive Web App) inspirowana popularnymi platformami społecznościowymi. Umożliwia użytkownikom dzielenie się krótkimi treściami wideo i tekstowymi, komentowanie oraz interakcje z innymi. Aplikacja została zbudowana w oparciu o najnowsze technologie webowe, z silnym naciskiem na real-time'owe doświadczenia użytkownika.

## Architektura i Technologie

Aplikacja została zbudowana na solidnym, nowoczesnym stosie technologicznym, który zapewnia wydajność, skalowalność i doskonałe doświadczenia deweloperskie.

*   **Framework:** [Next.js](https://nextjs.org/) (App Router) - Umożliwia renderowanie po stronie serwera (SSR), generowanie statycznych stron (SSG) i tworzenie API w jednym miejscu.
*   **Język:** [TypeScript](https://www.typescriptlang.org/) - Zapewnia bezpieczeństwo typów i ułatwia pracę z dużym kodem.
*   **Baza Danych:** [PostgreSQL](https://www.postgresql.org/) (zarządzana przez [Vercel Postgres](https://vercel.com/storage/postgres)) - Wydajna i niezawodna relacyjna baza danych.
*   **ORM:** [Prisma](https://www.prisma.io/) - Nowoczesny ORM, który ułatwia interakcje z bazą danych i zapewnia bezpieczeństwo typów.
*   **Stylowanie:** [Tailwind CSS](https://tailwindcss.com/) - Umożliwia szybkie i spójne stylowanie komponentów bez opuszczania kodu HTML.
*   **Komponenty UI:** [shadcn/ui](https://ui.shadcn.com/) - Zestaw gotowych, konfigurowalnych komponentów, które przyspieszają pracę.
*   **Zarządzanie Stanem:** [Zustand](https://zustand-demo.pmnd.rs/) - Prosta i wydajna biblioteka do zarządzania globalnym stanem aplikacji.
*   **Testowanie:** [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Standard branżowy do testowania aplikacji React.

## Uruchomienie Projektu Lokalnie

Aby uruchomić projekt na swoim komputerze, postępuj zgodnie z poniższymi krokami:

1.  **Sklonuj repozytorium:**
    ```bash
    git clone https://github.com/twoja-nazwa-uzytkownika/ting-tong-next.git
    cd ting-tong-next
    ```

2.  **Zainstaluj zależności:**
    Projekt używa `yarn` jako menedżera pakietów.
    ```bash
    yarn install
    ```

3.  **Skonfiguruj zmienne środowiskowe:**
    Skopiuj plik `.env.example` do `.env` i uzupełnij go odpowiednimi wartościami. Będziesz potrzebować co najmniej `DATABASE_URL` do połączenia z bazą danych oraz `JWT_SECRET` do uwierzytelniania.
    ```bash
    cp .env.example .env
    ```

4.  **Uruchom migracje bazy danych:**
    Aby zsynchronizować schemat bazy danych z modelem Prisma, uruchom poniższą komendę:
    ```bash
    npx prisma migrate dev
    ```

5.  **Uruchom serwer deweloperski:**
    ```bash
    yarn dev
    ```
    Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

## Dostępne Skrypty

*   `yarn dev`: Uruchamia aplikację w trybie deweloperskim.
*   `yarn build`: Buduje aplikację do wersji produkcyjnej.
*   `yarn start`: Uruchamia zbudowaną aplikację w trybie produkcyjnym.
*   `yarn test`: Uruchamia testy jednostkowe i integracyjne.
*   `yarn lint`: Analizuje kod w poszukiwaniu błędów i problemów ze stylem.

## Rekomendacje i Dalszy Rozwój

Chociaż aplikacja jest funkcjonalna, istnieje kilka obszarów, które można by ulepszyć w przyszłości:

*   **Rozbudowa Testów:** Obecnie projekt ma tylko podstawową konfigurację testów. Należy zwiększyć pokrycie kodu testami, zwłaszcza dla krytycznych ścieżek użytkownika.
*   **Obsługa `onDelete: Cascade`:** W schemacie Prisma powszechnie używane jest `onDelete: Cascade`, co stwarza ryzyko przypadkowej utraty danych. Warto rozważyć implementację mechanizmu "soft delete" (miękkiego usuwania) lub archiwizacji.
*   **Walidacja Danych Wejściowych:** Należy wprowadzić rygorystyczną walidację wszystkich danych przychodzących od użytkownika (np. za pomocą biblioteki `Zod`), aby zwiększyć bezpieczeństwo i stabilność aplikacji.
*   **Refaktoryzacja Komponentów:** Niektóre komponenty (np. `MainFeed.tsx`) są dość rozbudowane. Warto je podzielić na mniejsze, bardziej wyspecjalizowane części, aby poprawić czytelność i ułatwić utrzymanie kodu.

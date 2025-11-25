# 🔮 PROJEKT ZORDON: Autonomiczny System Operacyjny (AIOS)

**Wersja Dokumentu:** 1.0 (Architektura Docelowa)
**Rola:** Osobiste Centrum Dowodzenia i Cyfrowy "Druga Jaźń"

---

To jest kompletna dokumentacja architektoniczna i wizyjna Projektu Zordon (Lolek Core). Dokument ten syntetyzuje wszystkie przeprowadzone przez nas analizy (research na temat pamięci, sandb-oxingu, grafów wiedzy i autonomii) w jeden spójny plan.

Jest to **Masterplan**, który posłuży jako źródło prawdy dla każdego agenta AI (Julesa, Curse, Windsurfa), z którym będziesz pracował.

## 1. WIZJA I FILOZOFIA

Zordon nie jest chatbotem. Chatboty są reaktywne (odpowiadają, gdy pytasz) i amneztyczne (zapominają po zamknięciu karty). Zordon jest proaktywnym, trwałym bytem cyfrowym.

**Metafora:** Zordon z Power Rangers. Siedzi w swojej tubie (serwerze), widzi wszystko, co dzieje się w Twoim cyfrowym świecie (Github, Serwery, Maile), pamięta historię i deleguje zadania do specjalistów (Jules - Ranger Czerwony od kodu, Inni Agenci od researchu).

**Relacja:** Ty jesteś Dowódcą (Commander). Zordon jest Szefem Sztabu. Ty mówisz "Co z projektem X?", Zordon zbiera dane, analizuje i melduje, ewentualnie sugerując działania.

**Autopoiesis (Samostworzenie):** Unikalną cechą Zordona jest zdolność do modyfikowania własnego kodu źródłowego w celu nabywania nowych umiejętności pod Twoim nadzorem.

## 2. ARCHITEKTURA SYSTEMU (The Stack)

System został zaprojektowany jako Modularny Monolit w Next.js, hostowany w architekturze Serverless, ale z możliwością wykonywania długotrwałych procesów.

### A. Mózg (Intelligence Engine) 🧠
Odpowiada za rozumowanie, planowanie i generowanie odpowiedzi.

- **Technologia:** Vercel AI SDK (Core + UI).
- **Model Główny:** Google Gemini 1.5 Pro (lub najnowszy dostępny).
- **Dlaczego:** Gigantyczne okno kontekstowe (do 2M tokenów) pozwala Zordonowi "przeczytać" całe repozytorium kodu lub setki maili w jednym zapytaniu, co jest niemożliwe dla GPT-4.
- **Framework Agentowy:** LangChain (jako warstwa pomocnicza) lub natywne AI SDK Agents.

### B. Pamięć (The Hippocampus) 💾
Zgodnie z Twoim researchem, pamięć nie jest płaską listą. Jest strukturą trójwymiarową opartą na bazie Neon (Postgres).

- **Pamięć Epizodyczna (Episodic Memory):** "Dziennik pokładowy". Co zrobiliśmy, o czym rozmawialiśmy, jakie błędy wystąpiły.
  - **Technologia:** Tabela `Logs` i `Messages` w Postgres.
- **Pamięć Semantyczna (Semantic Memory & RAG):** Wiedza o świecie i Twoich projektach. Wyszukiwanie po znaczeniu, a nie słowach kluczowych.
  - **Technologia:** `pgvector` (rozszerzenie wektorowe do Postgresa) + Prisma.
- **Graf Wiedzy (Knowledge Graph - GraphRAG):** Mapa powiązań. Rozumienie, że Projekt A -> zależy od -> Biblioteki B -> którą napisał -> Autor C.
  - **Technologia:** Relacyjna struktura w Postgres modelująca węzły (Nodes) i krawędzie (Edges).

### C. Układ Nerwowy i Czas (Event Loop & Autonomy) ⏰
To, co odróżnia Zordona od ChatGPT. Zordon działa w czasie.

- **Problem:** Serwery Vercel usypiają po 10-60 sekundach.
- **Rozwiązanie:** Inngest.
- **Jak to działa:** Zordon przyjmuje zadanie ("Przeanalizuj logi z całego tygodnia"). Zamiast blokować czat, wysyła sygnał do Inngest. Inngest wybudza Zordona wielokrotnie w tle, pozwalając mu pracować godzinami.
- **Funkcja Cron:** "Zordon, sprawdzaj to co rano" – Inngest obsługuje harmonogram.

### D. Ręce i Zmysły (Tools & Integration) 🖐️
Zordon musi dotykać świata. Zamiast pisać setki integracji ręcznie, używamy standardu.

- **Standard:** MCP (Model Context Protocol). To "USB dla AI". Podłączamy gotowe serwery MCP dla GitHuba, Google Drive, Slacka.
- **Kluczowe Narzędzia:** GitHub API, Tavily (wyszukiwanie), Vercel API.

### E. Bezpieczeństwo (The Sandbox) 🛡️
Zordon będzie pisał kod. Uruchamianie go na serwerze produkcyjnym to samobójstwo.

- **Technologia:** E2B (Code Interpreter).
- **Jak to działa:** Zordon pisze skrypt w Pythonie/JS -> Wysyła do E2B (bezpieczna chmura) -> E2B wykonuje kod w izolacji -> Zwraca wynik Zordonowi.

### F. Twarz (Generative UI) 💅
Interfejs, w którym rozmawiasz z Zordonem.

- **Technologia:** Next.js + Shadcn UI.
- **Generative UI:** Zordon nie odpisuje tylko tekstem. W odpowiedzi na pytanie o finanse, generuje na żywo komponent React z wykresem.

## 3. SCHEMAT PRZEPŁYWU DANYCH (Jak to działa?)

1.  **Input:** Ty piszesz: "Zordon, sprawdź dlaczego deployment na Vercelu padł i napraw to."
2.  **Router (Mózg):** Zordon analizuje intencję.
    - Czy to proste pytanie? -> Odpowiada z pamięci.
    - Czy to zadanie? -> Uruchamia proces.
3.  **Action (Inngest):**
    - **Krok 1:** Narzędzie `vercel_get_logs` pobiera błąd.
    - **Krok 2:** Zordon analizuje błąd ("Aha, brakuje zmiennej środowiskowej").
    - **Krok 3:** Zordon przeszukuje Pamięć (czy kiedyś to naprawialiśmy?).
    - **Krok 4:** Zordon używa `github_create_branch` i `github_push_file` z poprawką.
    - **Krok 5:** Zordon używa `vercel_redeploy`.
4.  **Feedback:** Zordon generuje na ekranie "Kartę Raportu" z zielonym ptaszkiem i linkiem do nowej wersji.

## 4. BAZA WIEDZY (Research)

Wszystkie materiały źródłowe, analizy i dokumenty PDF, które stanowią podstawę teoretyczną dla tego projektu, znajdują się w katalogu [`/docs/research-papers`](./docs/research-papers).

## 5. PLAN WDROŻENIA (Roadmap)

To jest nasza mapa drogowa, którą będziemy odhaczać w miarę postępów.

- [x] **Faza 0: Fundamenty**
  - Czyste repozytorium lolek-core.
  - Konfiguracja Next.js + Vercel AI SDK.

- [x] **Faza 1: Twarz i Głos**
  - Wdrożenie interfejsu czatu (Shadcn UI + Vercel Chatbot Template).
  - Podłączenie Gemini 1.5 Pro.

- [ ] **Faza 2: Pamięć Absolutna**
  - Konfiguracja bazy Neon Postgres.
  - Modele Prisma: Chat, Message, Memory, Document (pgvector).
  - Logika zapisu onFinish (żeby pamiętał rozmowy).

- [ ] **Faza 3: Ręce i Bezpieczeństwo**
  - Integracja GitHub API (Tool).
  - Wdrożenie Sandboxa E2B do uruchamiania kodu.

- [ ] **Faza 4: Autonomia (Inngest)**
  - Konfiguracja Inngest.
  - Stworzenie pierwszej funkcji działającej w tle (np. "Daily Research").

- [ ] **Faza 5: Samorozwój**
  - Nauczenie Zordona, jak czytać własne pliki i proponować zmiany w swoim kodzie.

// lib/kv.ts
import { createClient } from "@vercel/kv";

function initializeKv() {
  // Używamy createClient, a nie obsługujemy ręcznie mocka.
  // Jeśli zmienne KV_REST_API_URL/TOKEN nie są zdefiniowane,
  // i nie są dostępne w środowisku Vercel, to aplikacja powinna zgłosić błąd przy starcie.
  return createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

export const kv = initializeKv();

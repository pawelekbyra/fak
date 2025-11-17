import { createClient } from "@vercel/kv";

function initializeKv() {
  // If we're in mock mode, return null. The app logic should handle this.
  if (process.env.MOCK_API === 'true') {
    return null;
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.warn("Missing Vercel KV REST API environment variables. Using mock KV client.");
    // Return a mock client that does nothing.
    return {
      get: async () => null,
      set: async () => {},
      // Add other methods as needed, all returning benign values.
    };
  }

  return createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

export const kv = initializeKv();

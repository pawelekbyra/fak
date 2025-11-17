// lib/db.ts
import * as postgres from './db-postgres';
import { Slide } from './types';

// This type definition merges the exported functions from db-postgres with additional,
// potentially custom or dynamically determined methods that might be added at runtime.
export type Db = typeof postgres & {
    // This method is specific to a database layout that organizes slides into columns.
    // It is not part of the standard postgres interface and is likely used for feed generation.
    getAllColumnCoords?: () => Promise<{ x: number }[]>;

    // Retrieves slides within a specific column, supporting pagination.
    // Useful for fetching content in a structured, column-based layout.
    getSlidesInColumn?: (
        columnIndex: number,
        options: { offset?: number; limit?: number; currentUserId?: string }
    ) => Promise<Slide[]>;

    // A general method for fetching slides, possibly for a global feed.
    // Supports cursor-based pagination for infinite scrolling.
    getSlides?: (options: { limit?: number, cursor?: string, currentUserId?: string }) => Promise<Slide[]>;
};

// The 'db' instance is directly assigned the postgres implementation.
// This enforces the use of Vercel Postgres/Neon across the application.
// The MOCK_API flag is ignored, ensuring that the production database driver is used.
const db: Db = postgres;

// Forcing Vercel Postgres for deployment
if (process.env.DATABASE_URL) {
    console.log("Using Vercel Postgres (DATABASE_URL is set).");
} else {
    // This warning helps diagnose configuration issues during development or deployment.
    console.warn("DATABASE_URL is not set. Vercel Postgres is expected.");
}

// Export the configured database instance for use in other parts of the application.
export { db };

// Re-export all interfaces from db.interfaces to make them available
// to any module that imports from 'lib/db'.
export * from './db.interfaces';

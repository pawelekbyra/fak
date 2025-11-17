import { db as mockDb } from './mock-db';
import * as postgres from './db-postgres';
import { Slide } from './types';

export type Db = typeof postgres & {
    getAllColumnCoords?: () => Promise<{ x: number }[]>;
    getSlidesInColumn?: (
        columnIndex: number,
        options: { offset?: number; limit?: number; currentUserId?: string }
    ) => Promise<Slide[]>;
    getSlides?: (options: { limit?: number, cursor?: string, currentUserId?: string }) => Promise<Slide[]>;
};

let db: Db;

// Wymuszamy użycie Vercel Postgres, zakładając, że DATABASE_URL jest zdefiniowany
db = postgres;
console.log("Using Vercel Postgres (DATABASE_URL is assumed to be set).");

export { db };
export * from './db.interfaces';

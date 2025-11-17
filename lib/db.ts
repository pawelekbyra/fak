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

if (process.env.MOCK_API === 'true') {
  console.log("Using mock DB.");
  db = mockDb as any;
} else {
  console.log("Using Vercel Postgres.");
  db = postgres;
}

export { db };
export * from './db.interfaces';

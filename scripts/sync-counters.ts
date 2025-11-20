
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Starting counter denormalization migration...");

  try {
    // Update likeCount for all slides
    console.log("Updating likeCount...");
    await sql`
      UPDATE slides s
      SET "likeCount" = (
        SELECT COUNT(*)
        FROM likes
        WHERE "slideId" = s.id
      )
    `;
    console.log("likeCount updated successfully.");

    // Update commentCount for all slides
    console.log("Updating commentCount...");
    await sql`
      UPDATE slides s
      SET "commentCount" = (
        SELECT COUNT(*)
        FROM comments
        WHERE "slideId" = s.id
      )
    `;
    console.log("commentCount updated successfully.");

    console.log("Migration completed.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();

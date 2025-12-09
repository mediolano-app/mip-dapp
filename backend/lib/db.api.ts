
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
});

// Test connection on startup
pool.connect()
  .then((client) => {
    console.log("✅ Database connected successfully");
    client.release();
  })
  .catch((err) => {
    console.error("❌ Failed to connect to the database:", err.message);
    process.exit(1); // Exit app if DB is unreachable
  });

export const db = drizzle(pool);

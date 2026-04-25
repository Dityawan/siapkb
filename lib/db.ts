import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const parsedDatabaseUrl = new URL(databaseUrl);
parsedDatabaseUrl.searchParams.delete('ssl-mode');

type GlobalWithDbPool = typeof globalThis & {
  __siapkbDbPool?: mysql.Pool;
};

const globalWithDbPool = globalThis as GlobalWithDbPool;

const pool =
  globalWithDbPool.__siapkbDbPool ??
  mysql.createPool({
    uri: parsedDatabaseUrl.toString(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
      rejectUnauthorized: false,
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalWithDbPool.__siapkbDbPool = pool;
}

export async function pingDatabase() {
  const connection = await pool.getConnection();

  try {
    await connection.query('SELECT 1');
    return true;
  } finally {
    connection.release();
  }
}

export { pool };

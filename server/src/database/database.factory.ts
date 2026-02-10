import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql2 from 'mysql2/promise';
import { getDatabaseConfig } from './database.config';

const mysql = (mysql2 as any).default || mysql2;

export type Database = ReturnType<typeof drizzle>;

let mysqlPool: any = null;
let dbInstance: Database | null = null;
let schemaModule: any = null;

function loadSchema() {
  if (!schemaModule) {
    schemaModule = require('../../../shared/schema');
  }
  return schemaModule;
}

export function createDatabase(): { db: Database; schema: any } {
  const schema = loadSchema();

  if (dbInstance) {
    return { db: dbInstance, schema };
  }

  const config = getDatabaseConfig();

  console.log('Initializing MySQL database connection...');
  mysqlPool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  dbInstance = drizzle(mysqlPool, { schema, mode: 'default' });
  return { db: dbInstance, schema };
}

export async function closeDatabase(): Promise<void> {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
  dbInstance = null;
}

export async function testConnection(): Promise<boolean> {
  try {
    if (!mysqlPool) {
      createDatabase();
    }
    const conn = await mysqlPool.getConnection();
    console.log('MySQL connection established successfully');
    conn.release();
    return true;
  } catch (error) {
    console.error('MySQL connection failed:', error);
    return false;
  }
}

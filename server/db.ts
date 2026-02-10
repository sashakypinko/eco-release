import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

function getDatabaseConfig() {
  const host = process.env.MYSQL_HOST;
  const port = parseInt(process.env.MYSQL_PORT || "3306", 10);
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;

  if (!host || !user || !password || !database) {
    throw new Error(
      "MySQL configuration incomplete. Required env vars: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE"
    );
  }

  return { host, port, user, password, database };
}

const config = getDatabaseConfig();

const pool = mysql.createPool({
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

export const db = drizzle(pool, { schema, mode: "default" });

export async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("MySQL connection established successfully");
    conn.release();
    return true;
  } catch (error) {
    console.error("MySQL connection failed:", error);
    return false;
  }
}

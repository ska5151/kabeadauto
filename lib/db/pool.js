import mysql from "mysql2/promise";
import { getDbConfig } from "./registry.js";

const pools = new Map();

export function getPool(dbKey) {
  const { key, config } = getDbConfig(dbKey);

  if (!pools.has(key)) {
    pools.set(
      key,
      mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 5,
      }),
    );
  }

  return { key, pool: pools.get(key) };
}

export async function query(dbKey, sql, params = []) {
  const { key, pool } = getPool(dbKey);

  try {
    const [rows] = await pool.execute(sql, params);
    return { db: key, rows };
  } catch (err) {
    err.db = key;
    throw err;
  }
}

export async function closeAllPools() {
  await Promise.all([...pools.values()].map((pool) => pool.end()));
  pools.clear();
}

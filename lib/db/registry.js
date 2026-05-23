/**
 * Named MySQL connection config from environment variables.
 * Keys: primary, secondary, ...
 */

const DB_KEYS = ["primary", "secondary", "daissue"];

function envKey(dbKey, suffix) {
  return `${suffix}_${dbKey.toUpperCase()}`;
}

function loadConfig(dbKey) {
  const host = process.env[envKey(dbKey, "MYSQL_HOST")];
  const port = Number(process.env[envKey(dbKey, "MYSQL_PORT")] || 3306);
  const user = process.env[envKey(dbKey, "MYSQL_USER")];
  const password = process.env[envKey(dbKey, "MYSQL_PASSWORD")];
  const database = process.env[envKey(dbKey, "MYSQL_DATABASE")];

  if (!host || !user || !database) {
    return null;
  }

  return { host, port, user, password, database };
}

export function listDbKeys() {
  return [...DB_KEYS];
}

export function resolveDbKey(dbKey) {
  const key = (dbKey || process.env.DB_TARGET || "primary").toLowerCase();

  if (!DB_KEYS.includes(key)) {
    throw new Error(
      `Unknown db key "${key}". Available: ${DB_KEYS.join(", ")}`,
    );
  }

  return key;
}

export function getDbConfig(dbKey) {
  const key = resolveDbKey(dbKey);
  const config = loadConfig(key);

  if (!config) {
    throw new Error(
      `Missing env for db "${key}". Copy .env.example to .env.local and fill MYSQL_*_${key.toUpperCase()}.`,
    );
  }

  return { key, config };
}

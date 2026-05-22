/**
 * 터미널에서 특정 DB에 접속해 데이터를 조회합니다.
 *
 * Usage:
 *   npm run fetch -- --db=primary
 *   node scripts/fetch.mjs --db=secondary
 */

import path from "path";
import { fileURLToPath } from "url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
import { pingDb } from "../lib/queries/ping.js";
import { closeAllPools } from "../lib/db/pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.join(__dirname, "..");

function parseDbArg(argv) {
  for (const arg of argv) {
    if (arg.startsWith("--db=")) {
      return arg.slice("--db=".length);
    }
    if (arg === "--db" || arg === "-d") {
      const idx = argv.indexOf(arg);
      if (argv[idx + 1]) return argv[idx + 1];
    }
  }
  return process.env.DB_TARGET || "primary";
}

async function main() {
  loadEnvConfig(projectDir);

  const dbKey = parseDbArg(process.argv.slice(2));

  try {
    const rows = await pingDb(dbKey);
    console.log(JSON.stringify({ db: dbKey, rows }, null, 2));
  } catch (err) {
    console.error(`[fetch] db=${dbKey} ${err.message}`);
    process.exitCode = 1;
  } finally {
    await closeAllPools();
  }
}

main();

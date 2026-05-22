import { query } from "../db/pool.js";

/** DB 연결 확인용 샘플 쿼리 */
export async function pingDb(dbKey) {
  const { rows } = await query(dbKey, "SELECT 1 AS ok");
  return rows;
}

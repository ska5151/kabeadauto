import { getPool } from "../db/pool.js";

export const KBMANAGER_DB_KEY = "kbmanager";

const SQL_CUTOFF_DATE = `
SELECT DATE_FORMAT(DATE_SUB(DATE(NOW()), INTERVAL 6 MONTH), '%Y-%m-%d') AS cutoff
`;

const SQL_DELETE_OLD_LOGS = `
DELETE d, m
FROM pslist_log_d AS d
INNER JOIN pslist_log_m AS m ON d.mseq = m.mseq
WHERE m.sdate < ?
`;

export async function deleteOldKbmanagerLogs() {
  const { pool, key } = getPool(KBMANAGER_DB_KEY);

  try {
    const [dateRows] = await pool.execute(SQL_CUTOFF_DATE);
    const cutoff = dateRows[0]?.cutoff;
    if (!cutoff) {
      throw new Error("기준일을 계산하지 못했습니다.");
    }

    const [result] = await pool.execute(SQL_DELETE_OLD_LOGS, [cutoff]);
    return {
      db: key,
      cutoff,
      affectedRows: result.affectedRows ?? 0,
    };
  } catch (err) {
    err.db = key;
    throw err;
  }
}

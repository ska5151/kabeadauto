import mysql from "mysql2/promise";
import { listIdcDbConfigs } from "../db/idc-registry.js";
import { getPool } from "../db/pool.js";
import { KBMANAGER_DB_KEY } from "./kbmanager-logs.js";

const SQL_CUTOFF_DATE = `
SELECT DATE_FORMAT(DATE_SUB(DATE(NOW()), INTERVAL 6 MONTH), '%Y%m%d') AS cutoff
`;

const SQL_DELETE_SUBMIT_END = `
DELETE FROM tbl_submit_end
WHERE LEFT(CMP_SND_DTTM, 8) < ?
`;

const SQL_DELETE_SMS_SEND_HIST = `
DELETE FROM sms_send_hist
WHERE LEFT(snd_time, 8) < ?
`;

async function executeIdcCleanup({ key, config }, cutoff) {
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 2,
  });

  try {
    const [result] = await pool.execute(SQL_DELETE_SMS_SEND_HIST, [cutoff]);
    return {
      db: key,
      ok: true,
      affectedRows: result.affectedRows ?? 0,
    };
  } catch (err) {
    return {
      db: key,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await pool.end();
  }
}

export async function deleteOldKbmanagerMessageHistory() {
  const { pool, key } = getPool(KBMANAGER_DB_KEY);
  const idcDbConfigs = listIdcDbConfigs();

  if (idcDbConfigs.length === 0) {
    throw new Error("IDC DB 설정을 찾지 못했습니다.");
  }

  try {
    const [dateRows] = await pool.execute(SQL_CUTOFF_DATE);
    const cutoff = dateRows[0]?.cutoff;
    if (!cutoff) {
      throw new Error("기준일을 계산하지 못했습니다.");
    }

    const [submitResult] = await pool.execute(SQL_DELETE_SUBMIT_END, [cutoff]);
    const idcResults = [];
    for (const idcDbConfig of idcDbConfigs) {
      idcResults.push(await executeIdcCleanup(idcDbConfig, cutoff));
    }

    const failedDbs = idcResults.filter((result) => !result.ok);
    return {
      ok: failedDbs.length === 0,
      db: key,
      cutoff,
      affectedRows:
        (submitResult.affectedRows ?? 0) +
        idcResults.reduce((sum, result) => sum + (result.affectedRows ?? 0), 0),
      kbmanagerAffectedRows: submitResult.affectedRows ?? 0,
      idcResults,
      failedDbs,
    };
  } catch (err) {
    err.db = key;
    throw err;
  }
}

import { query } from "../db/pool.js";

export const DAISSUE_DB_KEY = "daissue";

const SQL_RECENT_ACTIONS = `
SELECT
  a.ACTION_ID AS actionId
  , DATE_FORMAT(CONVERT_TZ(a.CRT_DT, '+00:00','+09:00'), '%Y-%m-%d %H:%i:%S') AS crtDt
FROM
  daissue_db.TB_ACTION AS a
WHERE
  a.PATH = 'adm/login'
  AND a.UUID IS NULL
ORDER BY
  a.ACTION_ID DESC
LIMIT 1000
`;

const SQL_DAILY_COUNTS = `
SELECT
  DATE_FORMAT(CONVERT_TZ(a.CRT_DT, "+00:00", "+09:00"), "%y-%m-%d")
  , COUNT(1)
FROM
  daissue_db.TB_ACTION AS a
WHERE
  a.PATH = 'adm/login'
  AND a.UUID IS NULL
  AND CONVERT_TZ(a.CRT_DT, "+00:00", "+09:00") BETWEEN CONCAT(DATE_FORMAT(DATE_ADD(CONVERT_TZ(NOW(), "+00:00", "+09:00"), INTERVAL -14 DAY), "%y-%m-%d"), " 00:00:00")
  AND CONCAT(DATE_FORMAT(DATE_ADD(CONVERT_TZ(NOW(), "+00:00", "+09:00"), INTERVAL -1 DAY), "%y-%m-%d"), " 23:59:59")
GROUP BY
  DATE_FORMAT(CONVERT_TZ(a.CRT_DT, "+00:00", "+09:00"), "%y-%m-%d")
ORDER BY
  a.ACTION_ID DESC
LIMIT 10
`;

function normalizeDailyRows(rows) {
  return rows.map((row) => {
    const values = Object.values(row);
    return { crtDate: values[0], cnt: values[1] };
  });
}

export async function fetchActionCheck() {
  const [{ rows: recent }, { rows: dailyRaw }] = await Promise.all([
    query(DAISSUE_DB_KEY, SQL_RECENT_ACTIONS),
    query(DAISSUE_DB_KEY, SQL_DAILY_COUNTS),
  ]);

  return { recent, daily: normalizeDailyRows(dailyRaw) };
}

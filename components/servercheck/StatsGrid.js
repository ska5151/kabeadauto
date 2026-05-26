"use client";

import { FOLDER_ROWS, STAT_COLUMNS } from "../../lib/servercheck/constants.js";
import { downloadStatsAsExcel } from "../../lib/servercheck/exportExcel.js";
import { formatStatValue } from "../../lib/servercheck/stats.js";

export default function StatsGrid({ result, loading }) {
  return (
    <section className="servercheck__panel">
      <div className="servercheck__panel-header">
        <h2 className="servercheck__panel-title">통계 그리드</h2>
        {result ? (
          <button
            type="button"
            onClick={() => downloadStatsAsExcel(result)}
            className="servercheck__btn servercheck__btn--excel"
          >
            엑셀
          </button>
        ) : null}
      </div>
      {loading ? <p className="servercheck__status">분석 중…</p> : null}
      {!result && !loading ? (
        <p className="servercheck__hint">
          「분석 실행」을 눌러 JSON 로그 통계를 확인하세요.
        </p>
      ) : null}
      {result ? (
        <div className="servercheck__table-wrap">
          <table className="servercheck__table">
            <thead>
              <tr>
                <th className="servercheck__table-folder">폴더</th>
                {STAT_COLUMNS.map((col) => (
                  <th key={col.key} title={col.label}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FOLDER_ROWS.map((folderKey) => {
                const row = result.rows[folderKey];
                const error = result.errors[folderKey];
                return (
                  <tr key={folderKey}>
                    <td className="servercheck__table-folder">
                      {folderKey}
                      {error ? (
                        <span
                          className="servercheck__table-warn"
                          title={error}
                        >
                          ⚠
                        </span>
                      ) : null}
                    </td>
                    {STAT_COLUMNS.map((col) => (
                      <td key={col.key}>{formatStatValue(row[col.key])}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";

const RECENT_COLUMNS = [
  { key: "actionId", label: "actionId" },
  { key: "crtDt", label: "crtDt" },
];

const DAILY_COLUMNS = [
  { key: "crtDate", label: "일자" },
  { key: "cnt", label: "건수" },
];

function DataTable({ title, columns, rows, emptyLabel }) {
  return (
    <section className="action-check__panel">
      <h2 className="action-check__panel-title">{title}</h2>
      <div className="action-check__table-wrap">
        <table className="action-check__table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="action-check__empty">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`${columns.map((c) => row[c.key]).join("-")}-${index}`}>
                  {columns.map((col) => (
                    <td key={col.key}>{row[col.key] ?? ""}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function DaishyuView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/daissue-action-check");
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "ACTION 체크 데이터를 불러오지 못했습니다.");
        }
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "ACTION 체크 데이터를 불러오지 못했습니다.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-view page-view--action-check">
      <div className="page-view__body">
        {data ? (
          <p className="action-check__meta">
            adm/login · UUID NULL · 최근 {data.recentCount}건 · 일별 {data.dailyCount}
            건
          </p>
        ) : null}
        {loading ? <p className="action-check__status">불러오는 중…</p> : null}
        {error ? (
          <p className="action-check__error" role="alert">
            {error}
          </p>
        ) : null}
        {!loading && !error && data ? (
          <div className="action-check__grid">
            <DataTable
              title="최근 ACTION"
              columns={RECENT_COLUMNS}
              rows={data.recent}
              emptyLabel="조회 결과가 없습니다."
            />
            <DataTable
              title="일별 건수 (최근 14일)"
              columns={DAILY_COLUMNS}
              rows={data.daily}
              emptyLabel="조회 결과가 없습니다."
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

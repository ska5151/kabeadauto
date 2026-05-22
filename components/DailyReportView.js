"use client";

import { useEffect, useState } from "react";

export default function DailyReportView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/daily-report");
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "일일보고를 불러오지 못했습니다.");
        }
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "일일보고를 불러오지 못했습니다.";
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
    <div className="page-view">
      <header className="page-view__header">
        <h1 className="page-view__title">일일보고</h1>
        {data?.today ? (
          <p className="daily-report__meta">
            기준일 {data.today} (KST) · 총 {data.total}건
          </p>
        ) : null}
      </header>

      <div className="page-view__body">
        {loading ? (
          <p className="daily-report__status">불러오는 중…</p>
        ) : null}
        {error ? (
          <p className="daily-report__error" role="alert">
            {error}
          </p>
        ) : null}
        {!loading && !error && data?.output ? (
          <pre className="daily-report__text">{data.output}</pre>
        ) : null}
      </div>
    </div>
  );
}

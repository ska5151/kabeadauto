"use client";

import { useCallback, useState } from "react";

const CONFIRM_MESSAGE =
  "6개월 로그만 남기고 모두 삭제 하시겠습니까?";

export default function KbManagerView() {
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState({ text: "", ok: false });

  const handleDeleteOldLogs = useCallback(async () => {
    if (!window.confirm(CONFIRM_MESSAGE)) {
      return;
    }

    setBusy(true);
    setFlash({ text: "", ok: false });
    try {
      const res = await fetch("/api/kbmanager/delete-old-logs", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "로그 삭제에 실패했습니다.");
      }
      setFlash({
        text: json.message ?? (json.ok ? "삭제 완료 !!!" : "삭제 할 자료가 없거나 삭제 오류 !!!"),
        ok: Boolean(json.ok),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "로그 삭제에 실패했습니다.";
      setFlash({ text: message, ok: false });
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className="page-view page-view--kbmanager">
      <header className="page-view__header">
        <h1 className="page-view__title">kbmanager</h1>
        <p className="kbmanager__meta">
          pslist_log_m · pslist_log_d — 6개월 이전 로그 일괄 삭제
        </p>
      </header>

      <div className="page-view__body">
        <section className="kbmanager__panel">
          <h2 className="kbmanager__panel-title">로그 정리</h2>
          <p className="kbmanager__desc">
            오늘 기준 6개월 이전(sdate) 마스터·상세 로그를 삭제합니다. 6개월
            이내 로그만 남습니다.
          </p>
          <div className="kbmanager__actions">
            <button
              type="button"
              className="kbmanager__btn kbmanager__btn--danger"
              disabled={busy}
              onClick={handleDeleteOldLogs}
            >
              {busy ? "삭제 중…" : "6개월 지난 로그 삭제"}
            </button>
            {flash.text ? (
              <span
                className={`kbmanager__flash${flash.ok ? " kbmanager__flash--ok" : " kbmanager__flash--err"}`}
                role="status"
              >
                {flash.text}
              </span>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

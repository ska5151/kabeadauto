"use client";

import { useCallback, useState } from "react";

const CONFIRM_MESSAGE =
  "6개월 로그만 남기고 모두 삭제 하시겠습니까?";
const MESSAGE_HISTORY_CONFIRM_MESSAGE =
  "6개월 문자 이력만 남기고 모두 삭제 하시겠습니까?";
const LOG_HEADER = "# kbmanager terminal";
const LOG_EMPTY = `${LOG_HEADER}\n아직 실행 내역이 없습니다.`;

const CLEANUP_ITEMS = {
  logs: {
    endpoint: "/api/kbmanager/delete-old-logs",
    confirmMessage: CONFIRM_MESSAGE,
    fallbackError: "로그 삭제에 실패했습니다.",
  },
  messageHistory: {
    endpoint: "/api/kbmanager/delete-old-message-history",
    confirmMessage: MESSAGE_HISTORY_CONFIRM_MESSAGE,
    fallbackError: "문자 이력 삭제에 실패했습니다.",
  },
};

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function cleanupLabel(itemKey) {
  return itemKey === "messageHistory"
    ? "6개월 지난 문자이력 삭제"
    : "6개월 지난 로그 삭제";
}

function dbCompleteLine(db, ok = true) {
  return `${db} 처리 ${ok ? "완료" : "실패"}`;
}

function formatCleanupLog(itemKey, json, httpStatus) {
  const hasIdcResults = Array.isArray(json.idcResults);
  const requestOk = httpStatus < 400;
  const dbLines =
    itemKey === "messageHistory"
      ? [
          dbCompleteLine(json.db ?? "kbmanager", requestOk || hasIdcResults),
          ...(hasIdcResults
            ? json.idcResults.map((result) =>
                dbCompleteLine(result.db ?? "idc", result.ok !== false),
              )
            : []),
        ]
      : [dbCompleteLine(json.db ?? "kbmanager", requestOk)];
  const detailLines = [
    json.message,
    json.cutoff ? `기준일: ${json.cutoff}` : "",
    typeof json.affectedRows === "number" ? `삭제 건수: ${json.affectedRows}` : "",
    json.error ? `오류: ${json.error}` : "",
  ].filter(Boolean);

  return [
    "",
    `$ POST ${CLEANUP_ITEMS[itemKey].endpoint}  [HTTP ${httpStatus}]`,
    `[${nowStamp()}] ${cleanupLabel(itemKey)} 응답 수신`,
    ...dbLines,
    ...detailLines,
  ].join("\n");
}

export default function KbManagerView() {
  const [busyItem, setBusyItem] = useState("");
  const [logOutput, setLogOutput] = useState(LOG_EMPTY);
  const [flash, setFlash] = useState({
    logs: { text: "", ok: false },
    messageHistory: { text: "", ok: false },
  });

  const appendLogOutput = useCallback((text) => {
    setLogOutput((current) => `${current}\n${text}`);
  }, []);

  const startLogRun = useCallback((itemKey) => {
    setLogOutput(
      `${LOG_HEADER}\n[${nowStamp()}] ${cleanupLabel(itemKey)} 요청 전송됨`,
    );
  }, []);

  const runCleanup = useCallback(async (itemKey) => {
    const item = CLEANUP_ITEMS[itemKey];
    if (!item || !window.confirm(item.confirmMessage)) {
      return;
    }

    setBusyItem(itemKey);
    startLogRun(itemKey);
    setFlash((current) => ({
      ...current,
      [itemKey]: { text: "", ok: false },
    }));
    try {
      const res = await fetch(item.endpoint, {
        method: "POST",
      });
      const json = await res.json();
      appendLogOutput(formatCleanupLog(itemKey, json, res.status));
      setFlash((current) => ({
        ...current,
        [itemKey]: {
          text:
            json.message ??
            (json.ok ? "삭제 완료 !!!" : "삭제 할 자료가 없거나 삭제 오류 !!!"),
          ok: res.ok && Boolean(json.ok),
        },
      }));
      if (!res.ok) {
        return;
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : item.fallbackError;
      appendLogOutput(
        [
          "",
          `$ POST ${item.endpoint}`,
          `[${nowStamp()}] ${cleanupLabel(itemKey)} 처리 실패`,
          message,
        ].join("\n"),
      );
      setFlash((current) => ({
        ...current,
        [itemKey]: { text: message, ok: false },
      }));
    } finally {
      setBusyItem("");
    }
  }, [appendLogOutput, startLogRun]);

  const handleDeleteOldLogs = useCallback(() => {
    runCleanup("logs");
  }, [runCleanup]);

  const handleDeleteOldMessageHistory = useCallback(() => {
    runCleanup("messageHistory");
  }, [runCleanup]);

  const busy = Boolean(busyItem);

  return (
    <div className="page-view page-view--kbmanager">
      <header className="page-view__header">
        <h1 className="page-view__title">kbmanager</h1>
      </header>

      <div className="page-view__body">
        <div className="kbmanager__grid">
          <div className="kbmanager__panels">
            <section className="kbmanager__panel">
              <h2 className="kbmanager__panel-title">로그 정리</h2>
              <div className="kbmanager__actions">
                <button
                  type="button"
                  className="kbmanager__btn kbmanager__btn--danger"
                  disabled={busy}
                  onClick={handleDeleteOldLogs}
                >
                  {busyItem === "logs" ? "삭제 중…" : "6개월 지난 로그 삭제"}
                </button>
                {flash.logs.text ? (
                  <span
                    className={`kbmanager__flash${flash.logs.ok ? " kbmanager__flash--ok" : " kbmanager__flash--err"}`}
                    role="status"
                  >
                    {flash.logs.text}
                  </span>
                ) : null}
              </div>
            </section>

            <section className="kbmanager__panel">
              <h2 className="kbmanager__panel-title">문자 이력 정리</h2>
              <div className="kbmanager__actions">
                <button
                  type="button"
                  className="kbmanager__btn kbmanager__btn--danger"
                  disabled={busy}
                  onClick={handleDeleteOldMessageHistory}
                >
                  {busyItem === "messageHistory"
                    ? "삭제 중…"
                    : "6개월 지난 문자이력 삭제"}
                </button>
                {flash.messageHistory.text ? (
                  <span
                    className={`kbmanager__flash${flash.messageHistory.ok ? " kbmanager__flash--ok" : " kbmanager__flash--err"}`}
                    role="status"
                  >
                    {flash.messageHistory.text}
                  </span>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="kbmanager__log" aria-live="polite">
            <h2 className="kbmanager__log-title">로그 출력</h2>
            <pre className="kbmanager__log-body">{logOutput}</pre>
          </aside>
        </div>
      </div>
    </div>
  );
}

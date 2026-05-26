"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = "/api/baljuanara-deploy";
const BETA_TO_PROD_SUFFIX = "_beta_to_prod";
const ALL_VALUE = "__all__";
const BETA_WEB_URL = "http://192.168.0.19:20080/";
const SHELL_HEADER = "# deploy-harness terminal";
const SHELL_EMPTY = `${SHELL_HEADER}\n아직 실행 내역이 없습니다.`;

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function isSafeHttpUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function labelForDeployScript(scriptKey) {
  if (scriptKey.endsWith(BETA_TO_PROD_SUFFIX)) {
    return scriptKey.slice(0, -BETA_TO_PROD_SUFFIX.length) || scriptKey;
  }
  return scriptKey;
}

function parseSshAllowResponse(text, r) {
  const raw = text == null ? "" : String(text);
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {
      parseError: true,
      rawText: raw,
      parseMessage: String(e.message || e),
      ok: false,
      stdout: raw.slice(0, 120000),
      stderr: `JSON parse error: ${String(e.message || e)}`,
      exitCode: "n/a",
    };
  }
  const stdout = "stdout" in data ? String(data.stdout ?? "") : "";
  const stderrField = "stderr" in data ? String(data.stderr ?? "") : "";
  const apiNote = [data.message, data.error]
    .filter((x) => x != null && String(x).length > 0)
    .join("\n");
  let stderr = stderrField.trim() ? stderrField : apiNote;
  if (data.error === "unknown_or_disallowed_script" && Array.isArray(data.allowed)) {
    stderr = `${stderr ? `${stderr}\n\n` : ""}allowed scripts: ${data.allowed.join(", ")}`;
  }
  const exitCode = typeof data.exitCode === "number" ? data.exitCode : r.status;
  const ok = r.ok && data.ok === true;
  return { parseError: false, ok, stdout, stderr, exitCode };
}

function FlashMessage({ text, ok }) {
  if (!text) return <span className="baljuanara-deploy__flash" />;
  return (
    <span
      className={`baljuanara-deploy__flash${ok ? " baljuanara-deploy__flash--ok" : " baljuanara-deploy__flash--err"}`}
    >
      {text}
    </span>
  );
}

export default function BaljuanaraView() {
  const [running, setRunning] = useState(false);
  const [deployScriptKeys, setDeployScriptKeys] = useState([]);
  const [companyDbByKey, setCompanyDbByKey] = useState({});
  const [deployChoice, setDeployChoice] = useState("");
  const [dbCompanyChoice, setDbCompanyChoice] = useState("");
  const [shellOutput, setShellOutput] = useState(
    SHELL_EMPTY,
  );
  const [flashes, setFlashes] = useState({});
  const [deployFlash, setDeployFlash] = useState({ text: "", ok: false });
  const [dbOpenFlash, setDbOpenFlash] = useState({ text: "", ok: false });
  const [busyScripts, setBusyScripts] = useState(new Set());
  const [deployBusy, setDeployBusy] = useState(false);
  const flashTimers = useRef({});

  const appendShellOutput = useCallback((text) => {
    setShellOutput((prev) => `${prev}\n${text}`);
  }, []);

  const startShellRun = useCallback((firstLine) => {
    setShellOutput(`${SHELL_HEADER}\n${firstLine}`);
  }, []);

  const showFlash = useCallback((key, text, ok) => {
    setFlashes((prev) => ({ ...prev, [key]: { text, ok } }));
    if (flashTimers.current[key]) {
      clearTimeout(flashTimers.current[key]);
    }
    if (ok) {
      flashTimers.current[key] = setTimeout(() => {
        setFlashes((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 3000);
    }
  }, []);

  const showShellOutput = useCallback(
    (scriptKey, stdout, stderr, exitCode, ok, httpStatus) => {
      const out = (stdout || "").trim();
      const err = (stderr || "").trim();
      const status = ok ? "0 (success)" : `${exitCode} (failed)`;
      const body =
        out && err ? `${out}\n\n--- stderr ---\n${err}` : out || err || "(출력 없음)";
      const httpBit =
        typeof httpStatus === "number" ? `  [HTTP ${httpStatus}]` : "";
      appendShellOutput(
        [
          "",
          `$ POST ${API_BASE}/ssh/allow { "script": "${scriptKey}" }${httpBit}`,
          `[${nowStamp()}] exit=${status}`,
          body,
        ].join("\n"),
      );
    },
    [appendShellOutput],
  );

  const postDeployScript = useCallback(async (script) => {
    const r = await fetch(`${API_BASE}/ssh/allow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script }),
      cache: "no-store",
    });
    const text = await r.text();
    const parsed = parseSshAllowResponse(text, r);
    return { r, parsed };
  }, []);

  const runSshScript = useCallback(
    async (script) => {
      setBusyScripts((prev) => new Set(prev).add(script));
      setFlashes((prev) => {
        const next = { ...prev };
        delete next[script];
        return next;
      });
      startShellRun(
        `[${nowStamp()}] SSH "${script}" 요청 전송됨 (원격 스크립트·SSH가 끝날 때까지 응답 대기 중…)`,
      );
      try {
        const { r, parsed } = await postDeployScript(script);
        if (parsed.parseError) {
          showFlash(script, "응답이 JSON이 아닙니다.", false);
        } else if (!parsed.ok) {
          let msg = (parsed.stderr || "실패") + "";
          if (msg.length > 120) msg = `${msg.slice(0, 120)}…`;
          showFlash(script, msg, false);
        }
        showShellOutput(
          script,
          parsed.stdout,
          parsed.stderr,
          parsed.exitCode,
          parsed.ok === true && parsed.parseError !== true,
          r.status,
        );
      } catch (e) {
        showFlash(script, String(e.message || e), false);
        showShellOutput(script, "", String(e.message || e), "n/a", false);
      } finally {
        setBusyScripts((prev) => {
          const next = new Set(prev);
          next.delete(script);
          return next;
        });
      }
    },
    [postDeployScript, showFlash, showShellOutput, startShellRun],
  );

  const pollHealth = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/health`, { method: "GET" });
      setRunning(r.ok);
    } catch {
      setRunning(false);
    }
  }, []);

  const loadDeployTargets = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/ui/deploy-targets`);
      const data = await r.json();
      const list = Array.isArray(data.scripts) ? data.scripts : [];
      setDeployScriptKeys(list);
      setDeployChoice(list[0] ?? "");
    } catch {
      setDeployScriptKeys([]);
      setDeployChoice("");
    }
  }, []);

  const loadCompanyDb = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/ui/company-db`);
      const data = await r.json();
      const raw =
        data?.companies &&
        typeof data.companies === "object" &&
        !Array.isArray(data.companies)
          ? data.companies
          : {};
      const map = {};
      Object.keys(raw).forEach((k) => {
        const v = raw[k];
        if (typeof v === "string" && v.trim()) map[k] = v.trim();
      });
      setCompanyDbByKey(map);
      const keys = Object.keys(map).sort();
      setDbCompanyChoice(keys[0] ?? "");
    } catch {
      setCompanyDbByKey({});
      setDbCompanyChoice("");
    }
  }, []);

  useEffect(() => {
    pollHealth();
    loadDeployTargets();
    loadCompanyDb();
    const id = setInterval(pollHealth, 2000);
    return () => clearInterval(id);
  }, [loadCompanyDb, loadDeployTargets, pollHealth]);

  useEffect(
    () => () => {
      Object.values(flashTimers.current).forEach(clearTimeout);
    },
    [],
  );

  const dbCompanyKeys = Object.keys(companyDbByKey).sort();

  const handleDeploy = async () => {
    setDeployFlash({ text: "", ok: false });
    if (!deployChoice) {
      setDeployFlash({ text: "업체를 선택하세요.", ok: false });
      return;
    }
    startShellRun(
      `[${nowStamp()}] DEPLOY "${deployChoice === ALL_VALUE ? "전체" : deployChoice}" 요청 전송`,
    );
    setDeployBusy(true);
    try {
      if (deployChoice === ALL_VALUE) {
        for (const script of deployScriptKeys) {
          const { r, parsed } = await postDeployScript(script);
          if (parsed.parseError || !r.ok || !parsed.ok) {
            let part = (parsed.stderr || "실패") + "";
            if (part.length > 100) part = `${part.slice(0, 100)}…`;
            setDeployFlash({
              text: `[${labelForDeployScript(script)}] ${part}`,
              ok: false,
            });
            showShellOutput(
              script,
              parsed.stdout,
              parsed.stderr,
              parsed.exitCode,
              false,
              r.status,
            );
            return;
          }
          showShellOutput(
            script,
            parsed.stdout,
            parsed.stderr,
            parsed.exitCode,
            true,
            r.status,
          );
        }
      } else {
        const { r, parsed } = await postDeployScript(deployChoice);
        if (parsed.parseError) {
          setDeployFlash({ text: "응답이 JSON이 아닙니다.", ok: false });
        } else if (!r.ok || !parsed.ok) {
          let msg = (parsed.stderr || "실패") + "";
          if (msg.length > 120) msg = `${msg.slice(0, 120)}…`;
          setDeployFlash({ text: msg, ok: false });
        }
        showShellOutput(
          deployChoice,
          parsed.stdout,
          parsed.stderr,
          parsed.exitCode,
          parsed.ok === true && parsed.parseError !== true,
          r.status,
        );
      }
    } catch (e) {
      setDeployFlash({ text: String(e.message || e), ok: false });
      showShellOutput(deployChoice || "unknown", "", String(e.message || e), "n/a", false);
    } finally {
      setDeployBusy(false);
    }
  };

  const sshButtons = [
    { script: "beta_start", label: "서버 추가" },
    { script: "beta_commit", label: "서버 테스트 완료 (삭제)" },
    { script: "beta_delete", label: "서버 삭제" },
    { script: "sql_update", label: "업데이트 쿼리" },
    { script: "git_beta_to_prod_merge", label: "Merge" },
  ];

  return (
    <div className="page-view page-view--baljuanara">
      <header className="page-view__header baljuanara-deploy__header">
        <div className="baljuanara-deploy__header-row">
          <h1 className="page-view__title">배포</h1>
          <span
            className={`baljuanara-deploy__badge${running ? " baljuanara-deploy__badge--on" : ""}`}
            aria-live="polite"
          >
            {running ? "기동중" : "대기"}
          </span>
        </div>
      </header>

      <div className="page-view__body">
        <div className="baljuanara-deploy__grid">
          <div className="baljuanara-deploy__panels">
            <section
              className="baljuanara-deploy__panel baljuanara-deploy__panel--beta"
              aria-labelledby="betaPanelTitle"
            >
              <h2 id="betaPanelTitle" className="baljuanara-deploy__panel-title">
                Beta 서버
              </h2>
              <div className="baljuanara-deploy__row">
                <button
                  type="button"
                  className="baljuanara-deploy__btn"
                  disabled={busyScripts.has("beta_start")}
                  onClick={() => runSshScript("beta_start")}
                >
                  서버 추가
                </button>
                <FlashMessage
                  text={flashes.beta_start?.text}
                  ok={flashes.beta_start?.ok}
                />
              </div>
              <div className="baljuanara-deploy__row">
                <button
                  type="button"
                  className="baljuanara-deploy__btn baljuanara-deploy__btn--accent"
                  onClick={() =>
                    window.open(BETA_WEB_URL, "_blank", "noopener,noreferrer")
                  }
                >
                  서버 실행
                </button>
                <button
                  type="button"
                  className="baljuanara-deploy__btn"
                  onClick={() => {
                    startShellRun(`[${nowStamp()}] 서비스 실행 요청`);
                    appendShellOutput("/usr/local/mysql/bin/mysqld_safe --user=mysql &");
                    appendShellOutput("/usr/local/apache2/bin/apachectl restart");
                  }}
                >
                  서비스 실행
                </button>
              </div>
              {sshButtons.slice(1, 3).map(({ script, label }) => (
                <div key={script} className="baljuanara-deploy__row">
                  <button
                    type="button"
                    className="baljuanara-deploy__btn"
                    disabled={busyScripts.has(script)}
                    onClick={() => runSshScript(script)}
                  >
                    {label}
                  </button>
                  <FlashMessage text={flashes[script]?.text} ok={flashes[script]?.ok} />
                </div>
              ))}
            </section>

            <section
              className="baljuanara-deploy__panel baljuanara-deploy__panel--sql"
              aria-labelledby="sqlPanelTitle"
            >
              <h2 id="sqlPanelTitle" className="baljuanara-deploy__panel-title">
                SQL
              </h2>
              <div className="baljuanara-deploy__row">
                <button
                  type="button"
                  className="baljuanara-deploy__btn"
                  disabled={busyScripts.has("sql_update")}
                  onClick={() => runSshScript("sql_update")}
                >
                  업데이트 쿼리
                </button>
                <FlashMessage
                  text={flashes.sql_update?.text}
                  ok={flashes.sql_update?.ok}
                />
              </div>
            </section>

            <section
              className="baljuanara-deploy__panel baljuanara-deploy__panel--db"
              aria-labelledby="dbPanelTitle"
            >
              <h2 id="dbPanelTitle" className="baljuanara-deploy__panel-title">
                DB 접속
              </h2>
              <div className="baljuanara-deploy__toolbar">
                <label className="baljuanara-deploy__field" htmlFor="dbCompanySelect">
                  <span className="baljuanara-deploy__label">업체명</span>
                  <select
                    id="dbCompanySelect"
                    className="baljuanara-deploy__select"
                    value={dbCompanyChoice}
                    onChange={(e) => setDbCompanyChoice(e.target.value)}
                    aria-label="DB 업체명"
                  >
                    {dbCompanyKeys.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="baljuanara-deploy__btn baljuanara-deploy__btn--accent"
                  disabled={dbCompanyKeys.length === 0}
                  onClick={() => {
                    setDbOpenFlash({ text: "", ok: false });
                    const url = companyDbByKey[dbCompanyChoice];
                    if (!dbCompanyChoice || !url) {
                      setDbOpenFlash({ text: "업체를 선택하세요.", ok: false });
                      return;
                    }
                    if (!isSafeHttpUrl(url)) {
                      setDbOpenFlash({ text: "허용되지 않은 URL입니다.", ok: false });
                      return;
                    }
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                >
                  DB 접속
                </button>
                <FlashMessage text={dbOpenFlash.text} ok={dbOpenFlash.ok} />
              </div>
            </section>

            <section
              className="baljuanara-deploy__panel baljuanara-deploy__panel--merge"
              aria-labelledby="mergePanelTitle"
            >
              <h2 id="mergePanelTitle" className="baljuanara-deploy__panel-title">
                beta에서 prod 브랜치
              </h2>
              <div className="baljuanara-deploy__row">
                <button
                  type="button"
                  className="baljuanara-deploy__btn"
                  disabled={busyScripts.has("git_beta_to_prod_merge")}
                  onClick={() => runSshScript("git_beta_to_prod_merge")}
                >
                  Merge
                </button>
                <FlashMessage
                  text={flashes.git_beta_to_prod_merge?.text}
                  ok={flashes.git_beta_to_prod_merge?.ok}
                />
              </div>
            </section>

            <section
              className="baljuanara-deploy__panel baljuanara-deploy__panel--deploy"
              aria-labelledby="deployPanelTitle"
            >
              <h2 id="deployPanelTitle" className="baljuanara-deploy__panel-title">
                배포
              </h2>
              <div className="baljuanara-deploy__toolbar">
                <label className="baljuanara-deploy__field" htmlFor="companySelect">
                  <span className="baljuanara-deploy__label">업체명</span>
                  <select
                    id="companySelect"
                    className="baljuanara-deploy__select"
                    value={deployChoice}
                    onChange={(e) => setDeployChoice(e.target.value)}
                    aria-label="업체명"
                  >
                    {deployScriptKeys.length > 0 ? (
                      <option value={ALL_VALUE}>전체</option>
                    ) : null}
                    {deployScriptKeys.map((scriptKey) => (
                      <option key={scriptKey} value={scriptKey}>
                        {labelForDeployScript(scriptKey)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="baljuanara-deploy__btn baljuanara-deploy__btn--primary"
                  disabled={deployScriptKeys.length === 0 || deployBusy}
                  onClick={handleDeploy}
                >
                  배포
                </button>
                <FlashMessage text={deployFlash.text} ok={deployFlash.ok} />
              </div>
            </section>
          </div>

          <aside className="baljuanara-deploy__shell" aria-live="polite">
            <h2 className="baljuanara-deploy__shell-title">SSH 실행 출력</h2>
            <pre className="baljuanara-deploy__shell-body">{shellOutput}</pre>
          </aside>
        </div>
      </div>
    </div>
  );
}

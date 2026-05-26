/** Inner shell command only; combined into key/password remote strings in ssh.js */
export const ALLOWED_SCRIPT_INNER = {
  uptime: "uptime",
  whoami: "whoami",
  hostname: "hostname",
  date: "date",
  test: "cd /root/baljunara_sh && sh test.sh",
  beta_start: "cd /root/baljunara_sh && sh beta_start.sh",
  beta_delete: "cd /root/baljunara_sh && sh beta_rm.sh",
  beta_commit: "cd /root/baljunara_sh && sh beta_commit.sh",
  git_beta_to_prod_merge:
    "cd /root/baljunara_sh && sh git_beta_to_prod_merge.sh",
  sql_update:
    'cd /root/baljunara_sh/baljunara_project && git pull && git diff --name-only --diff-filter=AM remotes/origin/prod..remotes/origin/beta | grep -E \\.sql$ | grep -v rollback | sort -n && git diff --name-only --diff-filter=AM remotes/origin/prod..remotes/origin/beta | grep -E "\.sql$" | grep -v rollback | xargs -I {} git --no-pager -c color.ui=false show "remotes/origin/beta:{}"',
  데모_beta_to_prod:
    "cd /root/baljunara_sh/company_deploy && sh demo_beta_to_prod.sh",
  동심사_beta_to_prod:
    "cd /root/baljunara_sh/company_deploy && sh dongsimsa_beta_to_prod.sh",
};

export const DEPLOY_KEYS = new Set([
  "test",
  "beta_start",
  "beta_delete",
  "beta_commit",
  "git_beta_to_prod_merge",
  "sql_update",
  "데모_beta_to_prod",
  "동심사_beta_to_prod",
]);

/** Full keys in ALLOWED_SCRIPT_INNER that end with `_beta_to_prod` (UI deploy combo). */
export function listDeployBetaToProdScriptKeys() {
  const suffix = "_beta_to_prod";
  return Object.keys(ALLOWED_SCRIPT_INNER)
    .filter((k) => k.endsWith(suffix))
    .sort();
}

/**
 * PTY 출력을 API·UI용으로 정리한다.
 * @param {string} s
 */
export function stripTerminalEscapes(s) {
  if (s == null || s === "") return s;
  let t = String(s);
  for (let i = 0; i < 16; i++) {
    const before = t;
    t = t.replace(/\x1b\[[\x30-\x3f]*[\x20-\x2f]*[\x40-\x7e]/g, "");
    t = t.replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "");
    t = t.replace(/\x1b[\x20-\x2f][\x30-\x7e]/g, "");
    t = t.replace(/\x1b[=><78]/g, "");
    if (t === before) break;
  }
  t = t.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  t = t.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
  t = t.replace(/\u200b|\u200c|\u200d|\ufeff|\u2060/g, "");
  return t;
}

/**
 * @param {string} scriptKey
 * @param {string} inner
 */
export function buildKeyModeRemote(scriptKey, inner) {
  if (DEPLOY_KEYS.has(scriptKey)) {
    return `bash -lc '${inner}'`;
  }
  return inner;
}

/**
 * @param {string} scriptKey
 * @param {string} inner
 */
export function buildPasswordModeRemote(scriptKey, inner) {
  if (DEPLOY_KEYS.has(scriptKey)) {
    return `sudo -S -p '' -i bash -lc '${inner}'`;
  }
  return inner;
}

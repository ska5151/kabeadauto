import { spawn } from "node:child_process";
import {
  ALLOWED_SCRIPT_INNER,
  DEPLOY_KEYS,
  buildKeyModeRemote,
  buildPasswordModeRemote,
  stripTerminalEscapes,
} from "./scripts.js";

export function usesPasswordMode() {
  return Boolean(process.env.SSH_PASSWORD);
}

/**
 * @param {string} remoteCommand
 * @param {{ forceTty?: boolean }} [opts]
 */
function sshArgs(remoteCommand, opts = {}) {
  const host = process.env.SSH_HOST;
  const user = process.env.SSH_USER;
  const port = process.env.SSH_PORT || "22";
  const identity = process.env.SSH_IDENTITY;
  if (!host || !user) {
    throw new Error("SSH_HOST and SSH_USER must be set");
  }
  const args = [];
  if (identity) {
    args.push("-i", identity);
  }
  if (opts.forceTty === true) {
    args.push("-tt");
  }
  args.push(
    "-p",
    String(port),
    "-o",
    "BatchMode=yes",
    "-o",
    "StrictHostKeyChecking=accept-new",
  );
  args.push(`${user}@${host}`, remoteCommand);
  return args;
}

/**
 * @param {string} remoteCommand
 * @param {{ forceTty?: boolean }} [opts]
 */
function runSsh(remoteCommand, opts = {}) {
  const args = sshArgs(remoteCommand, opts);
  return new Promise((resolve, reject) => {
    const child = spawn("ssh", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => {
      out += d;
    });
    child.stderr.on("data", (d) => {
      err += d;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 0, out, err });
    });
  });
}

/**
 * @param {string} remoteCommand
 * @param {{ pty?: boolean }} [opts]
 */
function runSshPassword(remoteCommand, opts = {}) {
  const host = process.env.SSH_HOST;
  const user = process.env.SSH_USER;
  const port = parseInt(process.env.SSH_PORT || "22", 10);
  const password = process.env.SSH_PASSWORD;
  const sudoPass = process.env.SUDO_PASSWORD ?? password;
  if (!host || !user || !password) {
    throw new Error(
      "SSH_HOST, SSH_USER, and SSH_PASSWORD must be set for password mode",
    );
  }
  const needsSudoStdin = remoteCommand.startsWith("sudo -S");
  const execOpts = opts.pty === true ? { pty: true } : {};

  return new Promise((resolve, reject) => {
    // Dynamic import avoids Next.js bundling ssh2 native/optional deps at build time.
    import("ssh2")
      .then(({ Client }) => {
        const conn = new Client();
        conn.on("ready", () => {
          conn.exec(remoteCommand, execOpts, (err, stream) => {
            if (err) {
              conn.end();
              reject(err);
              return;
            }
            let out = "";
            let errOut = "";
            stream.on("close", (code) => {
              conn.end();
              resolve({ code: code ?? 0, out, err: errOut });
            });
            stream.on("data", (d) => {
              out += d.toString();
            });
            stream.stderr.on("data", (d) => {
              errOut += d.toString();
            });
            if (needsSudoStdin && sudoPass != null) {
              stream.write(`${sudoPass}\n`);
            }
          });
        });
        conn.on("error", reject);
        conn.connect({
          host,
          port,
          username: user,
          password,
        });
      })
      .catch(reject);
  });
}

/**
 * @param {string} scriptKey
 */
export async function runAllowedScript(scriptKey) {
  const inner = ALLOWED_SCRIPT_INNER[scriptKey];
  if (!inner) {
    throw new Error("unknown script");
  }
  const deployTty = DEPLOY_KEYS.has(scriptKey);
  if (usesPasswordMode()) {
    const remote = buildPasswordModeRemote(scriptKey, inner);
    return runSshPassword(remote, { pty: deployTty });
  }
  const remote = buildKeyModeRemote(scriptKey, inner);
  return runSsh(remote, { forceTty: deployTty });
}

export async function runSshPing() {
  if (usesPasswordMode()) {
    return runSshPassword("echo harness-ping-ok", {});
  }
  return runSsh("echo harness-ping-ok", {});
}

/**
 * @param {{ code: number, out: string, err: string }} r
 */
export function formatSshResult(r) {
  return {
    ok: r.code === 0,
    mode: usesPasswordMode() ? "password" : "key",
    exitCode: r.code,
    stdout: stripTerminalEscapes(r.out).trim(),
    stderr: stripTerminalEscapes(r.err).trim(),
  };
}

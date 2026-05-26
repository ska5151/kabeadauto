import { NextResponse } from "next/server";
import { ALLOWED_SCRIPT_INNER } from "../../../../../lib/baljuanara-deploy/scripts.js";
import { formatSshResult, runAllowedScript } from "../../../../../lib/baljuanara-deploy/ssh.js";

export const maxDuration = 300;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const key = typeof body.script === "string" ? body.script : "";
  if (!ALLOWED_SCRIPT_INNER[key]) {
    return NextResponse.json(
      {
        error: "unknown_or_disallowed_script",
        allowed: Object.keys(ALLOWED_SCRIPT_INNER),
      },
      { status: 400 },
    );
  }

  try {
    const r = await runAllowedScript(key);
    const payload = { ...formatSshResult(r), script: key };
    return NextResponse.json(payload, { status: r.code === 0 ? 200 : 502 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: "server_error", message },
      { status: 500 },
    );
  }
}

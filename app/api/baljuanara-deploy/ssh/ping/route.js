import { NextResponse } from "next/server";
import { formatSshResult, runSshPing } from "../../../../../lib/baljuanara-deploy/ssh.js";

export const maxDuration = 300;

export async function GET() {
  try {
    const r = await runSshPing();
    const body = formatSshResult(r);
    return NextResponse.json(body, { status: r.code === 0 ? 200 : 502 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: "server_error", message },
      { status: 500 },
    );
  }
}

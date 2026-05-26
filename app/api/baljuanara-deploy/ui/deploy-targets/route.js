import { NextResponse } from "next/server";
import { listDeployBetaToProdScriptKeys } from "../../../../../lib/baljuanara-deploy/scripts.js";

export async function GET() {
  return NextResponse.json({ scripts: listDeployBetaToProdScriptKeys() });
}

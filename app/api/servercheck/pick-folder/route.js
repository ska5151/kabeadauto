import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/** Windows 로컬 실행 시 네이티브 폴더 선택 대화상자 */
export async function GET() {
  if (process.platform !== "win32") {
    return NextResponse.json(
      { error: "폴더 선택은 Windows 로컬 환경에서만 지원됩니다." },
      { status: 400 },
    );
  }

  const script = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'JSON 로그 폴더를 선택하세요'
$dialog.ShowNewFolderButton = $false
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $dialog.SelectedPath
}
`;

  try {
    const { stdout } = await execFileAsync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      { timeout: 120_000, windowsHide: false },
    );

    const selectedPath = stdout.trim();
    if (!selectedPath) {
      return NextResponse.json({ cancelled: true });
    }

    return NextResponse.json({ path: selectedPath });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "폴더 선택 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

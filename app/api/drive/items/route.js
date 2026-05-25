import { resolveAccessToken } from "@/lib/accessToken";
import {
  createDriveFolder,
  getDriveClient,
  getDriveErrorMessage,
  renameDriveItem,
  trashDriveItem,
} from "@/lib/drive";
import { mapDriveFolder } from "@/lib/fileType";

export async function POST(request) {
  try {
    const accessToken = await resolveAccessToken();

    if (!accessToken) {
      return Response.json(
        { error: "인증 토큰이 없습니다. 다시 로그인해 주세요." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const parentId = body.parentId || "root";
    const name = String(body.name || "").trim();

    if (!name) {
      return Response.json(
        { error: "폴더 이름을 입력해 주세요." },
        { status: 400 },
      );
    }

    const drive = getDriveClient(accessToken);
    const folder = await createDriveFolder(drive, parentId, name);

    return Response.json({ folder: mapDriveFolder(folder) });
  } catch (error) {
    console.error("Drive folder create error:", error);
    return Response.json(
      { error: getDriveErrorMessage(error) },
      { status: error?.code || 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const accessToken = await resolveAccessToken();

    if (!accessToken) {
      return Response.json(
        { error: "인증 토큰이 없습니다. 다시 로그인해 주세요." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const fileId = String(body.fileId || "").trim();
    const name = String(body.name || "").trim();

    if (!fileId || fileId === "root") {
      return Response.json(
        { error: "이름을 변경할 파일 또는 폴더를 선택해 주세요." },
        { status: 400 },
      );
    }

    if (!name) {
      return Response.json(
        { error: "새 이름을 입력해 주세요." },
        { status: 400 },
      );
    }

    const drive = getDriveClient(accessToken);
    const item = await renameDriveItem(drive, fileId, name);

    return Response.json({ item });
  } catch (error) {
    console.error("Drive item rename error:", error);
    return Response.json(
      { error: getDriveErrorMessage(error) },
      { status: error?.code || 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const accessToken = await resolveAccessToken();

    if (!accessToken) {
      return Response.json(
        { error: "인증 토큰이 없습니다. 다시 로그인해 주세요." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId || fileId === "root") {
      return Response.json(
        { error: "삭제할 파일 또는 폴더를 선택해 주세요." },
        { status: 400 },
      );
    }

    const drive = getDriveClient(accessToken);
    await trashDriveItem(drive, fileId);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Drive item delete error:", error);
    return Response.json(
      { error: getDriveErrorMessage(error) },
      { status: error?.code || 500 },
    );
  }
}

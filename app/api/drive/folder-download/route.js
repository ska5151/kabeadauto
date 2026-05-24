import JSZip from "jszip";
import { resolveAccessToken } from "@/lib/accessToken";
import { getDriveClient, getDriveErrorMessage } from "@/lib/drive";
import {
  downloadDriveFileContent,
  encodeContentDispositionFilename,
  GOOGLE_DRIVE_FOLDER_MIME_TYPE,
  sanitizeZipPathSegment,
} from "@/lib/driveDownload";

async function listFolderItems(drive, folderId) {
  const files = [];
  let pageToken;

  do {
    const response = await drive.files.list({
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      q: `'${folderId}' in parents and trashed=false`,
      pageSize: 1000,
      pageToken,
      fields: "nextPageToken, files(id, name, mimeType)",
      orderBy: "folder,name",
    });

    files.push(...(response.data.files || []));
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return files;
}

function getUniquePath(path, usedPaths) {
  if (!usedPaths.has(path)) {
    usedPaths.add(path);
    return path;
  }

  const slashIndex = path.lastIndexOf("/");
  const directory = slashIndex >= 0 ? `${path.slice(0, slashIndex + 1)}` : "";
  const filename = slashIndex >= 0 ? path.slice(slashIndex + 1) : path;
  const dotIndex = filename.lastIndexOf(".");
  const baseName = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  const ext = dotIndex > 0 ? filename.slice(dotIndex) : "";

  let index = 2;
  let candidate;
  do {
    candidate = `${directory}${baseName} (${index})${ext}`;
    index += 1;
  } while (usedPaths.has(candidate));

  usedPaths.add(candidate);
  return candidate;
}

async function addFolderToZip({
  accessToken,
  drive,
  zip,
  folderId,
  zipPath,
  usedPaths,
}) {
  zip.folder(zipPath);

  const items = await listFolderItems(drive, folderId);

  for (const item of items) {
    const safeName = sanitizeZipPathSegment(item.name);

    if (item.mimeType === GOOGLE_DRIVE_FOLDER_MIME_TYPE) {
      await addFolderToZip({
        accessToken,
        drive,
        zip,
        folderId: item.id,
        zipPath: `${zipPath}${safeName}/`,
        usedPaths,
      });
      continue;
    }

    const { filename, body } = await downloadDriveFileContent({
      accessToken,
      drive,
      file: item,
    });
    const safeFilename = sanitizeZipPathSegment(filename);
    const entryPath = getUniquePath(`${zipPath}${safeFilename}`, usedPaths);
    zip.file(entryPath, body);
  }
}

export async function GET(request) {
  try {
    const accessToken = await resolveAccessToken();

    if (!accessToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    if (!folderId) {
      return new Response("folderId is required", { status: 400 });
    }

    const drive = getDriveClient(accessToken);
    const folderName =
      folderId === "root"
        ? "Drive"
        : (
            await drive.files.get({
              fileId: folderId,
              supportsAllDrives: true,
              fields: "name,mimeType",
            })
          ).data.name;

    const zip = new JSZip();
    const rootName = sanitizeZipPathSegment(folderName);

    await addFolderToZip({
      accessToken,
      drive,
      zip,
      folderId,
      zipPath: `${rootName}/`,
      usedPaths: new Set(),
    });

    const body = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": encodeContentDispositionFilename(`${rootName}.zip`),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Drive folder download error:", error);
    return new Response(getDriveErrorMessage(error), {
      status: error?.code || 500,
    });
  }
}

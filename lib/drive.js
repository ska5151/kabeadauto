import { google } from "googleapis";

export function getDriveClient(accessToken) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ access_token: accessToken });

  return google.drive({ version: "v3", auth });
}

export function getDriveErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.errors?.[0]?.message ||
    error?.message ||
    "Google Drive API 오류"
  );
}

const listOptions = {
  supportsAllDrives: true,
  includeItemsFromAllDrives: true,
};

export async function listFiles(drive, folderId, pageToken) {
  const parent = folderId === "root" ? "root" : folderId;
  const response = await drive.files.list({
    ...listOptions,
    q: `'${parent}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`,
    pageSize: 20,
    pageToken: pageToken || undefined,
    fields:
      "nextPageToken, files(id, name, mimeType, thumbnailLink, iconLink, webViewLink)",
    orderBy: "name",
  });
  return response.data;
}

export async function listFolders(drive, folderId) {
  const parent = folderId === "root" ? "root" : folderId;
  const response = await drive.files.list({
    ...listOptions,
    q: `'${parent}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
    pageSize: 100,
    fields: "files(id, name)",
    orderBy: "name",
  });
  return response.data.files || [];
}

function escapeQueryValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export async function resolveFolderPath(drive, folderPath) {
  if (!folderPath || folderPath === "root") {
    return "root";
  }

  if (!folderPath.includes("/")) {
    return folderPath;
  }

  const segments = folderPath.split("/").filter(Boolean);
  let parentId = "root";

  for (const name of segments) {
    const response = await drive.files.list({
      ...listOptions,
      q: `'${parentId}' in parents and name='${escapeQueryValue(name)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      pageSize: 1,
      fields: "files(id, name)",
    });

    const folder = response.data.files?.[0];
    if (!folder) {
      throw new Error(`폴더를 찾을 수 없습니다: ${name}`);
    }
    parentId = folder.id;
  }

  return parentId;
}

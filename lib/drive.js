import { Readable } from "node:stream";
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

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

function getCopyName(name) {
  return `${name}의 사본`;
}

export async function listFiles(drive, folderId, pageToken) {
  const parent = folderId === "root" ? "root" : folderId;
  const response = await drive.files.list({
    ...listOptions,
    q: `'${parent}' in parents and trashed=false and mimeType!='${FOLDER_MIME_TYPE}'`,
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
    q: `'${parent}' in parents and trashed=false and mimeType='${FOLDER_MIME_TYPE}'`,
    pageSize: 100,
    fields: "files(id, name)",
    orderBy: "name",
  });
  return response.data.files || [];
}

export async function createDriveFolder(drive, parentId, name) {
  const parent = parentId === "root" ? "root" : parentId;
  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name,
      mimeType: FOLDER_MIME_TYPE,
      parents: [parent],
    },
    fields: "id, name",
  });

  return response.data;
}

async function listDriveItemChildren(drive, folderId, pageToken) {
  const response = await drive.files.list({
    ...listOptions,
    q: `'${folderId}' in parents and trashed=false`,
    pageSize: 100,
    pageToken: pageToken || undefined,
    fields: "nextPageToken, files(id, name, mimeType)",
    orderBy: "name",
  });

  return response.data;
}

async function copyDriveFileToFolder(drive, file, parentId, name = file.name) {
  const parent = parentId === "root" ? "root" : parentId;
  const response = await drive.files.copy({
    fileId: file.id,
    supportsAllDrives: true,
    requestBody: {
      name,
      parents: [parent],
    },
    fields: "id, name, mimeType, thumbnailLink, iconLink, webViewLink",
  });

  return response.data;
}

async function copyDriveFolderChildren(drive, sourceFolderId, targetFolderId) {
  let pageToken;

  do {
    const data = await listDriveItemChildren(drive, sourceFolderId, pageToken);
    const children = data.files || [];

    for (const child of children) {
      if (child.mimeType === FOLDER_MIME_TYPE) {
        const copiedFolder = await createDriveFolder(
          drive,
          targetFolderId,
          child.name,
        );
        await copyDriveFolderChildren(drive, child.id, copiedFolder.id);
      } else {
        await copyDriveFileToFolder(drive, child, targetFolderId);
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);
}

export async function copyDriveItem(drive, fileId, parentId) {
  const { data: item } = await drive.files.get({
    fileId,
    supportsAllDrives: true,
    fields: "id, name, mimeType",
  });

  if (item.mimeType === FOLDER_MIME_TYPE) {
    const copiedFolder = await createDriveFolder(
      drive,
      parentId,
      getCopyName(item.name),
    );
    await copyDriveFolderChildren(drive, item.id, copiedFolder.id);
    return { ...copiedFolder, mimeType: FOLDER_MIME_TYPE };
  }

  return copyDriveFileToFolder(drive, item, parentId, getCopyName(item.name));
}

export async function uploadDriveFile(drive, parentId, file) {
  const parent = parentId === "root" ? "root" : parentId;
  const buffer = Buffer.from(await file.arrayBuffer());
  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: file.name,
      parents: [parent],
    },
    media: {
      mimeType: file.type || "application/octet-stream",
      body: Readable.from(buffer),
    },
    fields: "id, name, mimeType, thumbnailLink, iconLink, webViewLink",
  });

  return response.data;
}

export async function renameDriveItem(drive, fileId, name) {
  const response = await drive.files.update({
    fileId,
    supportsAllDrives: true,
    requestBody: {
      name,
    },
    fields: "id, name",
  });

  return response.data;
}

export async function trashDriveItem(drive, fileId) {
  await drive.files.update({
    fileId,
    supportsAllDrives: true,
    requestBody: {
      trashed: true,
    },
  });
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
      q: `'${parentId}' in parents and name='${escapeQueryValue(name)}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false`,
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

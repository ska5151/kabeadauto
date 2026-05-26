export const DRIVE_ITEM_DRAG_MIME = "application/x-kabead-drive-item";

export function setDriveItemDragData(dataTransfer, item) {
  const payload = {
    id: item.id,
    name: item.name,
    kind: item.kind || (item.type === "folder" ? "folder" : "file"),
    parentId: item.parentId,
  };
  dataTransfer.setData(DRIVE_ITEM_DRAG_MIME, JSON.stringify(payload));
  dataTransfer.effectAllowed = "move";
}

export function getDriveItemFromDrag(event) {
  const raw = event.dataTransfer?.getData(DRIVE_ITEM_DRAG_MIME);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isDriveItemDrag(event) {
  return Array.from(event.dataTransfer?.types || []).includes(
    DRIVE_ITEM_DRAG_MIME,
  );
}

export function isFolderDescendant(tree, ancestorId, descendantId) {
  const folder = findFolderInTree(tree, ancestorId);
  if (!folder || !Array.isArray(folder.children)) return false;

  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.id === descendantId) return true;
      if (Array.isArray(node.children) && walk(node.children)) return true;
    }
    return false;
  };

  return walk(folder.children);
}

function findFolderInTree(tree, folderId) {
  for (const folder of tree) {
    if (folder.id === folderId) return folder;
    if (Array.isArray(folder.children)) {
      const found = findFolderInTree(folder.children, folderId);
      if (found) return found;
    }
  }
  return null;
}

export function canDropDriveItemOnFolder(
  draggedItem,
  targetFolderId,
  folderTree,
) {
  if (!draggedItem || !targetFolderId) return false;
  if (draggedItem.id === targetFolderId) return false;
  if (draggedItem.parentId === targetFolderId) return false;

  if (draggedItem.kind === "folder") {
    return !isFolderDescendant(folderTree, draggedItem.id, targetFolderId);
  }

  return true;
}

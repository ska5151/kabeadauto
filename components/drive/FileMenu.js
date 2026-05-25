"use client";

import { Copy, Download, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { downloadDriveFile } from "@/lib/fileType";

export default function FileMenu({
  file,
  buttonClassName = "",
  parentId = "root",
  onCopied,
  onDeleted,
  onRenamed,
}) {
  const [open, setOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const isBusy = isDownloading || isRenaming || isCopying || isDeleting;

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 148;
    const menuHeight = 176;
    const gap = 4;
    const padding = 8;

    let top = rect.bottom + gap;
    let left = rect.right - menuWidth;

    if (top + menuHeight > window.innerHeight - padding) {
      top = rect.top - menuHeight - gap;
    }

    left = Math.max(
      padding,
      Math.min(left, window.innerWidth - menuWidth - padding),
    );
    top = Math.max(padding, top);

    setMenuStyle({ top, left, width: menuWidth });
  }, []);

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const handleOutside = (event) => {
      const target = event.target;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleReposition = () => updateMenuPosition();

    const timerId = window.setTimeout(() => {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
    }, 0);

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updateMenuPosition]);

  const handleDownload = async (event) => {
    event.stopPropagation();
    setOpen(false);
    setIsDownloading(true);

    try {
      await downloadDriveFile(file);
    } catch (error) {
      alert(error.message || "다운로드에 실패했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRename = async (event) => {
    event.stopPropagation();

    const nextName = window.prompt("새 이름을 입력해 주세요.", file.name);
    const trimmedName = nextName?.trim();
    if (!trimmedName || trimmedName === file.name) return;

    setOpen(false);
    setIsRenaming(true);

    try {
      const response = await fetch("/api/drive/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: file.id,
          name: trimmedName,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "이름 변경에 실패했습니다.");
      }

      onRenamed?.({ ...file, name: data.item?.name || trimmedName });
    } catch (error) {
      alert(error.message || "이름 변경에 실패했습니다.");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleCopy = async (event) => {
    event.stopPropagation();
    setOpen(false);
    setIsCopying(true);

    try {
      const response = await fetch("/api/drive/items/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: file.id,
          parentId,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "사본 만들기에 실패했습니다.");
      }

      onCopied?.(data);
    } catch (error) {
      alert(error.message || "사본 만들기에 실패했습니다.");
    } finally {
      setIsCopying(false);
    }
  };

  const handleDelete = async (event) => {
    event.stopPropagation();

    const itemLabel =
      file.kind === "folder" || file.type === "folder" ? "폴더" : "파일";
    const confirmed = window.confirm(
      `${file.name} ${itemLabel}을(를) 삭제하시겠습니까?`,
    );
    if (!confirmed) return;

    setOpen(false);
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/drive/items?fileId=${encodeURIComponent(file.id)}`,
        { method: "DELETE" },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "삭제에 실패했습니다.");
      }

      onDeleted?.(file);
    } catch (error) {
      alert(error.message || "삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const menu =
    open && menuStyle
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] overflow-hidden rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl shadow-slate-950/40"
            style={{
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
            }}
          >
            <button
              type="button"
              onClick={handleDownload}
              disabled={isBusy}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800 active:bg-slate-700 disabled:opacity-60"
            >
              <Download className="h-4 w-4 shrink-0 text-slate-400" />
              {isDownloading ? "다운로드 중..." : "다운로드"}
            </button>
            <button
              type="button"
              onClick={handleRename}
              disabled={isBusy}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800 active:bg-slate-700 disabled:opacity-60"
            >
              <Pencil className="h-4 w-4 shrink-0 text-slate-400" />
              {isRenaming ? "변경 중..." : "이름 바꾸기"}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={isBusy}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800 active:bg-slate-700 disabled:opacity-60"
            >
              <Copy className="h-4 w-4 shrink-0 text-slate-400" />
              {isCopying ? "복제 중..." : "사본 만들기"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isBusy}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-200 transition-colors hover:bg-red-950/60 active:bg-red-950 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4 shrink-0 text-red-300" />
              {isDeleting ? "삭제 중..." : "삭제"}
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (open) {
            setOpen(false);
            return;
          }
          updateMenuPosition();
          setOpen(true);
        }}
        className={`shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-800/80 active:bg-slate-700/80 ${buttonClassName}`}
        aria-label={`${file.name} 메뉴`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {menu}
    </>
  );
}

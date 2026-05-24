"use client";

import { Download, MoreVertical } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { downloadDriveFile } from "@/lib/fileType";

export default function FileMenu({ file, buttonClassName = "" }) {
  const [open, setOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 148;
    const menuHeight = 44;
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

  const menu =
    open && menuStyle
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] overflow-hidden rounded-lg border border-[#dadce0] bg-white py-1 shadow-lg"
            style={{
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
            }}
          >
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#3c4043] transition-colors hover:bg-[#f1f3f4] active:bg-[#e8eaed] disabled:opacity-60"
            >
              <Download className="h-4 w-4 shrink-0 text-[#5f6368]" />
              {isDownloading ? "다운로드 중..." : "다운로드"}
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
        className={`shrink-0 rounded-full p-1 text-[#5f6368] transition-colors hover:bg-[#f1f3f4] active:bg-[#e8eaed] ${buttonClassName}`}
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

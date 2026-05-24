"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { getMediaUrl, isPdfFile, isVideoFile } from "@/lib/fileType";

export default function MediaPreviewModal({ file, onClose }) {
  useEffect(() => {
    if (!file) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [file, onClose]);

  if (!file) return null;

  const mediaUrl = getMediaUrl(file.id);
  const isVideo = isVideoFile(file);
  const isPdf = isPdfFile(file);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${file.name} 미리보기`}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] max-w-[90vw] flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 shadow-md transition-colors hover:bg-slate-800 active:bg-slate-700 sm:-right-3 sm:-top-3"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {isVideo ? (
          <video
            key={file.id}
            src={mediaUrl}
            controls
            autoPlay
            playsInline
            className="max-h-[80vh] max-w-[90vw] rounded-lg bg-black"
          >
            브라우저가 동영상 재생을 지원하지 않습니다.
          </video>
        ) : isPdf ? (
          <iframe
            key={file.id}
            src={mediaUrl}
            title={`${file.name} PDF 미리보기`}
            className="h-[80vh] w-[min(90vw,56rem)] rounded-lg border border-slate-700 bg-white"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt={file.name}
            className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
          />
        )}

        <p className="mt-3 truncate text-center text-sm text-white/90">
          {file.name}
        </p>
      </div>
    </div>
  );
}

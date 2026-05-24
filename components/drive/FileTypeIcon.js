export default function FileTypeIcon({ type, thumbnailUrl }) {
  if (type === "thumbnail" && thumbnailUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  if (type === "logo") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <svg viewBox="0 0 48 48" className="h-14 w-14">
          <path
            fill="#FFC107"
            d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.083 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
          />
          <path
            fill="#FF3D00"
            d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.048 0-9.445-3.007-11.412-7.314l-6.58 5.072C9.551 39.556 16.227 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.197l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
          />
        </svg>
      </div>
    );
  }

  const configs = {
    pdf: { bg: "#451a1a", label: "PDF", labelColor: "#fca5a5", fold: "#ef4444" },
    doc: { bg: "#082f49", label: "DOC", labelColor: "#7dd3fc", fold: "#38bdf8" },
    txt: { bg: "#1e293b", label: "TXT", labelColor: "#cbd5e1", fold: "#64748b" },
    xls: { bg: "#052e16", label: "XLS", labelColor: "#86efac", fold: "#22c55e" },
    ppt: { bg: "#431407", label: "PPT", labelColor: "#fdba74", fold: "#f97316" },
    zip: { bg: "#1e293b", label: "ZIP", labelColor: "#cbd5e1", fold: "#64748b" },
    audio: { bg: "#3b0764", label: "AUD", labelColor: "#d8b4fe", fold: "#a855f7" },
    file: { bg: "#1e293b", label: "FILE", labelColor: "#cbd5e1", fold: "#64748b" },
    "image-yellow": {
      bg: "#422006",
      label: "IMG",
      labelColor: "#fde68a",
      fold: "#f59e0b",
    },
    "image-green": {
      bg: "#052e16",
      label: "IMG",
      labelColor: "#86efac",
      fold: "#22c55e",
    },
    "pdf-yellow": {
      bg: "#422006",
      label: "PDF",
      labelColor: "#fde68a",
      fold: "#f59e0b",
    },
  };

  const config = configs[type] || configs.file;

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: config.bg }}
    >
      <div className="relative h-[72px] w-[56px]">
        <div
          className="absolute inset-0 rounded-sm shadow-sm"
          style={{ backgroundColor: "#f8fafc" }}
        />
        <div
          className="absolute right-0 top-0 h-4 w-4"
          style={{
            background: `linear-gradient(135deg, transparent 50%, ${config.fold} 50%)`,
          }}
        />
        <span
          className="absolute bottom-3 left-0 right-0 text-center text-xs font-bold"
          style={{ color: config.labelColor }}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}

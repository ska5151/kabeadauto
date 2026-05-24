export default function FileTypeIcon({ type, thumbnailUrl }) {
  if (type === "thumbnail" && thumbnailUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden bg-[#f1f3f4]">
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
      <div className="flex h-full w-full items-center justify-center bg-white">
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
    pdf: { bg: "#fce8e6", label: "PDF", labelColor: "#d93025", fold: "#ea4335" },
    doc: { bg: "#e8f0fe", label: "DOC", labelColor: "#1a73e8", fold: "#4285f4" },
    txt: { bg: "#f1f3f4", label: "TXT", labelColor: "#5f6368", fold: "#9aa0a6" },
    xls: { bg: "#e6f4ea", label: "XLS", labelColor: "#188038", fold: "#34a853" },
    ppt: { bg: "#fce8e6", label: "PPT", labelColor: "#d93025", fold: "#ea4335" },
    zip: { bg: "#f1f3f4", label: "ZIP", labelColor: "#5f6368", fold: "#80868b" },
    audio: { bg: "#f3e8fd", label: "AUD", labelColor: "#9334e6", fold: "#a142f4" },
    file: { bg: "#f1f3f4", label: "FILE", labelColor: "#5f6368", fold: "#9aa0a6" },
    "image-yellow": {
      bg: "#fef7e0",
      label: "IMG",
      labelColor: "#f9ab00",
      fold: "#fbbc04",
    },
    "image-green": {
      bg: "#e6f4ea",
      label: "IMG",
      labelColor: "#188038",
      fold: "#34a853",
    },
    "pdf-yellow": {
      bg: "#fef7e0",
      label: "PDF",
      labelColor: "#f9ab00",
      fold: "#fbbc04",
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
          style={{ backgroundColor: "#fff" }}
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

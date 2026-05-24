export default function LoadingFooter({ message = "파일을 더 가져오는 중..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="relative h-6 w-6">
        <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-sky-400" />
      </div>
      <span className="text-sm text-slate-400">{message}</span>
    </div>
  );
}

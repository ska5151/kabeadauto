export default function LoadingFooter({ message = "파일을 더 가져오는 중..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="relative h-6 w-6">
        <div className="absolute inset-0 rounded-full border-2 border-[#e8f0fe]" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#1a73e8]" />
      </div>
      <span className="text-sm text-[#5f6368]">{message}</span>
    </div>
  );
}

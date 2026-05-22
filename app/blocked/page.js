export const metadata = {
  title: "접근 제한",
};

export default function BlockedPage() {
  return (
    <main className="blocked-page">
      <h1>접근할 수 없습니다</h1>
      <p>VIEW 설정이 올바르지 않습니다. 관리자에게 문의하세요.</p>
    </main>
  );
}

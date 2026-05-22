# kabeadAuto

Next.js로 MySQL(다중 DB) 데이터를 **웹 UI**와 터미널·API에서 조회합니다.

## 웹 UI

`npm run dev` 후 브라우저에서 메인 페이지를 엽니다.

- **좌측** 사이드바(메뉴 데이터 없음) + **우측** 상단 탭·하단 콘텐츠 영역(탭 데이터 없음). 탭·메뉴는 `components/AppShell.js`의 `MENU_ITEMS`, `INITIAL_TABS`에 추가.

레이아웃 상세·디렉터리 규칙: [AGENTS.md](./AGENTS.md) 의 **UI 레이아웃** 섹션.

## Setup

```bash
npm install
cp .env.example .env.local
# .env.local 에 MYSQL_*_PRIMARY / SECONDARY 값 입력
```

## Commands

```bash
npm run dev      # http://localhost:3000 — 패널 UI
npm run build
npm run start
npm run fetch -- --db=primary
```

에이전트·규칙: [AGENTS.md](./AGENTS.md)

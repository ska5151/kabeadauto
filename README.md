# kabeadAuto

Next.js로 **웹 UI(Admin Portal)** 와 **API·터미널 스크립트**를 함께 사용하는 데이터 조회·운영 자동화 프로젝트입니다. 브라우저에서 패널 UI를 보여 주고, API·CLI로 MySQL·Notion·Google Drive·SSH 등 외부 서비스에 접속합니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| 런타임 / 언어 | JavaScript (Node.js, ESM) |
| 프레임워크 | [Next.js 15](https://nextjs.org/) (App Router — 페이지·API Route Handlers) |
| UI | React 19, Tailwind CSS 4 |
| DB | MySQL (`mysql2` — named connection: `primary`, `secondary`, `daissue`) |
| 인증 | NextAuth v5 (Google Drive 메뉴) |
| 외부 API | Notion (`@notionhq/client`), Google Drive (`googleapis`), SSH 배포 (`ssh2`) |
| 기타 | Excel보내기 (`xlsx`), ZIP (`jszip`), 아이콘 (`lucide-react`) |
| 실행 | `npm run dev` (웹), `npm run fetch` / `scripts/*.mjs` (터미널) |

## 프로그램 구조

### 아키텍처

```
브라우저 (localhost:1177)
  → AppShell (사이드바·탭)
  → 각 View 컴포넌트
  → app/api/* (Route Handlers)
  → lib/ (DB·쿼리·Notion·Drive·SSH 등)
  → MySQL / Notion / Google / 원격 SSH

터미널 (npm run fetch, scripts/*.mjs)
  → lib/db, lib/queries
  → MySQL → JSON / stdout
```

### 디렉터리

```
kabeadauto/
├── app/
│   ├── page.js, layout.js, globals.css   # 메인·루트 레이아웃·스타일
│   ├── blocked/                          # 접근 차단 페이지
│   └── api/                              # HTTP API
│       ├── auth/                         # NextAuth, 세션 상태
│       ├── health/                       # 헬스체크
│       ├── notion-table/                 # TODO(Notion) 보드
│       ├── daily-report/                 # 일일 보고(Notion PARA)
│       ├── daissue-action-check/         # 다이슈 ACTION 체크
│       ├── drive/                        # Google Drive CRUD·미디어
│       ├── servercheck/                  # IDC 폴더 분석
│       └── baljuanara-deploy/            # 발주나라 SSH 배포 UI API
├── components/
│   ├── AppShell.js                       # 2열 레이아웃·메뉴·탭
│   ├── DriveView.js, NotionView.js, …    # 메뉴별 화면
│   ├── drive/                            # Drive 하위 UI
│   ├── servercheck/                      # IDC 점검 UI
│   └── BaljuanaraView.js, …
├── lib/
│   ├── db/                               # connection registry·pool
│   ├── queries/                          # SQL·Notion 조회 로직
│   ├── notion/                           # Notion 클라이언트·속성 파싱
│   ├── baljuanara-deploy/                # SSH·배포 스크립트·업체 DB
│   ├── servercheck/                      # 폴더 분석·통계·Excel
│   ├── drive.js, auth.js, …              # Drive·인증 공통
│   └── …
├── scripts/
│   ├── fetch.mjs                         # CLI DB ping 조회
│   └── encrypt-view.mjs                  # VIEW 라이선스 암호화
├── middleware.js                         # 인앱 브라우저·라이선스 등
├── .env.example                          # 환경 변수 템플릿
└── AGENTS.md                             # 에이전트·상세 규칙
```

### 웹 UI (메인 메뉴)

Admin Portal 스타일 **2열 레이아웃** (`components/AppShell.js`). 메뉴·탭은 `createMenuItems()`에 정의합니다.

| 메뉴 | 탭 | View | API·데이터 소스 |
|------|-----|------|-----------------|
| 개인 | DRIVE | `DriveView` | `app/api/drive/*`, Google Drive |
| 개인 | TODO | `NotionView` | `app/api/notion-table`, Notion DB |
| 개인 | 일일 보고 | `DailyReportView` | `app/api/daily-report`, Notion PARA |
| 서버 | IDC 점검 | `ServerView` | `app/api/servercheck/*` |
| 다이슈 | ACTION 체크 | `DaishyuView` | `app/api/daissue-action-check`, MySQL `daissue` |
| 발주나라 | 운영 배포 | `BaljuanaraView` | `app/api/baljuanara-deploy/*`, SSH |

레이아웃·메뉴 추가 방법: [AGENTS.md](./AGENTS.md) **UI 레이아웃** 섹션.

## Setup

```bash
npm install
cp .env.example .env.local
# .env.local 에 Notion·Drive·MySQL·SSH 등 값 입력
```

주요 환경 변수는 `.env.example`을 참고합니다. DB 연결 키·전체 목록은 [AGENTS.md](./AGENTS.md) **환경 변수** 섹션.

## Commands

```bash
npm run dev              # http://localhost:1177 — 웹 UI + API
npm run build
npm run start
npm run lint

npm run fetch -- --db=primary    # 터미널 DB 조회 (primary | secondary | daissue)
npm run view:encrypt             # VIEW 라이선스 암호문 생성
```

## 관련 문서

- 에이전트 작업 규칙·코드 규칙·env 상세: [AGENTS.md](./AGENTS.md)

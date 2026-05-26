# kabeadAuto

Next.js로 **웹 UI(프론트엔드)** 와 **서버(API·스크립트)** 를 함께 사용하는 데이터 조회 자동화 프로젝트입니다. 브라우저에서 패널 UI를 보여 주고, 터미널에서 스크립트/API를 실행해 **지정한 MySQL DB**에 접속해 데이터를 가져옵니다. 연결 대상 DB는 **2개 이상**일 수 있습니다.

## 기술 스택

| 항목 | 선택 |
|------|------|
| 런타임 / 언어 | JavaScript (Node.js) |
| 프레임워크 | Next.js (App Router: 페이지·API Route Handlers) |
| UI | React (Next.js 페이지·컴포넌트) |
| DB | MySQL (`mysql2` 등) |
| 실행 방식 | 브라우저(`npm run dev`) 또는 터미널 CLI / `npm run` 스크립트 |

## UI 레이아웃 (메인 페이지)

Admin Portal 스타일 **2열 레이아웃** (`components/AppShell.js`).

| 영역 | 역할 |
|------|------|
| 좌측 사이드바 (`#0F172A`) | 로고·검색·메뉴(`MENU_ITEMS`, 현재 `[]`)·설정 |
| 우측 상단 (`#111827`) | 검색·프로필·**탭 바** (`INITIAL_TABS`, 현재 `[]`) |
| 우측 하단 | 활성 탭의 `content` 표시 (탭 클릭 시 전환) |

- 좌측 메뉴 **개인** 하위 메뉴에는 **DRIVE**, **TODO**, **일일보고**가 있으며 각각 `DriveView`, `NotionView`, `DailyReportView`가 표시됩니다 (`createMenuItems()`).
- **TODO** 메뉴는 `app/api/notion-table/route.js`를 통해 `NOTION_DATABASE_ID` 데이터베이스에서 `PARA = Project 또는 Area` 항목을 조회하고, `PARA` 그룹별 보드로 표시·수정합니다.
- **발주나라 → 운영 배포** 메뉴는 `BaljuanaraView` + `app/api/baljuanara-deploy/*`로 발주나라 deploy 하네스(`D:\project\발주나라\deploy`의 `/ui` 대시보드)와 동일한 SSH 배포 UI·API를 Next.js에서 제공합니다.
- 메뉴·탭 추가 시 `components/AppShell.js`의 `createMenuItems()`에 `{ id, label, icon?, tab?: { id, label, content } }` 형태로 넣습니다.
- 폰트: Inter (`next/font`). 아이콘: Feather 스타일 SVG (`components/icons.js`).

## 아키텍처

```
브라우저 (npm run dev → 메인 페이지, 빈 레이아웃)
    → Next.js (페이지 / API route / lib)
        → DB 연결 선택 (dbKey / connection name)
            → MySQL #1, #2, … (각각 독립 connection)
                → 쿼리 실행 → 결과 반환 (화면 / JSON / stdout)

터미널 (npm run … / node …)
    → Next.js 서버 코드 (API route 또는 lib/ 스크립트)
        → (동일) DB 연결 · 쿼리 → JSON / stdout
```

- **다중 DB**: 환경 변수 또는 설정 파일로 DB별 host, port, user, database, password를 분리합니다. 예: `MYSQL_URL_PRIMARY`, `MYSQL_URL_SECONDARY` 또는 `config/databases.js`의 named connection 맵.
- **DB 선택**: 실행 시 인자·환경 변수·플래그로 대상 DB를 지정합니다 (예: `--db=primary`, `DB_TARGET=secondary`).
- **단일 진입점**: 터미널에서 호출하는 명령은 하나의 패턴을 따릅니다 (아래 Commands 참고).

## 디렉터리·역할 (권장)

구현 시 아래 구조를 기준으로 맞춥니다. 실제 경로가 다르면 이 문서를 함께 갱신합니다.

| 경로 | 역할 |
|------|------|
| `app/page.js` (또는 `app/page.jsx`) | 메인 페이지 (빈 레이아웃) |
| `app/layout.js` | 루트 레이아웃 |
| `app/globals.css` (또는 모듈 CSS) | 패널·뷰포트 단위 스타일 |
| `components/` | UI 컴포넌트 (필요 시 추가) |
| `app/api/` | HTTP API (헬스체크·데이터 조회 등) |
| `lib/db/` | connection pool/factory, named DB registry |
| `lib/queries/` | DB별·도메인별 SQL / 조회 로직 |
| `scripts/` | 터미널 직접 실행용 엔트리 (`node scripts/fetch.mjs`) |
| `.env.local` | DB credentials (git 제외) |

## 코드 규칙

- **JavaScript**만 사용합니다 (TypeScript 도입 시 이 문서 업데이트).
- DB 접속 정보는 코드에 하드코딩하지 않습니다. `.env*` 또는 시크릿 관리 도구만 사용합니다.
- connection은 **요청/실행 단위**로 열고 닫거나, pool을 재사용합니다. 장기 실행 스크립트 종료 시 pool `end()` 호출.
- 다중 DB 시 connection 이름·환경 변수 키·CLI 플래그 이름을 **일관된 식별자**로 통일합니다 (`primary`, `secondary`, …).
- SQL은 파라미터 바인딩(`?` placeholders)을 사용하고, 사용자 입력을 문자열 연결하지 않습니다.
- 에러 시: DB 식별자, 쿼리 이름(또는 파일), 원인 메시지를 로그에 남기되 **비밀번호·전체 connection string**은 출력하지 않습니다.
- UI 패널 레이아웃(3등분·정사각형·패널1→2→3 배치)을 변경할 때는 이 문서 **UI 레이아웃** 섹션을 함께 갱신합니다.

## Commands

프로젝트 루트에서 실행합니다. `package.json`의 `scripts`와 동기화합니다.

```bash
# 의존성 설치
npm install

# 개발 서버 (웹 UI + API)
npm run dev
# 브라우저: http://localhost:1177 — 메인 빈 레이아웃 확인

# 프로덕션 빌드·실행
npm run build
npm run start

# 터미널: 특정 DB에서 데이터 조회 (예시 — 실제 스크립트명은 package.json 기준)
npm run fetch -- --db=primary
npm run fetch -- --db=secondary

# 또는 scripts 직접 실행
node scripts/fetch.mjs --db=primary
```

스크립트 추가·변경 시 위 블록과 `package.json`을 **같이** 수정합니다.

## 환경 변수 (예시)

실제 키 이름은 구현과 맞춥니다. 값은 저장소에 커밋하지 않습니다.

```env
# DB 1
MYSQL_HOST_PRIMARY=
MYSQL_PORT_PRIMARY=3306
MYSQL_USER_PRIMARY=
MYSQL_PASSWORD_PRIMARY=
MYSQL_DATABASE_PRIMARY=

# DB 2
MYSQL_HOST_SECONDARY=
...

# daissue DB (ACTION 체크)
MYSQL_HOST_DAISSUE=
MYSQL_PORT_DAISSUE=3306
MYSQL_USER_DAISSUE=
MYSQL_PASSWORD_DAISSUE=
MYSQL_DATABASE_DAISSUE=

# Notion API
NOTION_API_TOKEN=
NOTION_DATABASE_ID=

# Google Drive API (DRIVE 메뉴)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
AUTH_SECRET=
NEXTAUTH_SECRET=
ROOT_FOLDER_ID=root

# 발주나라 운영 배포 (SSH — deploy 프로젝트와 동일 키)
SSH_HOST=
SSH_USER=
SSH_PORT=22
# SSH_IDENTITY=
# SSH_PASSWORD=
# SUDO_PASSWORD=

# 발주나라 업체 DB 접속 URL (DB 접속 콤보)
# 예)
# 데모=http://...
# 동심사=https://...
```

또는 `DATABASE_URL_PRIMARY`, `DATABASE_URL_SECONDARY` 형태의 단일 URL도 허용합니다.

## 에이전트 작업 시

1. 변경 전 **어느 DB**를 대상으로 하는지 확인합니다 (`--db`, env, connection name).
2. 새 DB 추가 시: env 예시, connection registry, CLI 도움말, 이 문서의 Commands/환경 변수 섹션을 함께 갱신합니다.
3. 터미널로 동작 검증: `npm run fetch` 또는 해당 스크립트로 **각 DB**에 대해 한 번씩 실행해 봅니다.
4. UI 변경 시: `npm run dev`로 메인 페이지 레이아웃을 확인합니다.
5. 범위를 최소화합니다. 인증·배포 파이프라인은 요청 없으면 추가하지 않습니다.

## 금지·주의

- `.env`, credentials, API 키를 git에 커밋하지 않습니다.
- 프로덕션 DB에 대한 **쓰기·삭제·스키마 변경**은 명시적 요청 없이 수행하지 않습니다.
- README와 중복되는 장문 설명은 피하고, **실행 가능한 명령·규칙·경로** 위주로 유지합니다.

## 문서 갱신

아키텍처·UI 레이아웃·스크립트·env 키·DB 개수가 바뀌면 이 파일의 **UI 레이아웃**, **Commands**, **환경 변수**, **디렉터리** 섹션을 같은 PR/커밋에서 업데이트합니다.

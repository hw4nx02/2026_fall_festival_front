# 2026_fall_festival_front

2026년 동국대학교 가을 대동제(풀스온) 사이트 프론트엔드 레포지토리입니다.

## 시작하기

```bash
npm install
cp .env.example .env   # VITE_API_BASE_URL 등 채우기
npm run dev             # 사용자 앱: http://localhost:5173
npm run dev:admin       # 관리자 앱: http://localhost:5174
```

## 기술 스택

- React 19 + Vite
- styled-components (`ComponentName.styles.js` + `import * as S from './ComponentName.styles'` 컨벤션)
- react-router-dom (`userRouter.jsx`, `adminRouter.jsx`로 호스트별 라우트 분리)
- Zustand (도메인을 넘나드는 진짜 전역 상태만 — 로그인/관리자 인증)
- Axios (`src/api/client.js` 공통 인스턴스, `VITE_API_BASE_URL` 사용)
- react-three-fiber + drei (지도 3D 씬, `src/app/map/scene/`)

## 폴더 구조

`src/app/{domain}/` 기준 도메인 폴더링입니다. 각 도메인 폴더 안에 그 화면 전용 `components/`를 둡니다.

```text
src/
├── app/                # 라우트 단위 도메인 (home, map, lantern, performance, info, mypage, auth, admin)
├── components/         # 도메인을 넘나드는 진짜 공통 컴포넌트 (common/, layout/)
├── router/              # 사용자/관리자 라우트 정의 + AdminRoute 가드
├── store/                # Zustand — 전역 상태만 (인증)
├── api/                  # axios 클라이언트 + 도메인별 api 함수
├── hooks/                # 여러 도메인 공용 훅
├── styles/               # GlobalStyle, theme(라이트), adminTheme(다크)
└── constants/            # 구역/카테고리/등불 단계 threshold 등
```

전체 설계 배경과 각 폴더의 역할은 팀 노션/Claude 프로젝트 문서(`frontend-repo-folder-structure.md`)에 정리되어 있습니다.

## Git 워크플로

- Fork 기반: `origin` = 개인 fork, `upstream` = 팀 레포(`LikeLion-at-DGU/2026_fall_festival_front`)
- 브랜치: `{type}/fe/{issue-number}-{description}`
- 커밋: `태그: 제목` (한국어 conventional commit)
- 이슈 1개당 브랜치 1개, 개발 중엔 Draft PR(`Related to #N`), 완료 PR에는 `Closes #N`

## 관리자 페이지

사용자 앱과 관리자 앱은 같은 코드(`src/router/index.jsx`의 `userRoutes` / `adminRoutes`)에서 **빌드만 따로** 만듭니다. 어느 앱인지는 Vite 모드로 정해집니다(`--mode admin`이면 관리자 앱 — `src/router/appTarget.js`).

| 명령 | 결과 |
| --- | --- |
| `npm run dev` / `npm run dev:admin` | 로컬 개발 서버 `http://localhost:5173` — 사용자 앱 / 관리자 앱 (같은 포트라 하나씩 띄우기) |
| `npm run build` | `dist-next/user`(사용자) + `dist-next/admin`(관리자) 둘 다 빌드 |
| `npm run preview` / `npm run preview:admin` | 빌드 결과 미리보기 |

- 배포: nginx가 `dgufesta.com`에 사용자 빌드, `admin.dgufesta.com`에 관리자 빌드를 연결합니다. 관리자는 Cloudflare Access 이메일 로그인 → `/login`에서 관리자 키 입력.
- 백엔드는 Host가 `admin.*`일 때만 관리자 API를 열기 때문에, 로컬 관리자 앱도 `.env`의 `VITE_ADMIN_API_BASE_URL`(`http://admin.localhost:8000`)로 요청합니다.
- 관리자 빌드는 `--mode admin`이라 `.env.production`(`.local`)을 읽지 않습니다(`.env`, `.env.admin`(`.local`)만 읽음).
- 사용자 도메인의 예전 주소(`/admin/...`)는 관리자 도메인의 같은 화면으로 자동 이동합니다(로컬 `npm run dev`에서는 `dev:admin` 안내만 표시).
- 관리자 화면 경로는 `src/router/adminPaths.js`의 `ADMIN_PATHS`로만 만들어 주세요(경로 문자열 직접 쓰지 않기).

일반 사이트와 레이아웃(`AdminAppLayout`)·테마(`adminTheme`, 다크)·인증(`useAdminAuthStore`, 관리자 키)이 완전히 분리되어 있으니, 관리자 화면 작업 시 일반 사이트 컴포넌트를 가져다 쓰지 말고 `src/app/admin/` 안에서 해결해주세요.

import { createBrowserRouter, Navigate } from 'react-router-dom'

import AdminAppLayout from '../components/layout/AdminAppLayout'
import AdminRoute from './AdminRoute'
import AdminHostRedirect from './AdminHostRedirect'
import { ADMIN_PATHS } from './adminPaths'
import { IS_ADMIN_APP } from './appTarget'

import HomePage from '../app/home/HomePage'
import MapPage from '../app/map/MapPage'
import LanternFlowPage from '../app/lantern/LanternFlowPage'
import PerformancePage from '../app/performance/PerformancePage'
import InfoPage from '../app/info/InfoPage'
import ComponentPreviewPage from '../app/dev/ComponentPreviewPage'
import PerformanceDetailPage from '../app/performance/PerformanceDetailPage'

import AdminThemeProvider from '../app/admin/AdminThemeProvider'
import AdminLoginPage from '../app/admin/AdminLoginPage'
import AdminLanternPage from '../app/admin/components/LanternManage/AdminLanternPage'
import AdminNoticePage from '../app/admin/components/NoticeManage/AdminNoticePage'
import AdminNoticeDetailPage from '../app/admin/components/NoticeManage/AdminNoticeDetailPage'
import AdminNoticeEditPage from '../app/admin/components/NoticeManage/AdminNoticeEditPage'
import AdminNoticeCreatePage from '../app/admin/components/NoticeManage/AdminNoticeCreatePage'
import AdminLostFoundPage from '../app/admin/components/LostFoundManage/AdminLostFoundPage'
import AdminLostFoundCreatePage from '../app/admin/components/LostFoundManage/AdminLostFoundCreatePage'
import AdminLostFoundDetailPage from '../app/admin/components/LostFoundManage/AdminLostFoundDetailPage'
import AdminLostFoundEditPage from '../app/admin/components/LostFoundManage/AdminLostFoundEditPage'

<<<<<<< HEAD:src/router/adminRouter.jsx
// admin.dgufesta.com 전용 라우터. 일반 사용자 화면은 관리자 번들에 포함하지 않는다.
export const router = createBrowserRouter([
  {
    element: <AdminThemeProvider />,
    children: [
      { path: '/', element: <Navigate to="/admin/login" replace /> },
      { path: '/admin/login', element: <AdminLoginPage /> },
=======
// 라우트 정의는 이 파일 한 곳에서만 관리한다.
// 일반 사이트(AppLayout, 하단 내비 포함)와 관리자(AdminAppLayout)는 레이아웃부터 완전히 분리되어 있다.
// 2026-09-12 결정(한 코드베이스, 라우트 레벨 통합)은 유지하고, 2026-09-23부터 서버 배포 구조에 맞춰 빌드를 둘로 나눈다.
// - 사용자 빌드 → dgufesta.com: userRoutes
// - 관리자 빌드 → admin.dgufesta.com: adminRoutes (도메인 루트에서 열림) — Cloudflare Access 이메일 로그인 뒤 관리자 키로 2차 인증
// 어느 빌드인지는 appTarget.js의 IS_ADMIN_APP(Vite 모드)으로 고른다.
// (백엔드도 Host가 admin.*일 때만 관리자 API를 열기 때문에 관리자 화면은 관리자 도메인에서만 동작한다)

const userRoutes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'map', element: <MapPage /> },
      { path: 'lantern', element: <LanternFlowPage /> },
      { path: 'performance', element: <PerformancePage /> },
      { path: 'performance/:id', element: <PerformanceDetailPage /> },
      { path: 'info', element: <InfoPage /> },
      { path: 'info/collab/:collabSlug', element: <InfoPage /> },
      { path: 'info/notices/:noticeId', element: <InfoPage /> },
      { path: 'info/lost-items/:lostItemId', element: <InfoPage /> },
    ],
  },
  // 예전 관리자 주소(/admin/...) — 배포에서는 관리자 도메인의 같은 화면으로 이동, 로컬에서는 dev:admin 안내
  { path: '/admin/*', element: <AdminHostRedirect /> },
  ...(import.meta.env.DEV
    ? [{ path: '/ui-preview', element: <ComponentPreviewPage /> }]
    : []),
]

const adminRoutes = [
  {
    // 관리자 화면 전체(로그인 화면 포함)는 다크 테마 서브트리로 감싼다
    element: <AdminThemeProvider />,
    children: [
      { path: ADMIN_PATHS.login, element: <AdminLoginPage /> },
>>>>>>> 84051e8c9c6aba601fdcb6e1fed1f543decd8a2b:src/router/index.jsx
      {
        path: ADMIN_PATHS.home,
        element: <AdminRoute />,
        children: [
<<<<<<< HEAD:src/router/adminRouter.jsx
          { index: true, element: <Navigate to="lanterns" replace /> },
=======
          // 관리자 첫 화면은 등불 관리
          { index: true, element: <Navigate to={ADMIN_PATHS.lanterns} replace /> },
>>>>>>> 84051e8c9c6aba601fdcb6e1fed1f543decd8a2b:src/router/index.jsx
          {
            element: <AdminAppLayout />,
            children: [
              { path: 'lanterns', element: <AdminLanternPage /> },
              { path: 'notices', element: <AdminNoticePage /> },
              { path: 'lost-found', element: <AdminLostFoundPage /> },
            ],
          },
          // 상세 화면은 타이틀/탭 없이 자체 헤더를 쓰므로 AdminAppLayout 밖에 둔다.
          { path: 'notices/new', element: <AdminNoticeCreatePage /> },
          { path: 'notices/:noticeId', element: <AdminNoticeDetailPage /> },
          { path: 'notices/:noticeId/edit', element: <AdminNoticeEditPage /> },
          { path: 'lost-found/new', element: <AdminLostFoundCreatePage /> },
          { path: 'lost-found/:itemId', element: <AdminLostFoundDetailPage /> },
          {
            path: 'lost-found/:itemId/edit',
            element: <AdminLostFoundEditPage />,
          },
        ],
      },
      // 없는 주소는 관리자 첫 화면으로 (로그인 전이면 AdminRoute가 로그인으로 보낸다)
      { path: '*', element: <Navigate to={ADMIN_PATHS.home} replace /> },
    ],
  },
<<<<<<< HEAD:src/router/adminRouter.jsx
])
=======
]

export const router = createBrowserRouter(IS_ADMIN_APP ? adminRoutes : userRoutes)
>>>>>>> 84051e8c9c6aba601fdcb6e1fed1f543decd8a2b:src/router/index.jsx

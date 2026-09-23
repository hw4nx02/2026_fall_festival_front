import { createBrowserRouter, Navigate } from 'react-router-dom'

import AdminAppLayout from '../components/layout/AdminAppLayout'
import AdminRoute from './AdminRoute'
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

// admin.dgufesta.com 전용 라우터. 일반 사용자 화면은 관리자 번들에 포함하지 않는다.
export const router = createBrowserRouter([
  {
    element: <AdminThemeProvider />,
    children: [
      { path: '/', element: <Navigate to="/admin/login" replace /> },
      { path: '/admin/login', element: <AdminLoginPage /> },
      {
        path: '/admin',
        element: <AdminRoute />,
        children: [
          { index: true, element: <Navigate to="lanterns" replace /> },
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
    ],
  },
])

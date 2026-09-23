import { createBrowserRouter } from 'react-router-dom'

import AppLayout from '../components/layout/AppLayout'
import HomePage from '../app/home/HomePage'
import MapPage from '../app/map/MapPage'
import LanternFlowPage from '../app/lantern/LanternFlowPage'
import PerformancePage from '../app/performance/PerformancePage'
import PerformanceDetailPage from '../app/performance/PerformanceDetailPage'
import InfoPage from '../app/info/InfoPage'
import ComponentPreviewPage from '../app/dev/ComponentPreviewPage'

// dgufesta.com 전용 라우터. 관리자 화면은 사용자 번들에 포함하지 않는다.
export const router = createBrowserRouter([
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
  ...(import.meta.env.DEV
    ? [{ path: '/ui-preview', element: <ComponentPreviewPage /> }]
    : []),
])

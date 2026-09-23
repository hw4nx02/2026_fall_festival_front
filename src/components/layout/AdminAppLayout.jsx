import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import * as S from './AdminAppLayout.styles';

// 관리자 전용 레이아웃 — adminTheme(다크)는 관리자 도메인의 라우트(router/index.jsx adminRoutes)에만 적용된다
export default function AdminAppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <S.Page>
      <S.Container>
        <S.Title>2026 가을 대동제 관리자 페이지</S.Title>
        <S.Header>
          {S.TABS.map((tab) => (
            <S.Tab
              key={tab.path}
              type="button"
              $active={pathname.startsWith(tab.path)}
              aria-current={pathname.startsWith(tab.path) ? 'page' : undefined}
              onClick={() => navigate(tab.path)}
            >
              {tab.label}
            </S.Tab>
          ))}
          </S.Header>
        <main>
          <Outlet />
        </main>
      </S.Container>
    </S.Page>
  )
}

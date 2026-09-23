import { ThemeProvider } from 'styled-components'
import { Outlet } from 'react-router-dom'
import { adminTheme } from '../../styles/adminTheme'

// 관리자 화면 전체(로그인 포함)에 다크 테마를 적용하는 레이아웃 라우트.
// styled-components의 ThemeProvider는 중첩 가능해서, 최상위 App.jsx의 라이트 테마를
// 이 서브트리 안에서만 다크 테마로 덮어쓸 수 있다.
export default function AdminThemeProvider() {
  return (
    <ThemeProvider theme={adminTheme}>
      <Outlet />
    </ThemeProvider>
  )
}

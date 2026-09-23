import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { router } from '@app-router'
import { theme } from './styles/theme'
import { GlobalStyle } from './styles/GlobalStyle'
import I18nProvider from './i18n/I18nProvider'

// Vite 설정이 배포 대상에 맞는 사용자/관리자 라우터만 번들에 포함한다.
// 관리자 라우터는 AdminThemeProvider로 이 기본 테마를 중첩 덮어쓴다.
export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <RouterProvider router={router} />
      </ThemeProvider>
    </I18nProvider>
  )
}

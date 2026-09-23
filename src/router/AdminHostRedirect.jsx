import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAdminOrigin } from './adminPaths'

// 사용자 앱에서 예전 관리자 주소(/admin/...)로 들어온 경우를 처리한다.
// - 배포: 관리자 도메인의 같은 화면으로 보낸다(관리자 API와 Cloudflare Access는 관리자 도메인에서만 동작하기 때문)
//   예) /admin/login → admin.dgufesta.com/login, /admin/notices/3 → admin.dgufesta.com/notices/3
// - 로컬 개발: 관리자 앱은 npm run dev:admin으로 따로 띄우므로 이동하지 않고 안내만 보여준다
export default function AdminHostRedirect() {
  if (import.meta.env.DEV) {
    return (
      <p>
        관리자 화면은 <code>npm run dev:admin</code>으로 따로 띄운 뒤 <code>/login</code>으로 접속하세요.
      </p>
    )
  }
  return <RedirectToAdminHost />
}

function RedirectToAdminHost() {
  const { pathname, search, hash } = useLocation()
  const adminOrigin = getAdminOrigin()

  useEffect(() => {
    if (!adminOrigin) return
    const adminPathname = pathname.replace(/^\/admin(?=\/|$)/, '') || '/'
    window.location.replace(`${adminOrigin}${adminPathname}${search}${hash}`)
  }, [adminOrigin, pathname, search, hash])

  // 관리자 도메인을 만들 수 없는 접속(IP 직접 접속 등)은 홈으로
  if (!adminOrigin) return <Navigate to="/" replace />
  return null
}

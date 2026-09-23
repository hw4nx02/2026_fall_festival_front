import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuthStore } from '../store/useAdminAuthStore'
import { ADMIN_PATHS } from './adminPaths'

// 관리자 화면(로그인 제외)을 감싸는 가드. 관리자 키 인증(useAdminAuthStore)이 안 된 상태면
// 로그인 페이지로 되돌린다. 일반 사용자 로그인(useAuthStore)과는 별개로 동작.
export default function AdminRoute() {
  const isAdminAuthed = useAdminAuthStore((state) => state.isAdminAuthed)

  if (!isAdminAuthed) {
    return <Navigate to={ADMIN_PATHS.login} replace />
  }

  return <Outlet />
}

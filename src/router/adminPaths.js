// 관리자 화면 경로 모음.
// 관리자 화면은 관리자 빌드(dist/admin)로 관리자 도메인(admin.dgufesta.com)의 루트에서 열린다.
// 경로 문자열을 컴포넌트마다 직접 쓰지 않고 여기서 만들어 쓴다 — 주소 구조가 바뀌어도 이 파일만 고치면 된다.
// (라우트 패턴 자체는 router/index.jsx의 adminRoutes에서만 정의한다)
export const ADMIN_PATHS = {
  home: '/',
  login: '/login',
  lanterns: '/lanterns',
  notices: '/notices',
  noticeNew: (type) => `/notices/new?type=${type}`,
  noticeDetail: (noticeId) => `/notices/${noticeId}`,
  noticeEdit: (noticeId) => `/notices/${noticeId}/edit`,
  lostFound: '/lost-found',
  lostFoundNew: (date) => `/lost-found/new?date=${encodeURIComponent(date)}`,
  lostFoundDetail: (itemId) => `/lost-found/${itemId}`,
  lostFoundEdit: (itemId) => `/lost-found/${itemId}/edit`,
}

const IPV4_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/

// 사용자 도메인에서 본 관리자 도메인 주소 — dgufesta.com → https://admin.dgufesta.com
// IP로 직접 접속한 경우처럼 관리자 도메인을 만들 수 없으면 null
export const getAdminOrigin = ({ protocol, hostname, port } = window.location) => {
  if (IPV4_PATTERN.test(hostname)) return null
  const baseHost = hostname.replace(/^www\./, '')
  return `${protocol}//admin.${baseHost}${port ? `:${port}` : ''}`
}

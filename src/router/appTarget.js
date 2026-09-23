// 이 앱이 사용자 앱인지 관리자 앱인지는 Vite 모드로 정해진다 — --mode admin으로 실행/빌드하면 관리자 앱.
// - 로컬 개발: npm run dev(사용자) / npm run dev:admin(관리자)
// - 빌드: npm run build가 사용자 빌드와 관리자 빌드를 차례로 만든다(출력 폴더는 package.json의 build:* 스크립트)
// 배포에서는 nginx가 dgufesta.com에 사용자 빌드를, admin.dgufesta.com에 관리자 빌드를 연결한다.
export const IS_ADMIN_APP = import.meta.env.MODE === 'admin'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// 관리자 키 인증 상태 — 일반 사용자 인증(useAuthStore)과 완전히 분리
// AdminRoute가 이 값을 보고 관리자 화면 접근을 막는다.
// 새로고침해도 로그인이 풀리지 않도록 sessionStorage에 저장한다.
// 탭을 닫으면 사라지게 일부러 localStorage가 아닌 sessionStorage를 쓴다(공용 PC에 관리자 키가 남지 않도록).
export const useAdminAuthStore = create(
  persist(
    (set) => ({
      adminToken: null,
      isAdminAuthed: false,
      loginAsAdmin: (adminToken) => set({ adminToken, isAdminAuthed: true }),
      logoutAdmin: () => set({ adminToken: null, isAdminAuthed: false }),
    }),
    {
      name: 'fall-festival-admin-auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminHostMismatchError, adminLogin } from '../../api/admin'
import { useAdminAuthStore } from '../../store/useAdminAuthStore'
import { ADMIN_PATHS } from '../../router/adminPaths'
import * as S from './AdminLoginPage.styles'

import keyIcon from '../../assets/admin/key.svg'

// 실패 원인별 안내 — 키가 틀린 경우와 관리자 서버에 못 붙은 경우를 구분해야 관리자가 스스로 대처할 수 있다
const toLoginErrorMessage = (error) => {
  if (error instanceof AdminHostMismatchError) {
    return '관리자 서버에 연결되지 않았습니다. 관리자 주소로 접속했는지 확인해주세요.'
  }
  if (error?.response?.status === 401) return '관리자 키가 맞지 않습니다.'
  return '서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.'
}

// 관리자 키 입력 로그인 — 일반 사용자 로그인(카카오)과 완전히 별개.
// 성공 시 useAdminAuthStore에 토큰을 저장하고 AdminRoute 가드를 통과시킨다.
export default function AdminLoginPage() {
  const [adminKey, setAdminKey] = useState('')
  const [error, setError] = useState('')
  const loginAsAdmin = useAdminAuthStore((state) => state.loginAsAdmin)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // 앞뒤 공백이 섞이면 백엔드의 정확 일치 비교에서 401이 나므로 잘라서 보낸다
      loginAsAdmin(await adminLogin(adminKey.trim()))
      navigate(ADMIN_PATHS.lanterns)
    } catch (loginError) {
      setError(toLoginErrorMessage(loginError))
    }
  }

  return (
    <S.Page>
      <S.Form onSubmit={handleSubmit}>
        <S.Logo>로고</S.Logo>
        <S.Title>2026 가을 대동제 관리자 페이지</S.Title>
        <S.InputWrapper>
          <S.KeyIcon src={keyIcon} alt="" />

          <S.Input
            type="password"
            value={adminKey}
            onChange={(e) => {
              setAdminKey(e.target.value)
              if (error) setError('')
            }}
            placeholder="관리자 키를 입력하세요..."
          />
        </S.InputWrapper>
        {error && <S.ErrorMessage role="alert">{error}</S.ErrorMessage>}
        <S.SubmitButton type="submit" disabled={!adminKey.trim()}>
          로그인
        </S.SubmitButton>
      </S.Form>
    </S.Page>
  )
}

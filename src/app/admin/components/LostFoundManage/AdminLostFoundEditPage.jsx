import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import LostFoundEditor from './LostFoundEditor'
import { getAdminLostItemDetail, updateAdminLostItem } from '../../../../api/admin'
import { sortBySortOrder, toKeywords } from './lostItemFields'
import * as S from './AdminLostFoundDetailPage.styles'
import { ADMIN_PATHS } from '../../../../router/adminPaths'

// 400/404 응답 안내 문구 — errors에는 문제가 된 필드만 담겨 온다
const toErrorMessage = (error) => {
  const data = error.response?.data
  const fieldMessages = Object.values(data?.errors ?? {}).filter(Boolean)
  if (fieldMessages.length) return fieldMessages.join(' ')
  return data?.message ?? '분실물 수정에 실패했습니다.'
}

export default function AdminLostFoundEditPage() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const detailPath = ADMIN_PATHS.lostFoundDetail(itemId)

  // 에디터는 마운트 시점의 값으로 초기화되므로 상세 조회가 끝난 뒤에 렌더한다
  const [item, setItem] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    setIsLoading(true)

    getAdminLostItemDetail(itemId)
      .then((res) => {
        if (ignore) return
        setItem(res.data?.data ?? null)
        setError('')
      })
      .catch((err) => {
        if (ignore) return
        setItem(null)
        const status = err.response?.status
        if (status === 404) setError('분실물을 찾을 수 없습니다.')
        else if (status === 401) setError('관리자 인증이 필요합니다.')
        else setError('분실물 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [itemId])

  // 이미지/태그는 replace-all이라 화면의 최종 배열을 그대로 보낸다
  const handleSave = async ({ date, title, keywords, imageUrls }) => {
    try {
      // 에디터는 사진 1장만 다루므로, 사진을 바꾸지 않았다면 기존 목록을 그대로 다시 보낸다
      // (2장 이상 등록된 항목의 나머지 사진이 replace-all로 지워지지 않게)
      const originalUrls = sortBySortOrder(item.images).map((image) => image.image_url)
      const isImageUnchanged = imageUrls[0] === originalUrls[0]
      await updateAdminLostItem(itemId, {
        title,
        foundDate: date,
        tags: keywords,
        imageUrls: isImageUnchanged ? originalUrls : imageUrls,
      })
      navigate(detailPath)
    } catch (err) {
      return toErrorMessage(err)
    }
  }

  // 이 라우트는 탭 레이아웃 밖이라, 조회 실패 시에도 돌아갈 헤더는 직접 그려준다
  if (isLoading || !item) {
    return (
      <S.Page>
        <S.Container>
          <S.Header>
            <S.BackButton type="button" aria-label="뒤로가기" onClick={() => navigate(detailPath)}>
              <svg width="12" height="22" viewBox="0 0 12 22" fill="none" aria-hidden="true">
                <path d="M11 1L1 11L11 21" stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </S.BackButton>
            <S.HeaderTitle>분실물 관리</S.HeaderTitle>
          </S.Header>
          {isLoading ? (
            <S.StatusMessage>불러오는 중...</S.StatusMessage>
          ) : (
            <S.StatusMessage role="alert">{error}</S.StatusMessage>
          )}
        </S.Container>
      </S.Page>
    )
  }

  return (
    <LostFoundEditor
      initialDate={item.found_date}
      initialTitle={item.title}
      initialImageUrl={sortBySortOrder(item.images)[0]?.image_url ?? ''}
      initialKeywords={toKeywords(item.tags)}
      lockLastKeyword
      submitLabel="게시물 저장하기"
      continueLabel="계속 수정하기"
      leaveDescription="저장하지 않은 게시물은 수정사항이 반영되지 않습니다."
      onSubmit={handleSave}
      onLeave={() => navigate(detailPath)}
    />
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import * as S from './AdminLostFoundDetailPage.styles'
import { deleteAdminLostItem, getAdminLostItemDetail } from '../../../../api/admin'
import { toDateLabel } from './lostFoundDates'
import { sortBySortOrder } from './lostItemFields'
import ConfirmDeleteModal from '../LanternManage/ConfirmDeleteModal'
import { ADMIN_PATHS } from '../../../../router/adminPaths'

export default function AdminLostFoundDetailPage() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // GET /api/lost-items/{lost_item_id}/
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

  const goToList = () => navigate(ADMIN_PATHS.lostFound)

  const handleDeleteConfirm = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await deleteAdminLostItem(itemId)
      setIsDeleteOpen(false)
      goToList()
    } catch (err) {
      // 404는 이미 삭제된 경우도 포함 — 어차피 없는 항목이니 목록으로 보낸다
      if (err.response?.status === 404) {
        setIsDeleteOpen(false)
        goToList()
        return
      }
      setDeleteError(err.response?.data?.message ?? '삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <S.Page>
      <S.Container>
        <S.Header>
          <S.BackButton type="button" aria-label="뒤로가기" onClick={goToList}>
            <svg width="12" height="22" viewBox="0 0 12 22" fill="none" aria-hidden="true">
              <path d="M11 1L1 11L11 21" stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </S.BackButton>
          <S.HeaderTitle>분실물 관리</S.HeaderTitle>
        </S.Header>

        {isLoading && <S.StatusMessage>불러오는 중...</S.StatusMessage>}
        {error && <S.StatusMessage role="alert">{error}</S.StatusMessage>}

        {item && (
          <>
            <S.TitleRow>
              <S.DateTag>{toDateLabel(item.found_date)}</S.DateTag>
              <S.Title>{item.title}</S.Title>
            </S.TitleRow>
            {/* 이미지가 없으면 빈 영역 하나만 보여준다 (등록 화면과 같은 정사각형 틀) */}
            <S.ImageList>
              {item.images?.length ? (
                sortBySortOrder(item.images).map((image) => (
                  <S.ImageArea key={image.image_id}>
                    <S.Image src={image.image_url} alt="" />
                  </S.ImageArea>
                ))
              ) : (
                <S.ImageArea />
              )}
            </S.ImageList>
            <S.KeywordSection>
              <S.KeywordList>
                {/* 상세는 키워드 칩 전체 노출 (목록은 상위 3개만) */}
                {sortBySortOrder(item.tags).map((tag) => (
                  <S.Keyword key={tag.tag_id}>#{tag.keyword}</S.Keyword>
                ))}
              </S.KeywordList>
            </S.KeywordSection>
            <S.BottomBar>
              <S.PrimaryButton type="button" onClick={() => navigate(ADMIN_PATHS.lostFoundEdit(itemId))}>
                게시물 수정하기
              </S.PrimaryButton>
              <S.DangerButton type="button" onClick={() => setIsDeleteOpen(true)}>
                삭제하기
              </S.DangerButton>
            </S.BottomBar>
          </>
        )}
      </S.Container>

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        isDeleting={isDeleting}
        errorMessage={deleteError}
        onClose={() => {
          setIsDeleteOpen(false)
          setDeleteError('')
        }}
        onConfirm={handleDeleteConfirm}
      />
    </S.Page>
  )
}

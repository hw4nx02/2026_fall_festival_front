import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import * as S from './AdminNoticeDetailPage.styles'
import { deleteAdminNotice, getAdminNoticeDetail } from '../../../../api/admin'
import { getNoticeTypeLabel, isUrgentNotice } from './noticeTypes'
import ConfirmDeleteModal from '../LanternManage/ConfirmDeleteModal'
import { ADMIN_PATHS } from '../../../../router/adminPaths'

export default function AdminNoticeDetailPage() {
  const { noticeId } = useParams()
  const navigate = useNavigate()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // GET /api/notices/{notice_id}/
  const [notice, setNotice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    setIsLoading(true)

    getAdminNoticeDetail(noticeId)
      .then((res) => {
        if (ignore) return
        setNotice(res.data?.data ?? null)
        setError('')
      })
      .catch((err) => {
        if (ignore) return
        setNotice(null)
        const status = err.response?.status
        if (status === 404) setError('존재하지 않거나 삭제된 공지사항입니다.')
        else if (status === 401) setError('관리자 인증이 필요합니다.')
        else setError('공지 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [noticeId])

  const goToList = () => navigate(ADMIN_PATHS.notices)

  const handleDeleteConfirm = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await deleteAdminNotice(noticeId)
      setIsDeleteOpen(false)
      goToList()
    } catch (err) {
      // 404는 이미 삭제된 경우도 포함 — 어차피 없는 공지이니 목록으로 보낸다
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
          <S.HeaderTitle>공지 관리</S.HeaderTitle>
        </S.Header>

        {isLoading && <S.StatusMessage>불러오는 중...</S.StatusMessage>}
        {!isLoading && error && <S.StatusMessage role="alert">{error}</S.StatusMessage>}

        {!isLoading && notice && (
          <>
            <S.TitleRow>
              <S.TypeTag $urgent={isUrgentNotice(notice.type)}>{getNoticeTypeLabel(notice.type)}</S.TypeTag>
              <S.Title>{notice.title}</S.Title>
            </S.TitleRow>
            <S.ContentCard>
              {notice.image_url && <S.Image src={notice.image_url} alt="" />}
              <S.Content>{notice.content}</S.Content>
            </S.ContentCard>
            <S.BottomBar>
              <S.PrimaryButton type="button" onClick={() => navigate(ADMIN_PATHS.noticeEdit(noticeId))}>
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

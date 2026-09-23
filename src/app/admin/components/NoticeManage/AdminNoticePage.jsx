import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import * as S from './AdminNoticePage.styles'
import { getAdminNotices } from '../../../../api/admin'
import { getNoticeTypeLabel, isUrgentNotice } from './noticeTypes'
import NoticeTypeSelectModal from './NoticeTypeSelectModal'
import { ADMIN_PATHS } from '../../../../router/adminPaths'

// 한 번에 불러오는 개수 (명세상 size 최대 100)
const PAGE_SIZE = 20

export default function AdminNoticePage() {
  const navigate = useNavigate()
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false)

  // GET /api/notices/ — 페이징이라 page를 올리면서 items를 이어붙인다
  const [notices, setNotices] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    setIsLoading(true)

    getAdminNotices({ page, size: PAGE_SIZE })
      .then((res) => {
        if (ignore) return
        const data = res.data?.data ?? {}
        const nextItems = data.items ?? []
        setNotices((prev) => (page === 0 ? nextItems : [...prev, ...nextItems]))
        // 페이지 정보는 data.meta에 따로 담겨 온다
        setTotalCount(data.meta?.total_count ?? 0)
        setHasNext(data.meta?.has_next ?? false)
        setError('')
      })
      .catch((err) => {
        if (ignore) return
        setError(
          err.response?.status === 401
            ? '관리자 인증이 필요합니다.'
            : '공지 목록을 불러오지 못했습니다.',
        )
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [page])

  return (
    <S.Page>
      <S.TotalCount>{totalCount}개</S.TotalCount>
      <S.NoticeList>
        {notices.map((n) => (
          <S.NoticeCard key={n.id} onClick={() => navigate(ADMIN_PATHS.noticeDetail(n.id))}>
            <S.TitleRow>
              <S.TypeTag $urgent={isUrgentNotice(n.type)}>{getNoticeTypeLabel(n.type)}</S.TypeTag>
              <S.Title>{n.title}</S.Title>
            </S.TitleRow>
            {/* 목록도 본문 전체가 오므로 한 줄 말줄임으로 미리보기만 보여준다 */}
            <S.Preview>{n.content}</S.Preview>
          </S.NoticeCard>
        ))}
      </S.NoticeList>

      {error && <S.StatusMessage role="alert">{error}</S.StatusMessage>}
      {isLoading && <S.StatusMessage>불러오는 중...</S.StatusMessage>}
      {!isLoading && !error && notices.length === 0 && (
        <S.StatusMessage>등록된 공지가 없습니다.</S.StatusMessage>
      )}
      {hasNext && !isLoading && !error && (
        <S.LoadMoreButton type="button" onClick={() => setPage((prev) => prev + 1)}>
          더보기
        </S.LoadMoreButton>
      )}
      <S.BottomBar>
        <S.PrimaryButton type="button" onClick={() => setIsTypeSelectOpen(true)}>
          공지 등록하기
        </S.PrimaryButton>
      </S.BottomBar>

      <NoticeTypeSelectModal
        isOpen={isTypeSelectOpen}
        onClose={() => setIsTypeSelectOpen(false)}
        onSelect={(type) => navigate(ADMIN_PATHS.noticeNew(type))}
      />
    </S.Page>
  )
}

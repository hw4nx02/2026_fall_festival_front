import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import * as S from './AdminLostFoundPage.styles'
import { getAdminLostItems } from '../../../../api/admin'
import { toDateLabel } from './lostFoundDates'
import LostFoundDateSelectModal from './LostFoundDateSelectModal'
import { ADMIN_PATHS } from '../../../../router/adminPaths'

// 한 번에 불러오는 개수 (명세상 size 최대 100)
const PAGE_SIZE = 20

// 분실물 관리 — 목록(날짜/제목/해시태그), 신규 등록(날짜 선택 모달→작성)
export default function AdminLostFoundPage() {
  const navigate = useNavigate()
  const [isDateSelectOpen, setIsDateSelectOpen] = useState(false)

  // GET /api/lost-items/ — 페이징이라 page를 올리면서 items를 이어붙인다
  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    setIsLoading(true)

    getAdminLostItems({ page, size: PAGE_SIZE })
      .then((res) => {
        if (ignore) return
        const data = res.data?.data ?? {}
        const nextItems = data.items ?? []
        // page 0은 첫 조회/필터 변경, 그 외에는 "더보기"라 뒤에 이어붙인다
        setItems((prev) => (page === 0 ? nextItems : [...prev, ...nextItems]))
        setTotalCount(data.total_count ?? 0)
        setHasNext(data.has_next ?? false)
        setError('')
      })
      .catch((err) => {
        if (ignore) return
        setError(
          err.response?.status === 401
            ? '관리자 인증이 필요합니다.'
            : '분실물 목록을 불러오지 못했습니다.',
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
      <S.ItemList>
        {items.map((item) => (
          <S.ItemCard
            key={item.lost_item_id}
            onClick={() => navigate(ADMIN_PATHS.lostFoundDetail(item.lost_item_id))}
          >
            <S.CardContent>
              <S.TitleRow>
                <S.DateTag>{toDateLabel(item.found_date)}</S.DateTag>
                <S.Title>{item.title}</S.Title>
              </S.TitleRow>
              <S.KeywordList>
                {/* 키워드 칩은 작성 순서로 상위 3개만 (서버도 3개까지만 내려줌) */}
                {item.tags?.slice(0, 3).map((tag) => (
                  <S.Keyword key={tag}>#{tag}</S.Keyword>
                ))}
              </S.KeywordList>
            </S.CardContent>
            <S.Thumbnail>{item.thumbnail_url && <img src={item.thumbnail_url} alt="" />}</S.Thumbnail>
          </S.ItemCard>
        ))}
      </S.ItemList>

      {error && <S.StatusMessage role="alert">{error}</S.StatusMessage>}
      {isLoading && <S.StatusMessage>불러오는 중...</S.StatusMessage>}
      {!isLoading && !error && items.length === 0 && (
        <S.StatusMessage>등록된 분실물이 없습니다.</S.StatusMessage>
      )}
      {hasNext && !isLoading && !error && (
        <S.LoadMoreButton type="button" onClick={() => setPage((prev) => prev + 1)}>
          더보기
        </S.LoadMoreButton>
      )}
      <S.BottomBar>
        <S.PrimaryButton type="button" onClick={() => setIsDateSelectOpen(true)}>
          분실물 추가하기
        </S.PrimaryButton>
      </S.BottomBar>

      <LostFoundDateSelectModal
        isOpen={isDateSelectOpen}
        onClose={() => setIsDateSelectOpen(false)}
        onSelect={(date) => navigate(ADMIN_PATHS.lostFoundNew(date))}
      />
    </S.Page>
  )
}

import { useNavigate, useSearchParams } from 'react-router-dom'

import LostFoundEditor from './LostFoundEditor'
import { createAdminLostItem } from '../../../../api/admin'
import { ADMIN_PATHS } from '../../../../router/adminPaths'

const LIST_PATH = ADMIN_PATHS.lostFound

// 400 응답의 errors에는 누락된 필드만 담겨 온다 — 있는 것만 모아서 안내 문구로 쓴다
const toErrorMessage = (error) => {
  const data = error.response?.data
  const fieldMessages = Object.values(data?.errors ?? {}).filter(Boolean)
  if (fieldMessages.length) return fieldMessages.join(' ')
  return data?.message ?? '분실물 등록에 실패했습니다.'
}

export default function AdminLostFoundCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 실패 시 에디터가 토스트로 띄울 메시지를 돌려준다 (성공하면 목록으로)
  const handleCreate = async ({ date, title, keywords, imageUrls }) => {
    try {
      // imageUrls는 에디터에서 사진을 고를 때 이미 업로드가 끝난 URL
      await createAdminLostItem({ title, foundDate: date, tags: keywords, imageUrls })
      navigate(LIST_PATH)
    } catch (error) {
      return toErrorMessage(error)
    }
  }

  return (
    <LostFoundEditor
      initialDate={searchParams.get('date')}
      submitLabel="게시물 저장하기"
      continueLabel="계속 작성하기"
      onSubmit={handleCreate}
      onLeave={() => navigate(LIST_PATH)}
    />
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import * as S from './NoticeEditor.styles'
import NoticeEditor from './NoticeEditor'
import { getAdminNoticeDetail, updateAdminNotice } from '../../../../api/admin'
import { getNoticeTypeLabel, isUrgentNotice } from './noticeTypes'
import { IMAGE_SIZE_MESSAGE, isImageTooLarge, toNoticeErrorMessage, uploadNoticeImage } from './noticeForm'
import { ADMIN_PATHS } from '../../../../router/adminPaths'

export default function AdminNoticeEditPage() {
  const { noticeId } = useParams()
  const navigate = useNavigate()
  const detailPath = ADMIN_PATHS.noticeDetail(noticeId)

  // 초기값 바인딩용 상세 조회 — NoticeEditor는 initial* 값을 첫 렌더에서만 읽으므로 로드 후에 그린다
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    let ignore = false

    getAdminNoticeDetail(noticeId)
      .then((res) => {
        if (!ignore) setNotice(res.data?.data ?? null)
      })
      .catch(() => {
        // 404(삭제됨)·인증 실패 등은 상세 화면에서 안내하도록 되돌려 보낸다
        if (!ignore) navigate(detailPath, { replace: true })
      })

    return () => {
      ignore = true
    }
  }, [noticeId, navigate, detailPath])

  if (!notice) return null

  // 실패 시 에디터가 토스트로 띄울 메시지를 돌려준다 (성공하면 상세로)
  const handleSave = async ({ title, content, imageFile }) => {
    if (isImageTooLarge(imageFile)) return IMAGE_SIZE_MESSAGE
    try {
      // image_url: 새 사진을 골랐으면 업로드한 새 URL, 아니면 기존 URL 그대로(없으면 null) → 기존 사진 유지
      const imageUrl = imageFile ? await uploadNoticeImage(imageFile) : notice.image_url ?? null
      // 이 화면에선 유형을 바꾸지 않지만 type은 필수라 기존 값을 그대로 보낸다
      await updateAdminNotice(notice.id, {
        type: notice.type,
        title: title.trim(),
        content: content.trim(),
        imageUrl,
      })
      navigate(detailPath)
    } catch (err) {
      return toNoticeErrorMessage(err, '공지 수정에 실패했습니다.')
    }
  }

  return (
    <NoticeEditor
      typeSlot={<S.TypeTag $urgent={isUrgentNotice(notice.type)}>{getNoticeTypeLabel(notice.type)}</S.TypeTag>}
      initialTitle={notice.title}
      initialContent={notice.content}
      initialImageUrl={notice.image_url}
      submitLabel="게시물 저장하기"
      toastMessage="제목 및 본문은 필수 입력입니다. 미입력 시 저장되지 않습니다."
      continueLabel="계속 수정하기"
      onSubmit={handleSave}
      onLeave={() => navigate(detailPath)}
    />
  )
}

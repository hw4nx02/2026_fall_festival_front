import { adminClient as apiClient } from './adminClient'

// 관리자 API가 아닌 서버(예: 사용자 도메인의 공개 API)에 연결됐을 때의 로그인 실패
export class AdminHostMismatchError extends Error {
  constructor() {
    super('관리자 API가 아닌 서버에 연결됐습니다.')
    this.name = 'AdminHostMismatchError'
  }
}

// 관리자 로그인 — 백엔드에 로그인 API가 없으므로 입력한 키(ADMIN_API_TOKEN)를 그대로 토큰으로 쓴다.
// 키로 관리자 API를 한 번 호출해 검증하고, 틀리면 401로 reject된다. 성공 시 키를 반환.
// 관리자 도메인이 아닌 곳에 붙으면 공개 공지 목록이 아무 키에나 200으로 응답하므로,
// 관리자 전용 응답 코드(ADMIN_NOTICE_LIST_SUCCESS)인지까지 확인한다.
export const adminLogin = async (adminKey) => {
  const { data } = await apiClient.get('/api/notices/', {
    params: { size: 1 },
    headers: { Authorization: `Bearer ${adminKey}` },
  })
  if (data?.code !== 'ADMIN_NOTICE_LIST_SUCCESS') throw new AdminHostMismatchError()
  return adminKey
}

// 등불 관리
// 목록 조회 — sort: REPORT_DESC(신고 많은 순, 기본) | LATEST(최신순), page는 0부터, size는 최대 100 (기본 20)
// 응답 data: { items: [{ id, nickname, message, booth_name, report_count, top_report_reason, created_at }],
//              meta: { total_count, page, size, has_next } }  ← 백엔드 실제 응답 기준(노션 명세의 lantern_id/content와 다름)
// top_report_reason은 신고 0건이면 null, 삭제된 등불은 서버에서 제외
export const getAdminLanterns = ({ sort = 'REPORT_DESC', page = 0, size = 20 } = {}) =>
  apiClient.get('/api/lanterns/', { params: { sort, page, size } })

// 신고 상세 조회(확인 모달용) — 목록 항목에 booth_department(부스 소속 학과)가 추가된다
// 응답 data: { id, nickname, message, booth_name, booth_department, report_count, top_report_reason, created_at }
// 없거나 이미 삭제된 등불은 404(code: NOT_FOUND)
export const getAdminLanternDetail = (lanternId) => apiClient.get(`/api/lanterns/${lanternId}/`)

// 삭제(블라인드) — Soft Delete(deleted_by='ADMIN'). 부스별/전체 등불 수는 서버에서 즉시 -1 차감
// 응답 data: {} (빈 객체)
export const deleteAdminLantern = (lanternId) => apiClient.delete(`/api/lanterns/${lanternId}/`)

// 공지 관리
// 목록 조회 — type: ALL(기본) / URGENT / NORMAL, page는 0부터, size는 최대 100 (기본 20)
// 응답 data: { items: [{ id, type, title, content, image_url, created_at, updated_at }], meta: { total_count, page, size, has_next } }
// 정렬은 서버가 처리(긴급 우선 → 일반 최신순), 긴급 공지 제목엔 [M/D]가 붙어서 온다. 이미지 없으면 image_url: null
export const getAdminNotices = ({ type = 'ALL', page = 0, size = 20 } = {}) =>
  apiClient.get('/api/notices/', { params: { type, page, size } })
// 상세 조회 — 수정 화면 초기값 바인딩에도 사용. 없거나 삭제된 공지는 404(NOTICE_NOT_FOUND)
// 응답 data: { id, type, title, content, image_url, created_at, updated_at }
export const getAdminNoticeDetail = (noticeId) =>
  apiClient.get(`/api/notices/${noticeId}/`)
// 이미지 업로드 — multipart(field name: image), JPG/PNG/WebP · 10MB 이하
// 성공 201 → data: { image_url }. 이 URL을 등록 body의 image_url에 담아 보낸다
// 실패 400(INVALID_IMAGE_FILE, errors.image) / 413(FILE_SIZE_EXCEEDED)
export const uploadAdminNoticeImage = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  // Content-Type은 axios가 boundary까지 붙여서 자동 설정하므로 직접 지정하지 않는다
  return apiClient.post('/api/notices/images/', formData)
}

// 등록 — JSON. type(URGENT/NORMAL)·title·content 필수, image_url은 업로드 API로 받은 URL (없으면 null)
// 긴급 공지 제목의 [M/D]는 서버가 붙이므로 제목만 보낸다
export const createAdminNotice = ({ type, title, content, imageUrl = null }) =>
  apiClient.post('/api/notices/', { type, title, content, image_url: imageUrl })
// 수정 — JSON. type(URGENT/NORMAL)·title·content는 필수라 바뀌지 않아도 매번 보낸다
// image_url: 기존 사진 유지 시 기존 URL, 교체 시 업로드 API로 받은 새 URL, 삭제 시 null
// 성공 200 → data: { id, type, title, content, image_url, created_at, updated_at }
export const updateAdminNotice = (noticeId, { type, title, content, imageUrl = null }) =>
  apiClient.put(`/api/notices/${noticeId}/`, { type, title, content, image_url: imageUrl })
// 삭제 — Soft Delete(deleted_at 갱신). 사용자 공지 목록·홈 롤링 바에서도 즉시 빠진다
// 성공 200 → data: {} (빈 객체)
export const deleteAdminNotice = (noticeId) => apiClient.delete(`/api/notices/${noticeId}/`)

// 분실물 관리
// 목록 조회 — found_date 미지정 시 전체, page는 0부터, size는 최대 100 (기본 20)
// 응답 data: { total_count, page, size, has_next, items: [{ lost_item_id, title, found_date, thumbnail_url, tags, created_at }] }
// tags는 작성(sort_order) 순 상위 3개, thumbnail_url은 이미지 없으면 null
export const getAdminLostItems = ({ foundDate, page = 0, size = 20 } = {}) =>
  apiClient.get('/api/lost-items/', { params: { found_date: foundDate, page, size } })

// 상세 조회 — 목록과 달리 tags는 개수 제한 없이 전체, images/tags 모두 객체 배열(sort_order 포함)
// 응답 data: { lost_item_id, title, found_date, images: [{ image_id, image_url, sort_order }],
//              tags: [{ tag_id, keyword, sort_order }], created_at, updated_at }
export const getAdminLostItemDetail = (lostItemId) =>
  apiClient.get(`/api/lost-items/${lostItemId}/`)

// 이미지 업로드 — multipart(field name: file), jpg/jpeg/png/webp · 5MB 이하
// 성공 201 → data: { image_url }. 이 URL을 등록/수정의 image_urls에 담아 보낸다
// (업로드만 하고 저장하지 않으면 고아 파일이 남는 구조 — 서버에서 일괄 정리)
export const uploadAdminLostItemImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  // Content-Type은 axios가 boundary까지 붙여서 자동 설정하므로 직접 지정하지 않는다
  return apiClient.post('/api/lost-items/images/', formData)
}

// 등록/수정 공통 body — tags, image_urls 모두 배열 순서가 sort_order가 되므로 순서를 바꾸지 않는다
const toLostItemBody = ({ title, foundDate, tags, imageUrls }) => ({
  title,
  found_date: foundDate,
  tags,
  ...(imageUrls?.length ? { image_urls: imageUrls } : {}),
})

// 등록 — 필수값은 title / found_date / tags(1개 이상). 성공 201 → data: { lost_item_id }
export const createAdminLostItem = (payload) =>
  apiClient.post('/api/lost-items/', toLostItemBody(payload))

// 수정 — 등록과 동일 스키마. 이미지/태그는 replace-all이라 최종 배열을 그대로 보낸다
// (보내지 않은 항목은 지워지므로 부분 전송하면 안 됨). 성공 200 → data는 상세 조회와 같은 형태
export const updateAdminLostItem = (lostItemId, payload) =>
  apiClient.put(`/api/lost-items/${lostItemId}/`, toLostItemBody(payload))

// 삭제 — Soft Delete. 이미 삭제된 항목도 404로 온다
export const deleteAdminLostItem = (lostItemId) =>
  apiClient.delete(`/api/lost-items/${lostItemId}/`)

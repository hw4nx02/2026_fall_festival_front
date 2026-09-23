// 부스 천막 규격(booth_size) — 2026-09-22 추가.
//
// 원래 부스 천막은 3m × 6m 캐노피 한 종류였는데, 한 천막을 두 부스가 나눠 쓰던 자리에 3m × 3m 작은 천막을
// 하나 더 세워서 부스를 분리하기로 하면서(재원 결정) 천막이 두 종류가 됐다. 부스마다 어느 천막인지는
// GET /api/booths/ 부스 항목의 booth_size 값으로 구분한다(명세: rotation 바로 다음 필드).
//   - "BIG"   : 3m × 6m 캐노피(가젤보) 천막 — 기존 천막. 값이 없을 때의 기본값
//   - "SMALL" : 3m × 3m 파고다(하이피크) 천막 — 새로 추가(scene/zones/PagodaTent.jsx)
//
// 백엔드가 아직 booth_size를 안 내려주거나(undefined), null이거나, 모르는 값이면 전부 "BIG"으로 본다.
// 그래서 필드가 추가되기 전에도 지금 화면이 그대로 유지되고, 값이 들어오는 순간 "SMALL" 부스만 바뀐다.
// 대소문자·앞뒤 공백은 봐준다("small", " Small " → "SMALL").
//
// 이 파일이 천막 치수의 단일 출처다. 3D 천막(BoothMarker의 캐노피, PagodaTent)이 여기 값으로 지오메트리를
// 만들고, 지도 뷰어(festival-map-viewer)도 sync로 이 파일을 그대로 가져가서 겹침 계산·이름표 높이에 쓴다.
//   - width / depth: 천막 크기(m). rotation이 0일 때 width가 x축(통로와 나란한 정면), depth가 z축
//   - eaveOverhang: 지붕(처마)이 천막 크기 밖으로 튀어나오는 길이(m, 한쪽). 겹침 계산의 발자국 크기도 이 값으로 정해진다
//   - poleHeight: 기둥(처마) 높이(m)
//   - roofRise: 처마에서 지붕 꼭대기까지 높이(m)
export const BOOTH_SIZE = Object.freeze({
  BIG: 'BIG',
  SMALL: 'SMALL',
})

export const DEFAULT_BOOTH_SIZE = BOOTH_SIZE.BIG

export const BOOTH_SIZE_SPECS = Object.freeze({
  [BOOTH_SIZE.BIG]: Object.freeze({ width: 6, depth: 3, eaveOverhang: 0.25, poleHeight: 2.3, roofRise: 1 }),
  // 작은 천막은 사진처럼 처마 모서리가 거의 기둥 위에 온다 → 처마를 조금만 뺀다
  [BOOTH_SIZE.SMALL]: Object.freeze({ width: 3, depth: 3, eaveOverhang: 0.1, poleHeight: 2.3, roofRise: 1.5 }),
})

const KNOWN_BOOTH_SIZES = new Set(Object.values(BOOTH_SIZE))

// API 값 → "BIG" | "SMALL". 없거나 모르는 값은 "BIG".
export function normalizeBoothSize(value) {
  const key = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return KNOWN_BOOTH_SIZES.has(key) ? key : DEFAULT_BOOTH_SIZE
}

export function getBoothSizeSpec(value) {
  return BOOTH_SIZE_SPECS[normalizeBoothSize(value)]
}

// 지면에서 지붕 꼭대기까지 높이(m) — 라벨·이름표를 천막 위에 띄울 때 쓴다.
// 피니얼(작은 천막 꼭대기 장식봉)이나 지붕 위 조명처럼 얇은 장식은 포함하지 않는다.
export function getBoothTopHeight(value) {
  const { poleHeight, roofRise } = getBoothSizeSpec(value)
  return poleHeight + roofRise
}

// 지붕(처마 포함)이 바닥에 드리우는 직사각형 크기(m) — 부스끼리 겹치는지 볼 때 쓴다.
// 큰 천막 6.5 × 3.5, 작은 천막 3.2 × 3.2. rotation이 0일 때 width가 x축.
export function getBoothFootprint(value) {
  const { width, depth, eaveOverhang } = getBoothSizeSpec(value)
  return { width: width + eaveOverhang * 2, depth: depth + eaveOverhang * 2 }
}

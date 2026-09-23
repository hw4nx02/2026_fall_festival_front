import BoothMarker from './BoothMarker'
import BoothPin from './BoothPin'
import { BOOTH_PIN_PREVIEW, BOOTH_PIN_PROPS } from './boothPinPreview'

// 구역 부스 목록(API 응답의 booths[]) → BoothMarker 배치.
//
// 2026-09-19: 원래 Zone1Scene 안에 있던 "places.map → <BoothMarker …/>" 블록을 떼어내 공통화한
// 컴포넌트. 팔정도/만해광장/학림관에도 같은 API 부스 데이터를 붙이면서
// 같은 코드가 네 파일에 복사될 상황이라 한 곳으로 모았다.
//
// 2026-09-19(2차): booth 스키마를 세호님 '장소 목록 조회' API(GET /api/booths/) 응답과
// 1:1로 맞췄다. 예전에는 3D 배치 전용으로 별도 coordinates{x,y,z,rotation} 필드를 썼는데,
// 명세에 "map_x/map_y/map_elevation/rotation은 FE 3D 씬 좌표를 무변환으로 반환한다"고
// 확정되면서(map_x=씬 x, map_y=씬 z, map_elevation=씬 y, rotation=y축 회전) 그 필드들이 곧
// 3D 좌표 그 자체가 됐다. 그래서 이제 coordinates 없이 map_x/map_y/map_elevation/rotation을
// 바로 BoothMarker position/rotationY에 꽂는다. 현재 GET /api/booths/의 data.booths를
// 별도 매핑 없이 사용한다.
//
// 2026-09-20: 부스 마커를 3D 핀(BoothPin)으로 교체 — 재원 요청("마커를 3D로, 구글맵 핀 느낌으로").
// 이 컴포넌트가 "부스 한 동 = 천막(BoothMarker) + 마커(BoothPin)"를 같은 좌표에 나란히 놓는
// 자리가 됐다. 둘을 합치지 않고 형제로 둔 이유는 BoothPin.jsx 상단 주석 참고(B안 합의 + 충돌 회피).
// 백엔드 변동은 없다 — 핀이 쓰는 값(map_x/map_y/map_elevation/category/lantern_count/name/booth_id)이
// 전부 이미 GET /api/booths/ 명세에 있는 필드라, 렌더 방식만 바뀌고 데이터 계약은 그대로다.
// 기존 <Html> PinLabel은 3D 핀과 겹치므로 기본값에서는 끈다(BoothMarker의 showLabel=false).
// ?marker=label / ?marker=both 로 되돌려 비교할 수 있다 — boothPinPreview.js 참고.
//
// 2026-09-22: booth_size 연결 — 한 천막을 나눠 쓰던 부스를 3x3 작은 천막으로 분리하기로 하면서(재원 결정)
// 부스마다 천막 규격을 받는다. 값은 그대로 BoothMarker에 넘기고, "BIG"/"SMALL" 정리와 기본값("BIG")은
// BoothMarker 안(constants/boothSizes.js의 normalizeBoothSize)에서 한다 — 백엔드가 필드를 추가하기 전에는
// undefined가 넘어가서 전부 기존 3x6 천막으로 그려진다. 핀(BoothPin) 높이는 작은 천막 꼭대기(피니얼 포함 약 4.1m)보다
// 이미 충분히 높아서(5.5m) 크기와 상관없이 그대로 둔다.
//
// booth 스키마(GET /api/booths/ 명세):
//   - booth_id: BoothMarker key + onBoothClick(boothId)에 넘기는 값
//   - map_x / map_y / map_elevation / rotation: Three.js 씬 좌표(m) — map_x=씬 x, map_y=씬 z,
//     map_elevation=씬 y(높이), rotation은 도 단위 Y축 회전
//   - name / category / lantern_count — 라벨(PinLabel), 카테고리 색, 등불 개수(밝기 단계 자동 계산)
//   - booth_size — 천막 규격 "BIG"(3x6, 기본) | "SMALL"(3x3). 명세상 rotation 바로 다음 필드, 없으면 "BIG"
//
// props:
//   - booths: 부스 배열(없으면 아무것도 안 그림)
//   - brightnessLevel: (선택) 밝기 단계 override — null이면 BoothMarker가 lantern_count로 자동 계산
//     (BoothMarker.jsx 19번 항목). MapProvider.boothBrightnessPreview가 MapCanvas → 씬 → 여기로 내려온다.
//   - onBoothClick(boothId): 부스 클릭 콜백(MapShell이 바텀시트 열기로 연결)
export default function ZoneBooths({ booths = [], brightnessLevel = null, onBoothClick }) {
  const { showPin, showLabel } = BOOTH_PIN_PREVIEW

  return booths.map((booth, index) => {
    // map_x/map_y/map_elevation은 백엔드 컬럼이 nullable이라 좌표 미입력 부스는 null로 내려온다.
    // 그대로 두면 전부 원점(0,0,0)에 겹쳐 그려지므로 3D 씬에서는 건너뛴다(카드 목록 등 2D 리스트는 그대로 노출).
    if (booth.map_x == null || booth.map_y == null || booth.map_elevation == null) {
      return null
    }

    const position = [booth.map_x, booth.map_elevation, booth.map_y]
    const handleClick = () => onBoothClick?.(booth.booth_id)

    return (
      <group key={booth.booth_id}>
        <BoothMarker
          position={position}
          rotationY={(booth.rotation * Math.PI) / 180}
          size={booth.booth_size}
          label={booth.name}
          showLabel={showLabel}
          category={booth.category}
          lanternCount={booth.lantern_count}
          brightnessLevel={brightnessLevel}
          onClick={handleClick}
        />
        {showPin ? (
          <BoothPin
            position={position}
            category={booth.category}
            count={Number(booth.lantern_count) || 0}
            // 부스마다 다른 위상을 줘야 핀들이 한 몸처럼 같이 출렁이지 않고 따로 논다
            bobPhase={index * 0.7}
            onClick={handleClick}
            {...BOOTH_PIN_PROPS}
          />
        ) : null}
      </group>
    )
  })
}

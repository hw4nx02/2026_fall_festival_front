import * as THREE from 'three'
import { BOOTH_SIZE, BOOTH_SIZE_SPECS } from '../../../../constants/boothSizes'

// 작은 부스 천막(booth_size "SMALL", 3m × 3m 파고다/하이피크 텐트) — 2026-09-22 추가.
//
// 왜 생겼나: 한 천막(3×6)을 두 부스가 나눠 쓰던 자리를, 3×3 작은 천막을 하나 더 세워서 분리하기로 했다(재원 결정).
// 부스 데이터의 booth_size가 "SMALL"이면 BoothMarker가 기존 캐노피 대신 이 천막을 그린다(BoothMarker.jsx 21번 항목).
//
// 디자인 기준: 재원이 공유한 흰색 파고다 텐트 제품 사진.
//   - 정사각형 바닥에 모서리 기둥 4개(받침판 포함)
//   - 네 변에서 꼭대기 한 점으로 모이는 지붕인데, 면이 평평한 피라미드가 아니라 안쪽으로 오목하게 휘어서
//     처마 쪽은 완만하게 퍼지고 꼭대기로 갈수록 가파르게 솟는다 — 이 곡선이 파고다 텐트의 특징이라
//     커스텀 BufferGeometry로 직접 만들었다(createRoofGeometry).
//   - 꼭대기에 가는 장식봉(피니얼), 처마 둘레에 짧은 천(발). 발 아랫단은 기둥 쪽이 깊고 가운데가 얕은 아치.
//   - 색은 사진대로 흰 천 + 흰 도장 프레임(재원 선택). 큰 천막(파랑)과 지도에서 한눈에 구분된다.
//
// 큰 천막과 다른 점 — 조명 장식이 없다(재원 선택: "사진처럼 조명 없이").
//   기둥 랜턴(PoleLantern)·처마/기둥 조명끈(TentLightOutline)·지붕 위 조명(CanopyRidgeLights)을 달지 않는다.
//   등불 단계(lantern_count)는 BoothMarker가 두 천막에 공통으로 까는 바닥 글로우(GroundGlow)로만 보인다.
//   나중에 조명을 달고 싶어지면 BoothMarker.jsx의 CanopyTent가 쓰는 컴포넌트를 그대로 가져다 붙이면 된다
//   (TentLightOutline은 poleOffsets/poleInset만 넘기면 정사각형 천막에도 그대로 동작한다).
//
// 치수: 크기·처마 돌출·기둥 높이·지붕 높이는 constants/boothSizes.js 규격표(BOOTH_SIZE_SPECS.SMALL)가 단일 출처다
// (지도 뷰어의 겹침 계산도 같은 값을 쓴다). 여기 있는 상수는 사진 느낌을 내기 위한 모양 값(곡률, 발 깊이 등)뿐이다.
//
// 성능: 지붕·발 지오메트리는 모든 작은 천막이 똑같으므로 모듈 레벨에서 한 번만 만들어 공유한다
// (BoothPin.jsx의 핀 지오메트리 캐시와 같은 방식). 부스가 수십 개여도 지오메트리는 2개뿐이다.
//
// props:
//   - color: 천(지붕+발) 색. 기본값은 사진 기준 흰색 — 순백(#fff)은 낮 조명에서 하얗게 날아가 면이 안 읽혀서 톤을 살짝 죽였다.

// eaveOverhang: 사진처럼 처마 모서리가 거의 기둥 위에 오도록 조금만 뺀 값(0.1, 큰 천막은 0.25)
const { width, depth, eaveOverhang, poleHeight, roofRise } = BOOTH_SIZE_SPECS[BOOTH_SIZE.SMALL]

const CANOPY_COLOR = '#f2f2ee'
const FRAME_COLOR = '#e1e4e8' // 흰 도장 알루미늄 기둥
const FOOT_COLOR = '#8f969d' // 기둥 받침판(금속)

const POLE_INSET = 0.05 // 기둥은 천막 모서리에 거의 붙어 있다(사진 기준)
const POLE_RADIUS = 0.045

// 지붕 곡면 — 처마(t=0)에서 꼭대기(t=1)까지 높이를 roofRise × (FLARE·t + (1−FLARE)·t²)로 올린다.
// FLARE가 1이면 평평한 피라미드, 작을수록 처마 쪽이 완만하게 퍼지고 꼭대기 쪽이 뾰족해진다.
// 0.3에서 처마 경사 약 16°, 꼭대기 경사 약 58° — 사진 속 실루엣과 가장 비슷했다(헤드리스 렌더로 비교).
const ROOF_FLARE = 0.3
const ROOF_ROWS = 18 // 처마→꼭대기 분할 수(곡면이 각져 보이지 않을 만큼)
const ROOF_COLUMNS = 8 // 처마 한 변 분할 수

const VALANCE_DEPTH_CORNER = 0.3 // 발 깊이 — 기둥(모서리) 쪽
const VALANCE_DEPTH_MIDDLE = 0.16 // 발 깊이 — 변 가운데(아치 꼭대기)
const VALANCE_COLUMNS = 16

const FINIAL_HEIGHT = 0.32 // 꼭대기 장식봉

const HALF_EAVE_X = width / 2 + eaveOverhang
const HALF_EAVE_Z = depth / 2 + eaveOverhang
const POLE_X = width / 2 - POLE_INSET
const POLE_Z = depth / 2 - POLE_INSET

// 처마 네 모서리 — 이 순서(위에서 볼 때 한 방향으로 도는 순서)로 이웃한 두 모서리를 이어 면 하나씩 만든다.
// 정점 감기 방향(아래 indices)이 이 순서를 기준으로 맞춰져 있어서, 순서를 바꾸면 면이 뒤집힌다.
const EAVE_CORNERS = [
  [-HALF_EAVE_X, -HALF_EAVE_Z],
  [HALF_EAVE_X, -HALF_EAVE_Z],
  [HALF_EAVE_X, HALF_EAVE_Z],
  [-HALF_EAVE_X, HALF_EAVE_Z],
]

const POLE_OFFSETS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
]

function roofHeightAt(t) {
  return roofRise * (ROOF_FLARE * t + (1 - ROOF_FLARE) * t * t)
}

// roofHeightAt의 t에 대한 기울기 — 노멀 계산용
function roofSlopeAt(t) {
  return roofRise * (ROOF_FLARE + 2 * (1 - ROOF_FLARE) * t)
}

// 오목한 4면 지붕. 면마다 (처마 변 위치 s, 꼭대기 쪽 진행도 t) 격자를 만들고, t가 커질수록 가로 좌표를
// 꼭대기(중심) 쪽으로 (1 − t)배 줄이면서 높이는 roofHeightAt(t)로 올린다.
// 정점은 면 안에서만 공유하고 면끼리는 따로 둔다 → 면 안은 천처럼 부드럽게, 모서리(힙 라인)는 또렷한 솔기로 보인다.
//
// 노멀은 computeVertexNormals 대신 곡면 식에서 바로 구한다. 이 격자는 꼭대기로 갈수록 삼각형이 가늘어지고
// 맨 윗줄은 한 점으로 모여서, 삼각형 평균 노멀은 꼭대기 근처에서 방향이 들쭉날쭉해진다. 곡면
// P(s, t) = ((1 − t)·L(s), f(t)) (L = 처마 변 위의 점, E = 변 방향)의 두 접선 ∂P/∂t × ∂P/∂s에서 공통 인수 (1 − t)를
// 뺀 n = (f'·Ez, Lx·Ez − Lz·Ex, −f'·Ex)를 쓰면 꼭대기(t = 1)에서도 0이 되지 않고, 면 안 음영이 매끈하게 이어진다.
function createRoofGeometry() {
  const positions = []
  const normals = []
  const indices = []
  const rowSize = ROOF_COLUMNS + 1
  const normal = new THREE.Vector3()

  EAVE_CORNERS.forEach((start, faceIndex) => {
    const end = EAVE_CORNERS[(faceIndex + 1) % EAVE_CORNERS.length]
    const edgeX = end[0] - start[0]
    const edgeZ = end[1] - start[1]
    const base = positions.length / 3

    for (let row = 0; row <= ROOF_ROWS; row += 1) {
      const t = row / ROOF_ROWS
      const shrink = 1 - t
      const y = roofHeightAt(t)
      const slope = roofSlopeAt(t)
      for (let col = 0; col <= ROOF_COLUMNS; col += 1) {
        const s = col / ROOF_COLUMNS
        const edgePointX = start[0] + edgeX * s
        const edgePointZ = start[1] + edgeZ * s
        positions.push(edgePointX * shrink, y, edgePointZ * shrink)
        normal
          .set(slope * edgeZ, edgePointX * edgeZ - edgePointZ * edgeX, -slope * edgeX)
          .normalize()
        normals.push(normal.x, normal.y, normal.z)
      }
    }

    for (let row = 0; row < ROOF_ROWS; row += 1) {
      for (let col = 0; col < ROOF_COLUMNS; col += 1) {
        const a = base + row * rowSize + col
        const b = a + 1
        const c = a + rowSize
        const d = c + 1
        // 바깥+위를 향하는 쪽이 앞면이 되는 감기 방향(위 노멀과 같은 방향). 꼭대기 줄은 c/d가 한 점으로 모여
        // 면적 0인 삼각형이 생기는데, 화면에 아무것도 그리지 않으므로 그대로 둔다.
        indices.push(a, c, b, b, c, d)
      }
    }
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setIndex(indices)
  return geometry
}

// 처마 둘레 발 — 네 변을 한 지오메트리로. 윗단은 처마선(y=0), 아랫단은 모서리가 깊고 가운데가 얕은 포물선 아치.
function createValanceGeometry() {
  const positions = []
  const indices = []

  EAVE_CORNERS.forEach((start, sideIndex) => {
    const end = EAVE_CORNERS[(sideIndex + 1) % EAVE_CORNERS.length]
    const base = positions.length / 3
    for (let col = 0; col <= VALANCE_COLUMNS; col += 1) {
      const s = col / VALANCE_COLUMNS
      const x = start[0] + (end[0] - start[0]) * s
      const z = start[1] + (end[1] - start[1]) * s
      const arch = (2 * s - 1) ** 2 // 모서리 1 → 가운데 0
      const hang = VALANCE_DEPTH_MIDDLE + (VALANCE_DEPTH_CORNER - VALANCE_DEPTH_MIDDLE) * arch
      positions.push(x, 0, z, x, -hang, z)
    }
    for (let col = 0; col < VALANCE_COLUMNS; col += 1) {
      const top = base + col * 2
      indices.push(top, top + 1, top + 2, top + 2, top + 1, top + 3)
    }
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

// 모든 작은 천막이 공유하는 지오메트리(맨 위 "성능" 메모). 처음 그릴 때 한 번만 만든다.
let sharedRoofGeometry = null
let sharedValanceGeometry = null
function getRoofGeometry() {
  if (!sharedRoofGeometry) sharedRoofGeometry = createRoofGeometry()
  return sharedRoofGeometry
}
function getValanceGeometry() {
  if (!sharedValanceGeometry) sharedValanceGeometry = createValanceGeometry()
  return sharedValanceGeometry
}

export default function PagodaTent({ color = CANOPY_COLOR }) {
  return (
    <group>
      {/* 기둥 4개 + 받침판 — 흰 도장 알루미늄 */}
      {POLE_OFFSETS.map(([signX, signZ]) => (
        <group key={`${signX}${signZ}`} position={[signX * POLE_X, 0, signZ * POLE_Z]}>
          <mesh position={[0, poleHeight / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[POLE_RADIUS, POLE_RADIUS, poleHeight, 8]} />
            <meshStandardMaterial color={FRAME_COLOR} metalness={0.35} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.01, 0]} receiveShadow>
            <boxGeometry args={[0.2, 0.02, 0.2]} />
            <meshStandardMaterial color={FOOT_COLOR} metalness={0.4} roughness={0.6} />
          </mesh>
        </group>
      ))}

      <group position={[0, poleHeight, 0]}>
        {/* 오목한 파고다 지붕 — 아래(천막 안)에서 올려다봐도 천이 보이도록 양면.
            receiveShadow는 일부러 끈다: 양면 재질은 그림자 맵에 앞·뒷면이 다 그려져서, 그림자를 받는 쪽으로 켜 두면
            지붕 위에 사선 줄무늬(shadow acne)가 생겼다(헤드리스 렌더로 확인). 지붕은 천막에서 가장 높은 면이라
            받을 그림자도 없으니 바닥에 그림자를 드리우는 castShadow만 남긴다. 발도 같은 이유. */}
        <mesh geometry={getRoofGeometry()} castShadow>
          <meshStandardMaterial color={color} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>

        {/* 처마 둘레 발(아치형 아랫단) */}
        <mesh geometry={getValanceGeometry()} castShadow>
          <meshStandardMaterial color={color} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>

        {/* 꼭대기 — 곡면이 한 점으로 모이는 자리를 작은 캡으로 덮고, 그 위에 가는 장식봉(피니얼) */}
        <mesh position={[0, roofRise + 0.03, 0]} castShadow>
          <coneGeometry args={[0.07, 0.14, 12]} />
          <meshStandardMaterial color={FRAME_COLOR} metalness={0.35} roughness={0.45} />
        </mesh>
        <mesh position={[0, roofRise + FINIAL_HEIGHT / 2, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.014, FINIAL_HEIGHT, 6]} />
          <meshStandardMaterial color={FRAME_COLOR} metalness={0.35} roughness={0.45} />
        </mesh>
      </group>
    </group>
  )
}

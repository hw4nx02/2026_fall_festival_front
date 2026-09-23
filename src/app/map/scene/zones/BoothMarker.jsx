import { useEffect, useMemo, useRef } from 'react'
import { Html } from '@react-three/drei'
import { Select } from '@react-three/postprocessing'
import * as THREE from 'three'
import PinLabel from '../../components/PinLabel/PinLabel'
import { useTimeOfDay } from '../environment/TimeOfDayContext'
import PagodaTent from './PagodaTent'
import { MAX_LANTERN_TIER, getLanternTier } from '../../../../constants/lanternTiers'
import { BOOTH_SIZE, BOOTH_SIZE_SPECS, getBoothTopHeight, normalizeBoothSize } from '../../../../constants/boothSizes'

// 재사용 가능한 부스(천막) 오브젝트 — 실제 부스 3D 템플릿(.glb)이 아직 없어서
// 좌표 소환 테스트 겸 시각적 데모용으로 만든 캐노피(가젤보) 천막 메시.
// 실제 캐노피 천막 표준 규격(3m x 6m)에 맞춘 다리 6개 + 경사 지붕 2면 + 처마 발(valance) 구성.
// 2026-09-22부터는 booth_size가 "SMALL"인 부스에 3m x 3m 파고다 천막(PagodaTent.jsx)을 대신 그린다(21번 항목).
//
// 2026-09-13 수정:
//   1) 배치 방향 버그 수정 — 이전 버전은 짧은 변(3m)이 통로 진행 방향(Three.js X축)과
//      나란해서 부스가 통로 위에서 "세로"로 서 보이는 문제가 있었음. 실제 캐노피 천막은
//      긴 변(6m)이 통로와 나란한 정면이 되도록 놓이므로 width(6, X축)/depth(3, Z축)로 스왑함.
//      → API의 rotation이 0이어도 기본 방향이 올바르게 보인다.
//   2) 디자인 리뉴얼 — 재원이 공유한 실제 캐노피 천막(3M x 6M, 파란색 폴딩 가젤보) 사진을 참고해
//      다리 배치(긴 변마다 3개씩 총 6개)와 색상(파란 캐노피 + 은색 프레임), 처마 아래로 늘어지는
//      천(valance)을 추가해 실제 천막과 비슷하게 리디자인함.
//   3) 등불 장식 추가 — 재원이 공유한 사각 금속 프레임 랜턴 사진을 참고해, 기둥 6곳마다
//      작은 랜턴을 하나씩 달았다. 실제 "등불 밝히기" 기능(사용자가 남기는 등불)과는 무관한
//      순수 장식 요소 — 유리 패널을 emissive(자체발광)로 처리해서, 밤에 조명이 어두워져도
//      광원 자체는 항상 은은하게 빛나 보이게 했다(과제 요구사항: "크지 않게, 광원은 보이도록").
//   4) 부스별 밝기 단계(brightnessLevel) 추가 — final-plan-team-share.md 2-3절 "등불 밝히기"
//      기획의 "개별 부스 — 천막 밝기/장식 단계 조절" 표를 반영. 등불 개수 구간에 따라 단계가
//      나뉘는데(당시 0/1/5/10/50개 → 0~4단계, 현재 구간은 18번 항목 참고), 아직 백엔드가
//      lantern_count를 내려주지 않아서(부스 데이터 미확정) 지금은 MapProvider의 임시
//      boothBrightnessPreview 상태로 brightnessLevel을 수동으로 넘겨서 시안만 확인하는 단계다.
//      나중에 실제 등불 개수가 연동되면 constants/lanternTiers.js의 getLanternTier(lanternCount)
//      (순수 함수)로 계산한 값을 여기 넘기기만 하면 되고, 이 컴포넌트(그리는 로직)는 손댈 필요
//      없다 — timeOfDay와 동일한 원칙.
//      지붕뿐 아니라 처마 밑 천(valance)에도 같은 emissive를 줘서 천막 전체가 같이
//      밝아지도록 했다(재원 피드백 반영 — 처음엔 지붕에만 적용해서 어색했음).
//   5) 빛 확산(블룸) 효과 추가 — 재원 피드백("색상만 밝아지는 게 아니라 빛이 번지는
//      효과가 있으면 좋겠다")을 반영해, 랜턴 유리 패널과 지붕/처마 띠(밝기 단계>0일 때)에
//      @react-three/postprocessing의 <Select enabled>를 씌웠다. 이 표시를 MapCanvas.jsx의
//      <EffectComposer><SelectiveBloom/></EffectComposer>가 감지해서, 딱 이 부분들만
//      빛이 부드럽게 번지는(블러) 효과를 적용한다 — 씬 전체에 블룸을 걸면 낮 시간대 흰
//      배경/지붕까지 같이 번져서 지저분해지므로, 반드시 "선택적" 블룸으로 처리해야 한다.
//   6) 바닥 글로우 링 추가 — 재원 요청("밝기/블룸 말고 부스를 부각시킬 다른 방법 없나?").
//      근본 원인: 기본 지도 카메라가 아주 높은 곳(y=140)에서 내려다보는 구도라, 부스가
//      화면상 몇 픽셀밖에 안 돼서 지붕 색/블룸 효과 자체가 잘 안 보임. 그래서 카메라 거리와
//      무관하게 "여기 부스가 있다"는 걸 알려주는 별도 마커를 바닥에 깔았다 — 부스 발밑에
//      반투명한 원형 글로우(GroundGlow)를 깔아서 위에서 내려다봐도 확실히 눈에 띄게 함.
//      부스 실제 풋프린트(6m x 3m)보다 여유 있게 큰 반지름으로 잡아서 먼 거리에서도 잘
//      보이도록 했다. 처음엔 카테고리 구분용 색(color prop)을 그대로 썼는데, 재원이
//      "빛 색상을 노란 계열로" 요청해서 랜턴과 같은 따뜻한 노란빛(GROUND_GLOW_COLOR)으로
//      통일함 — "등불빛이 바닥에 은은하게 비친다"는 느낌. <Select enabled>로 감싸서 다른
//      발광 요소들처럼 은은하게 번지는 느낌도 같이 준다.
//   7) 바닥 글로우도 밝기 단계에 연동 — 재원 요청("등불 개수에 연동, 일단 버튼으로
//      미리보기"). 처음엔 "위치 식별용이라 인기도(brightnessLevel)와 역할이 다르다"고
//      항상 고정값으로 뒀었는데, 재원이 오히려 인기 부스가 더 확실히 부각되길 원해서
//      opacity(밝기)와 radius(반경)를 둘 다 brightnessLevel에 비례해서 커지도록 바꿈
//      (0단계에서도 완전히 안 보이진 않게 최소값은 유지). 지금은 다른 밝기 효과들과
//      마찬가지로 MapProvider의 임시 boothBrightnessPreview 값으로 확인 가능.
//   8) 지붕 조명끈(RoofLightStrings) 추가 — 재원이 공유한 참고 사진(밤에 텐트 지붕의
//      각진 라인을 따라 전구 조명이 쭉 이어진 캠핑/웨딩 텐트 사진)을 보고 요청한 장식 요소.
//      지붕의 "각진 부분" = 용마루(능선)와, 용마루 양 끝에서 앞/뒤 처마 모서리로 뻗는
//      대각선(지붕 경사면의 모서리) 총 5개 라인으로 해석해서, 각 라인을 따라 일정 간격으로
//      작은 자체발광 구슬(전구)을 나열했다. PoleLantern과 마찬가지로 "밝기 단계(brightnessLevel)"
//      와는 무관하게 항상 켜져 있는 고정 장식 요소로 처리함 — 참고 사진 속 조명끈도 인기도와
//      상관없이 늘 켜져 있는 상시 장식이고, 이미 PoleLantern이 같은 방식(고정 emissive, 밝기
//      단계와 무관)이라 일관성 있게 맞췄다. <Select enabled>로 감싸서 다른 발광 요소들처럼
//      SelectiveBloom 빛 번짐 효과도 같이 받는다.
//   9) 천막 자체(지붕/처마) 밝기 효과 제거 — 재원 요청("천막 자체가 밝아지는 기능은 없애고
//      하단 글로우만 밝아지도록"). 4)/5)에서 넣었던 지붕·처마(valance) emissive(BOOTH_GLOW_COLOR)와
//      그 위에 씌웠던 <Select>(블룸)를 전부 제거해서, 지붕/처마는 이제 밝기 단계와 무관하게
//      항상 원래 카테고리 색(color prop)만 보여준다. 밝기 단계(brightnessLevel) 표현은
//      바닥 글로우(GroundGlow, 7번 항목)만으로 담당하도록 역할을 단순화했다 — 랜턴/조명끈
//      (항상 고정 장식) vs 바닥 글로우(밝기 단계에 반응) 두 갈래로 정리된 셈.
//  10) 조명끈을 천막 전체 윤곽으로 확장(RoofLightStrings → TentLightOutline) — 재원이
//      "천막 자체가 밋밋하다", "부스 하나하나에 집중하고 싶은데 깃발보다는 빛 효과로
//      부각시키고 싶다"고 피드백. 깃발 등 새 장식 요소를 추가하는 대신, 8번에서 만든
//      "조명끈" 기법을 천막 전체로 확장하는 방향으로 풀었다. 기존 지붕 각진 라인(용마루+
//      대각선 4개)에 더해 처마 둘레 사각 테두리(4변)와 기둥 6개 세로 조명끈을 추가해서,
//      천막이 빛으로 윤곽 전체가 감싸인 느낌을 내도록 함(기둥 조명끈은 랜턴과 안 겹치게
//      랜턴 아래에서 멈춤). 여전히 밝기 단계와 무관한 고정 장식.
//  11) 광원(랜턴+조명끈) 밝기를 극단적으로 상향 — 재원 요청("부스 광원의 정도를 극단적으로
//      올려줄 수 있어?"). PoleLantern 유리 패널과 TentLightOutline 전구의 emissiveIntensity를
//      1.3~1.4 → 5(LANTERN_GLOW_INTENSITY 상수)로 대폭 올림. MapCanvas.jsx의 SelectiveBloom도
//      같이 강화(intensity/radius 상향, threshold 소폭 하향)해서 실제 화면에서 훨씬 크고
//      강렬한 빛 번짐이 나오도록 함(자세한 값은 MapCanvas.jsx 주석 참고). 9번 항목에서
//      지붕/처마 emissive를 이미 걷어냈기 때문에, 광원을 아무리 세게 키워도 천막 색상이
//      하얗게 날아가는 부작용이 없다 — 광원 강화가 안전해진 배경.
//  14) 지붕을 진짜 히프(모임)지붕으로 재구성 — 재원이 실제 캐노피 천막(3M x 6M, 파란 폴딩
//      가젤보) 사진을 다시 공유하며 "이 디자인으로 다시 만들고 싶다"고 요청. 색상(카테고리색)은
//      그대로 두고("천막 색상까지 바꾸고 싶단 얘기는 아니야") 형태만 사진에 맞춰 올렸다.
//      기존 지붕은 boxGeometry 2장을 Z축으로만 접은 맞배(게이블)지붕이라, 긴 변(X축) 양 끝이
//      막혀 있지 않고 그냥 뻥 뚫린 삼각기둥 실루엣이었다 — 실제 사진 속 캐노피는 네 면이 전부
//      용마루로 접히는 히프(hip)지붕이라 실루엣이 달랐다. 커스텀 BufferGeometry(useHipRoofGeometry,
//      HipRoof 컴포넌트)로 짧아진 용마루(ridgeRun, 상수 roofHipInset만큼 양 끝을 접어 넣음) +
//      네 모서리 처마로 떨어지는 삼각/사다리꼴 6장을 직접 만들어서, 실제 캐노피처럼 앞뒤(용마루
//      방향 양 끝)도 경사지도록 했다. 정점을 삼각형마다 따로 둬서(정점 공유 없음) 면 경계가
//      또렷하게 각지도록(flat shading) 했다 — 기존 박스 지붕 패널과 같은 마감이라 이질감 없음.
//      용마루 포인트 컬러 바(accentColor)도 짧아진 용마루 길이(ridgeRun)에 맞춰 줄였다.
//  15) 캐노피 위 조명(현재 이름 CanopyRidgeLights, 처음 이름은 CanopyLightSwags) 추가 —
//      재원이 참고 사진(밤에 텐트 위로 조명이 걸쳐진 사진, 텐트 자체엔 천 색상 변화 없음)을
//      보고 요청한 "조명 설치"(재원 표현 그대로 "그 위에... 조명을 설치"). 기존
//      TentLightOutline은 지붕/처마/기둥의 "윤곽선"을 따라 팽팽하게 붙어 있는 조명끈이라
//      결이 달라서 별도 컴포넌트로 분리했다. 최종 형태에 이르기까지 몇 차례 다시 만들었다 —
//      16/17번 항목 참고. 색/기본 강도(TENT_LIGHT_STRING_INTENSITY)는 기존 조명끈과
//      통일해서 한 세트처럼 보이게 함. 추가로 재원 요청("등불 단계에 따라 조명의 밝기가
//      증가되는 것도 유지하자")에 맞춰, TentLightOutline+CanopyRidgeLights 둘 다 이제
//      brightnessLevel에 살짝 반응하도록 바꿨다(getTentLightIntensityScale) — 정확히는
//      "유지"가 아니라 이번에 새로 추가한 동작인데(예전엔 둘 다 밝기 단계와 무관한 고정
//      장식이었음, 8/10번 항목 참고), 재원이 원하는 결과가 그거라 판단해서 반영함. 0단계에서도
//      "설치된 조명"이 완전히 꺼져 보이면 어색하니 최소 밝기는 유지하고 단계가 올라갈수록
//      밝아진다(당시엔 50%→100% 선형, 현재 값은 18번 항목/BRIGHTNESS_TIERS.lightScale 참고)
//      — 바닥 글로우(GroundGlow)는 기존과 동일하게 연동 유지(원래도 연동돼 있었음).
//  16) 14/15번 항목을 헤드리스 렌더로 미리보기해서 보여준 뒤 재원 피드백 2건 반영.
//      (a) "천막이 너무 납작해보여" — roofRise(처마 대비 용마루 높이)를 0.55→1로 올림
//      (경사각 약 17°→30°). 히프지붕/조명끈 좌표가 전부 roofRise 하나로 계산되는 구조라
//      이 상수만 바꿔도 지붕·조명끈이 다같이 따라 올라감(다른 코드 수정 불필요).
//      (b) "조명 배치/크기를 줄이면 좋겠다, 너무 난잡해" — TentLightOutline에 있던 용마루+hip
//      대각선 조명 세그먼트 5개를 제거(캐노피 위 조명과 같은 역할이 겹쳐서 처마 모서리마다
//      전구가 뭉쳐 보였음). 이제 TentLightOutline은 처마 둘레+기둥만 담당하고, 지붕 위
//      대각선/능선 조명은 캐노피 위 조명 컴포넌트가 전담하는 것으로 역할을 정리. 추가로
//      TentLightOutline bulbSize 0.07→0.05로, 당시 CanopyLightSwags(대각선 X자 교차 방식)도
//      bulbsPerMeter 1→0.6·bulbSize 0.06→0.045로 낮춰서 전체적으로 밀도/크기를 줄였다.
//      광원 강도(TENT_LIGHT_STRING_INTENSITY)와 블룸 설정은 안 건드림 — 이번 요청은
//      "크기/배치"였지 "밝기"가 아니었기 때문.
//  17) v2 스크린샷 확인 후 재원이 "상단 면 비스듬한 경사면에 떠있는 조명 네개만 없앨 수
//      있나" 요청 — 당시 CanopyLightSwags(대각선 X자 교차) 구조에서 능선(t=0.5) 바로 근처
//      전구 4개(대각선 2개 × 2개씩)가 지붕 중앙에 옹기종기 몰려 붕 떠 보이는 부분이라
//      판단, crestGap으로 그 4개를 잘라내는 1차 수정을 했었다. 그런데 재원이 다시 확인하고
//      "그 4개 말고, 그 아래에 4개(처마 쪽에 걸쳐있던 대각선 나머지 절반)를 없애고 싶었다,
//      남는 조명은 중앙 모서리(용마루) 기준으로 일렬로 배치해달라"고 정정 — 즉 "대각선이
//      X자로 교차하는 구조" 자체가 애초에 원하는 그림이 아니었던 것. 그래서 대각선 방식을
//      아예 버리고 컴포넌트를 새로 짰다(CanopyLightSwags → CanopyRidgeLights로 개명) —
//      지금은 용마루를 따라 나란히 늘어선 조명 4개가 전부인 훨씬 단순한 구조. 대각선/처짐
//      계산이 사라져서 코드도 짧아졌다. 자세한 최종 설계는 컴포넌트 자체 주석 참고.
//  18) 2026-09-18: 밝기 단계 6단계(0~5)로 확장 + 단계별 차이 강화 — 팀(3D/기획) 제안으로 등불 개수
//      구간을 0/1/5/10/50개(0~4단계) → 0/1/10/30/50/100개(0~5단계)로 바꾸고, "밝기 차이를 좀 더
//      드라마틱하게" 요청을 함께 반영했다.
//      (a) 구간 정의는 constants/lanternTiers.js(LANTERN_TIERS/getLanternTier/MAX_LANTERN_TIER)가
//          단일 출처. 이 파일은 단계 번호만 받아 그리므로, 구간 숫자를 다시 바꿔도 여기선 표의
//          줄 수(BRIGHTNESS_TIERS.length === MAX_LANTERN_TIER + 1)만 맞추면 된다.
//      (b) 단계별 값을 수식(0.35 + g*0.5 같은 선형 보간)에서 BRIGHTNESS_TIERS 표(글로우 opacity/
//          radius/intensity + 조명끈 lightScale)로 바꿨다 — 디자이너/기획이 "3단계만 조금 더 밝게"처럼
//          특정 단계만 손보기 쉽고, 리뷰할 때 숫자가 한눈에 보인다.
//      (c) 예전에 차이가 안 느껴졌던 원인: 바닥 글로우가 opacity 0.35→0.85, 반경 4.5→5.5로 밖에 안
//          변했고 조명끈도 50%→100%라 폭이 좁았다. 이번엔 글로우 셰이더에 uIntensity(HDR 색 배율,
//          1.0→1.55)를 추가해 단계가 오를수록 "더 진해지는" 게 아니라 "더 세게 빛나며 번지는" 방향으로
//          바꿨고, 조명끈은 12%→150%로 폭을 넓혔다. 반경은 옆 부스와 겹치는 문제 때문에 7.5까지만.
//          값 자체는 실제 MapCanvas 카메라 거리(y=140)에서 부스 6개를 한 줄로 놓고 헤드리스 렌더로
//          비교해서 골랐다 — uIntensity를 2.4까지 올린 첫 후보는 5단계가 하얀 원판으로 날아가 노란 톤이
//          사라졌고(1.9쯤부터 허옇게 됨), 1.55에서 멈춰야 최대 단계도 "따뜻한 노란빛"으로 남는다.
//      (d) 지붕/처마(천막 자체) 밝기 효과는 여전히 넣지 않는다(9번 항목, 재원 요청) — 드라마틱하게
//          만드는 수단은 바닥 글로우 + 조명끈 두 가지로 한정.
//  19) 2026-09-19: 밝기 단계를 부스별 등불 개수(lanternCount)로 자동 계산 — 재원 요청("맵마다 부스
//      목데이터 추가, 팔정도는 가장 높은 단계 위주")을 받으면서, 그동안 MapProvider의 임시 미리보기 값
//      (boothBrightnessPreview, 전체 부스 동일)만 받던 brightnessLevel을 "명시하지 않으면(null/undefined)
//      lanternCount → getLanternTier()로 스스로 계산"하도록 바꿨다. 이미 PinLabel용으로 lanternCount를
//      받고 있었으니 props 추가 없이 그 값을 같이 쓴다. brightnessLevel은 개발용 override로 남겨둠 —
//      숫자를 주면 등불 개수와 무관하게 그 단계로 강제(전 부스 같은 단계로 놓고 비교할 때 유용).
//      "정하는 로직"(lanternTiers.js) / "그리는 로직"(BRIGHTNESS_TIERS) 분리는 그대로 — 이 파일은
//      getLanternTier()를 호출만 할 뿐 구간 숫자는 여전히 모른다.
//  20) 2026-09-19(2차): 낮 시간대 바닥 글로우 게이팅 — 19번으로 부스마다 진짜 단계가 들어오자, 낮(timeOfDay
//      'day') 화면에서도 4~5단계 글로우가 그대로 번져서 팔정도처럼 5단계가 몰린 구역은 광장 가운데가 하얀
//      구름처럼 덮였다(헤드리스 렌더로 확인). 원래 기획(final-plan-team-share.md 2-3)도 "밤엔 밝기, 낮엔
//      채도·장식"이라 낮에 빛이 번지는 건 의도가 아니다. 그래서 environment/TimeOfDayContext로 시간대를 받아
//      낮에는 바닥 글로우를 0단계 값(위치 식별용 최소 원판, 6번 항목)으로 고정하고 조명끈(lightScale)만 단계를
//      반영한다 — 전구는 작아서 낮에도 "장식이 더 달렸다" 정도로만 보이고 화면을 덮지 않는다. 노을/밤은 그대로.
//      낮 전용 채도·장식 단계 표현은 아직 없음(후속) — 필요해지면 이 자리에서 isDaytime 분기로 붙이면 된다.
//  21) 2026-09-22: 천막 규격(booth_size) 2종 — 한 천막(3x6)을 두 부스가 나눠 쓰던 자리에 3x3 작은 천막을 하나 더
//      세워 분리하기로 하면서(재원 결정), 부스마다 booth_size("BIG" | "SMALL", API 명세값)로 천막 종류를 고른다.
//      (a) 규격표는 constants/boothSizes.js가 단일 출처 — "BIG" = 3x6 캐노피(기존), "SMALL" = 3x3 파고다.
//          값이 없거나(백엔드 필드 추가 전) 모르는 값이면 "BIG"이라 기존 화면은 그대로다.
//      (b) 구조 분리: 이 컴포넌트는 "부스 공통 껍데기"(위치·회전·클릭·바닥 글로우·밝기 단계 계산·라벨 앵커)만 맡고,
//          천막 모양은 크기별 컴포넌트가 맡는다 — 기존 본문에 있던 캐노피 지오메트리는 JSX·값 그대로 CanopyTent로
//          옮겼고(치수만 규격표에서 읽음, 6x3·처마 0.25·기둥 2.3·지붕 1로 이전과 동일), 작은 천막은 새 파일 PagodaTent.jsx.
//      (c) 작은 천막은 재원이 공유한 흰색 파고다 텐트 사진 기준 — 흰 천, 오목하게 솟은 4면 지붕, 피니얼, 기둥 4개.
//          조명 장식(랜턴·조명끈·지붕 위 조명)은 달지 않는다(재원 선택: "사진처럼 조명 없이").
//      (d) 바닥 글로우(등불 단계)는 두 천막이 같은 BRIGHTNESS_TIERS를 쓴다 — 등불 인기도 표현이 천막 크기에 따라
//          달라지면 안 되므로(작은 천막이라고 글로우까지 작으면 "등불이 적은 부스"처럼 보인다) 일부러 공통으로 뒀다.
//
// 좌표/앵커 규칙(팀 합의, map-section-scope-and-roles.md B안):
//   - 이 컴포넌트는 "부스 오브젝트 + 라벨 앵커 좌표"만 제공한다.
//   - 부스명 등 텍스트 라벨은 여기서 3D 텍스트로 그리지 않는다 — 프론트A가
//     @react-three/drei의 <Html>로 이 앵커(`booth-label-*` 그룹) 위치에 얹어서 그리는 방식(B안)으로 합의됨.
//
// props:
//   - position: [x, y, z] (Three.js 씬 좌표 — y는 이 부스가 놓일 지면의 실제 높이(표고))
//   - rotationY: 라디안 단위 Y축 회전 (부스 정면이 바라보는 방향 — 보통 0이면 통로와 나란)
//   - label: 부스 이름 — 라벨 앵커 그룹 이름에만 사용(실제 텍스트 렌더링은 프론트A 담당)
//   - showLabel: 위 <Html> PinLabel을 그릴지 여부(기본 true). 2026-09-20에 3D 핀(BoothPin)을
//     도입하면서 추가 — 둘을 같은 자리에 겹쳐 띄우면 지저분해서, ZoneBooths가 마커 모드에 따라
//     이 값을 꺼준다. 라벨 앵커 좌표(booth-label-* 그룹) 자체는 그대로 두고 렌더만 건너뛴다.
//   - size: 천막 규격(booth_size) — "BIG"(기본, 3x6 캐노피) | "SMALL"(3x3 파고다). 없거나 모르는 값·대소문자
//     차이는 constants/boothSizes.js의 normalizeBoothSize가 정리한다(21번 항목)
//   - color: 천(지붕+처마) 색상. 비워 두면 천막마다 사진 기준 기본색 — 큰 천막은 파란색, 작은 천막은 흰색
//   - accentColor: 용마루 포인트 컬러(큰 천막만 — 작은 천막은 용마루가 없다)
//   - lanternCount: 이 부스에 달린 등불 개수(place.lantern_count) — PinLabel의 숫자 표시와 밝기 단계
//     계산(19번 항목, getLanternTier)에 같이 쓰인다. 없으면 0개로 취급.
//   - brightnessLevel: (선택) 0~MAX_LANTERN_TIER(현재 5) 밝기 단계 override. null/undefined(기본)면
//     lanternCount로 자동 계산하고, 숫자를 주면 그 단계로 강제한다(개발용 미리보기 — MapProvider의
//     boothBrightnessPreview가 이 자리로 내려온다). 범위 밖 값/문자열이 와도 내부에서 clamp하므로
//     크래시는 나지 않는다.
//
// 주의: 이 컴포넌트를 사용하는 화면(MapCanvas.jsx)은 반드시 <Selection> 컨텍스트 안에서
// 렌더링돼야 한다 — 그래야 아래 <Select enabled>들이 EffectComposer의 SelectiveBloom에
// 정상적으로 인식된다. <Selection> 없이 이 컴포넌트만 단독으로 쓰면 <Select>가 그냥
// 평범한 <group>처럼만 동작해서(블룸 없이) 에러 없이 조용히 무시된다.

// 등불 개수 단계별 "그리는 값" 표(18번 항목) — 단계 번호(0~MAX_LANTERN_TIER)는 constants/lanternTiers.js가
// 정하고(등불 몇 개부터 몇 단계인지 = "정하는 로직"), 여기서는 그 단계 번호를 어떤 밝기/반경으로
// 그릴지만 정한다("그리는 로직"). 그래서 팀에서 구간(0/1/10/30/50/100개)을 다시 바꿔도 이 파일은
// 표의 줄 수만 MAX_LANTERN_TIER + 1에 맞춰주면 된다 — 줄 수가 모자라면 아래 MAX_BRIGHTNESS_LEVEL이
// 표 길이로 상한을 잡아서 배열 밖을 참조하는 크래시는 안 나지만, 그 위 단계는 전부 마지막 줄로
// 보이니 반드시 같이 맞춰야 한다.
//
// 각 필드의 의미:
//   - glowOpacity: 바닥 글로우(GroundGlow) 최대 투명도(중심부 기준). 0단계도 0이 아닌 이유는
//     "부스가 여기 있다"는 위치 식별 기능(6번 항목)은 등불이 없어도 항상 유지해야 하기 때문.
//   - glowRadius: 바닥 글로우 반지름(m). 실제 zone1 부스들은 서로 바짝 붙어 있어서(zone1-booths.*.json)
//     너무 키우면 옆 부스 글로우와 겹쳐 한 덩어리로 보인다 — 그래서 최대 7.5까지만 키우고, 대신
//     "얼마나 밝고 진하게 보이는지"는 아래 glowIntensity가 담당한다.
//   - glowIntensity: 바닥 글로우 색 배율(셰이더 uIntensity). toneMapped=false + EffectComposer의
//     HalfFloat 버퍼 덕분에 1을 넘는 값이 그대로 HDR로 남아 SelectiveBloom에 더 큰 빛 에너지를 넘긴다
//     — 그래서 단계가 올라갈수록 opacity만 진해지는 게 아니라 글로우 자체가 "빛나면서 번지는" 느낌으로
//     바뀐다. 1.55를 상한으로 둔 건 실제 지도 카메라 거리 렌더에서 그 이상(1.9~2.4)은 ACES 톤매핑에
//     하얗게 뭉개져 노란 톤이 사라졌기 때문 — 값을 더 키우고 싶으면 이 상한부터 다시 렌더로 확인할 것.
//   - lightScale: 조명끈(TentLightOutline+CanopyRidgeLights) emissiveIntensity 배율. 예전(15번 항목)엔
//     50%→100% 선형이었는데 "차이가 안 느껴진다"는 피드백으로 12%→150%로 폭을 넓혔다. 1.5(=강도 12)를
//     상한으로 둔 건 그 이상에서는 전구가 개별로 안 보이고 한 덩어리 빛으로 뭉개지던 이전 경험 때문.
//     아래쪽을 0.12까지 내린 이유: 전구는 기본 강도(8)가 이미 블룸에 포화돼 있어서 0.35 이상에선
//     배율을 올려도 화면상 차이가 거의 없다 — "어둡다↔밝다" 차이는 사실상 아래 단계를 낮춰야 생긴다.
//
// 값들은 선형이 아니라 위로 갈수록 폭이 커지는 곡선으로 잡았다 — 사람 눈은 밝기 차이를 비율로
// 느끼기 때문에(0.25→0.4는 확 느껴지지만 0.85→1.0은 잘 안 느껴짐) 위 단계 간격을 더 벌려야
// 단계마다 "한 칸 올라갔다"는 게 고르게 보인다. 실제 단계별 결과는 헤드리스 렌더로 확인했음.
const BRIGHTNESS_TIERS = [
  { glowOpacity: 0.22, glowRadius: 4.5, glowIntensity: 1.0, lightScale: 0.12 }, // 0단계 — 등불 0개, 위치 식별만
  { glowOpacity: 0.38, glowRadius: 5.0, glowIntensity: 1.08, lightScale: 0.3 }, // 1단계 — 1개 이상, 은은하게
  { glowOpacity: 0.55, glowRadius: 5.6, glowIntensity: 1.18, lightScale: 0.55 }, // 2단계 — 10개 이상, 눈에 띄게
  { glowOpacity: 0.72, glowRadius: 6.2, glowIntensity: 1.3, lightScale: 0.85 }, // 3단계 — 30개 이상, 확실히 밝게
  { glowOpacity: 0.88, glowRadius: 6.9, glowIntensity: 1.42, lightScale: 1.2 }, // 4단계 — 50개 이상, 강하게 번짐
  { glowOpacity: 1.0, glowRadius: 7.5, glowIntensity: 1.55, lightScale: 1.5 }, // 5단계 — 100개 이상, 최대(축제 중심 부스)
]
// brightnessLevel clamp 상한 — 원칙적으로 MAX_LANTERN_TIER(현재 5)와 표 길이-1이 같아야 하고,
// 혹시 어긋나도(누가 한쪽만 고친 경우) 배열 밖 참조로 크래시 나지 않도록 둘 중 작은 값을 쓴다.
const MAX_BRIGHTNESS_LEVEL = Math.min(MAX_LANTERN_TIER, BRIGHTNESS_TIERS.length - 1)
const GROUND_GLOW_COLOR = '#ffdca0' // 바닥 글로우 색 — 랜턴(PoleLantern)과 같은 따뜻한 노란빛으로 통일
const LIGHT_STRING_COLOR = '#ffdca0' // 지붕 조명끈 색 — 랜턴/바닥 글로우와 동일한 따뜻한 노란빛으로 통일
// 광원(랜턴+조명끈) emissiveIntensity — 재원 요청("광원 정도를 극단적으로 올려줄 수 있어?")으로
// 기존 1.3~1.4에서 크게 올림(11번 항목). toneMapped=false라 1을 넘는 값도 그대로 HDR로 남아
// SelectiveBloom 쪽에 훨씬 강한 빛 에너지를 넘겨준다 — 값 자체(재질 밝기)와 블룸 번짐 크기를
// 동시에 극적으로 키우는 효과. 지붕/처마는 이제(9번 항목) emissive를 안 쓰므로, 아무리 올려도
// 천막 색상이 washed out(하얗게 날아감)되는 부작용은 없다 — 5번 항목에서 겪었던 문제와 달리
// 이 값을 올리는 게 이제 안전하다.
const LANTERN_GLOW_INTENSITY = 5
// 천막 조명끈(TentLightOutline) 전용 강도 — 재원 요청("천막 조명 크기를 2~3배 키우고
// 광원도 더 세게, 개수는 줄여도 된다")로 랜턴과 분리한 별도 상수(12번 항목). 랜턴은
// 작은 장식 전구라 5 그대로 두고, 천막 조명끈은 전구 자체가 커진 만큼 더 강하게 밝힘.
const TENT_LIGHT_STRING_INTENSITY = 8
// (2026-09-13: 처음엔 카테고리 구분용 color prop을 그대로 썼는데, 재원이 "빛 색상을 노란
// 계열로" 요청 — 랜턴/등불이랑 톤을 맞춰서 "등불빛이 바닥에 비친다"는 느낌으로 통일함.
// 카테고리 구분은 나중에 필요해지면 지붕 색(color prop)만으로도 충분히 구분되므로,
// 바닥 글로우까지 카테고리색을 쓸 필요는 없다고 판단.)

// 히프지붕 용마루 인셋(14번 항목) — 처마(halfRidge)에서 이만큼 안쪽까지 용마루가 짧아진다.
// width=6 기준 슬로프span(depth 3 + 처마 돌출)에 대해 자연스러운 경사각이 나오도록 잡은 값.
// Math.max로 하한을 둬서, 나중에 width/depth가 지금보다 훨씬 작아지는 경우에도 용마루 길이가
// 음수(지붕이 뒤집힘)가 되지 않도록 방어했다.
const ROOF_HIP_INSET = 2

// (18번 항목: 예전에 여기 있던 TENT_LIGHT_MIN_SCALE/getTentLightIntensityScale(50%→100% 선형 배율)은
// BRIGHTNESS_TIERS의 lightScale 필드로 흡수했다 — 조명끈 배율도 단계별로 표에서 직접 읽는다.)

// 바닥 글로우 링 — 중심이 가장 밝고 가장자리로 갈수록 부드럽게 사라지는 원형 그라디언트.
// 이미지 텍스처 없이 셰이더로 원형 falloff만 계산한다(프로젝트의 "이미지 에셋 안 늘리기" 방침과 동일,
// SceneEnvironment.jsx에서 하늘 셰이더 만들 때 쓴 것과 같은 접근).
const GROUND_GLOW_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
// uIntensity(18번 항목): 색에 곱하는 밝기 배율. toneMapped=false인 재질이라 1을 넘는 값이 그대로
// HDR로 남아, 같은 색·같은 opacity라도 SelectiveBloom이 더 강하게 번지게 만든다 — 단계별 "드라마틱한"
// 차이의 핵심. alpha(투명도)는 그대로 uOpacity가 담당하므로 둘은 독립적으로 조절 가능.
const GROUND_GLOW_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float dist = distance(vUv, vec2(0.5));
    float alpha = smoothstep(0.5, 0.0, dist) * uOpacity;
    gl_FragColor = vec4(uColor * uIntensity, alpha);
  }
`

// 부스 발밑에 까는 반투명 원형 글로우 — 카메라가 아무리 멀어도(기본 지도 줌 기준) 부스 위치
// 자체는 눈에 띄도록 하는 용도. radius는 부스 풋프린트(6m x 3m)보다 여유 있게 크게 잡았다.
// color 기본값은 GROUND_GLOW_COLOR(랜턴과 같은 따뜻한 노란빛) — 필요하면 개별 호출부에서 override 가능.
//
// 2026-09-13(2차): opacity를 밝기 단계(brightnessLevel)에 연동 — 재원 요청("등불 개수에
// 연동해서, 일단 버튼으로 미리 볼 수 있게"). 지금은 MapProvider의 boothBrightnessPreview 상태값이
// MapCanvas → Zone1Scene을 거쳐 그대로 들어온다(실제 lantern_count 연동은 나중 단계, timeOfDay와
// 동일한 원칙). uniforms는 <shaderMaterial uniforms={...}>로 매번 새 객체를 넘기는 대신
// ref로 material을 잡아 uniform .value만 직접 갱신 — three.js 셰이더 유니폼을 리액트
// 상태에 반응해서 바꿀 때 흔히 쓰는 패턴(매 프레임 재생성 없이 값만 갱신되어 더 안전함).
//
// 2026-09-18(18번 항목): intensity prop 추가 — 셰이더 uIntensity(색 배율)로 넘어간다. opacity는
// "얼마나 진하게 깔리는지", intensity는 "얼마나 세게 빛나서 번지는지"를 각각 담당해서, 단계가
// 올라갈수록 두 축이 같이 커지도록 BRIGHTNESS_TIERS에서 값을 받는다.
// radius는 circleGeometry args로 들어가므로 값이 바뀌면 지오메트리가 재생성된다 — 단계 전환은
// 드문 이벤트(등불 개수 갱신 시)라 비용 문제는 없지만, 매 프레임 바뀌는 값을 넣으면 안 된다.
function GroundGlow({ color = GROUND_GLOW_COLOR, radius = 4.5, opacity = 0.55, intensity = 1 }) {
  const materialRef = useRef(null)

  useEffect(() => {
    const material = materialRef.current
    if (!material) return
    material.uniforms.uColor.value.set(color)
    material.uniforms.uOpacity.value = opacity
    material.uniforms.uIntensity.value = intensity
  }, [color, opacity, intensity])

  return (
    <Select enabled>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 32]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={GROUND_GLOW_VERTEX_SHADER}
          fragmentShader={GROUND_GLOW_FRAGMENT_SHADER}
          uniforms={{
            uColor: { value: new THREE.Color(color) },
            uOpacity: { value: opacity },
            uIntensity: { value: intensity },
          }}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </Select>
  )
}

// 기둥에 다는 작은 장식용 랜턴 — 사각 금속 프레임 + 자체발광(emissive) 유리 패널 + 지붕(피라미드) + 손잡이 고리.
// 이미지 텍스처 없이 지오메트리+색상만으로 구성(프로젝트의 "이미지 에셋 안 늘리기" 방침과 동일).
function PoleLantern({ position }) {
  const frameColor = '#2a241c' // 어두운 금속(구리/무쇠) 톤
  const glowColor = '#ffdca0' // 등불 광원 색 — 따뜻한 노란빛
  const size = 0.14 // 프레임 폭/깊이 — "너무 크지 않게" 기준으로 기둥 지름(0.1)보다 살짝 큰 정도
  const height = 0.2 // 프레임 높이

  return (
    <group position={position}>
      {/* 유리(광원) 패널 — emissive+toneMapped=false로 항상 은은히 빛나 보이고,
          <Select enabled>로 표시해서 SelectiveBloom이 빛 번짐(블러) 효과를 입힌다. */}
      <Select enabled>
        <mesh>
          <boxGeometry args={[size * 0.7, height * 0.7, size * 0.7]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={LANTERN_GLOW_INTENSITY} toneMapped={false} />
        </mesh>
      </Select>
      {/* 모서리 프레임 기둥 4개 */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh key={i} position={[(sx * size) / 2, 0, (sz * size) / 2]}>
          <boxGeometry args={[0.016, height, 0.016]} />
          <meshStandardMaterial color={frameColor} metalness={0.5} roughness={0.6} />
        </mesh>
      ))}
      {/* 지붕(피라미드형 캡) */}
      <mesh position={[0, height / 2 + 0.045, 0]}>
        <coneGeometry args={[size * 0.68, 0.08, 4]} />
        <meshStandardMaterial color={frameColor} metalness={0.5} roughness={0.6} />
      </mesh>
      {/* 손잡이 고리 */}
      <mesh position={[0, height / 2 + 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.025, 0.005, 6, 12]} />
        <meshStandardMaterial color={frameColor} metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  )
}

// 히프(모임)지붕 커스텀 지오메트리(14번 항목) — 짧아진 용마루 양 끝(rL/rR)에서 네 처마 모서리
// (cFL/cFR/cBL/cBR)로 접히는 삼각형 2장(hip) + 사다리꼴 2장(앞/뒤, 각 2삼각형)으로 지붕을 만든다.
// 정점을 삼각형마다 따로 둬서(공유 없음) computeVertexNormals가 곧 페이스 노멀이 되도록 했다 —
// 즉 부드럽게 섞이지 않고 면마다 또렷하게 각지는(flat shading) 마감이며, 이는 기존 박스 지붕
// 패널들과 같은 시각적 마감이라 다른 부분과 이질감이 없다.
function useHipRoofGeometry(halfRidge, halfRun, slopeSpan, roofRise) {
  return useMemo(() => {
    const rL = [-halfRun, roofRise, 0]
    const rR = [halfRun, roofRise, 0]
    const cFL = [-halfRidge, 0, -slopeSpan]
    const cFR = [halfRidge, 0, -slopeSpan]
    const cBR = [halfRidge, 0, slopeSpan]
    const cBL = [-halfRidge, 0, slopeSpan]

    // 6개 삼각형 = 왼쪽 hip + 오른쪽 hip + 앞 사다리꼴(2장) + 뒤 사다리꼴(2장).
    // 바깥쪽+위쪽을 향하는 노멀이 나오도록 정점 순서(외적 방향)를 맞춰뒀다.
    const triangles = [
      [rL, cFL, cBL],
      [rR, cBR, cFR],
      [rL, rR, cFR],
      [rL, cFR, cFL],
      [rL, cBL, cBR],
      [rL, cBR, rR],
    ]

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(triangles.flat(2)), 3))
    geometry.computeVertexNormals()
    return geometry
  }, [halfRidge, halfRun, slopeSpan, roofRise])
}

function HipRoof({ halfRidge, halfRun, slopeSpan, roofRise, color }) {
  const geometry = useHipRoofGeometry(halfRidge, halfRun, slopeSpan, roofRise)
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// 천막 조명 테두리(TentLightOutline) — 지붕 각진 라인(용마루+대각선)뿐 아니라, 처마 둘레
// 사각 테두리 + 기둥 6개까지 전부 조명끈으로 감싸서 "빛으로 천막 전체 윤곽을 그린" 느낌을 낸다.
// 재원 피드백("천막 자체가 밋밋하다" + "깃발 같은 장식보다는 빛 효과로 부스를 부각시키고
// 싶다")을 반영해, 새 장식 요소(깃발 등)를 추가하는 대신 기존 "조명끈" 기법을 천막 전체로
// 확장하는 방향으로 풀었다. 라인이 늘어나도 좌표만 배열에 추가하면 되는 구조라 유지보수 부담이
// 크지 않다. 길이가 다른 지붕 크기에도 대응할 수 있도록, 전구 개수를 고정하지 않고 구간 길이 ×
// bulbsPerMeter로 계산한다. PoleLantern과 동일하게 밝기 단계(brightnessLevel)와 무관한
// 고정 장식이라 emissiveIntensity를 상수로 둔다.
//
// 2026-09-13(3차, 12번 항목): 전구 크기를 2~3배 키우고(bulbSize 0.045→0.12) 광원도 더
// 세게(TENT_LIGHT_STRING_INTENSITY), 대신 밀도는 낮춤(bulbsPerMeter 1.6→0.7) — 재원 요청
// ("천막 조명 크기를 2~3배 키우고 광원도 더 세게, 개수는 줄여도 된다"). 전구가 커진 만큼
// sphereGeometry의 분할 수도 6→10으로 올려서 확대됐을 때 각진 티가 덜 나도록 함.
// 2026-09-13(4차, 13번 항목): 막상 반영해보니 블룸(광원 극단적 상향, 11번 항목)과 겹쳐서
// 지붕이 빛 덩어리에 가려질 정도로 과했음 — 재원 요청("전구 크기를 다시 줄여줄래?")으로
// bulbSize를 0.12→0.07로 다시 낮춤(원래값 0.045보다는 여전히 크지만 훨씬 절제된 크기).
// 밀도(bulbsPerMeter)나 광원 강도(TENT_LIGHT_STRING_INTENSITY)는 이번엔 그대로 둠 —
// 딱 크기만 다시 줄여달라는 요청이었기 때문.
// 16번 항목: 지붕 각진 라인(용마루+hip 대각선 5개) 세그먼트를 제거했다 — 캐노피 위 조명이
// 생기면서 "지붕을 가로지르는 대각선 조명"역할이 겹치게 됐고, 두 세트가 같은 모서리(처마
// 4곳)에 다 모이다 보니 재원 피드백처럼 "조명이 난잡해" 보였다. 이제 능선 조명은
// CanopyRidgeLights 하나만 담당하고, TentLightOutline은 처마 둘레 + 기둥으로 역할을 좁혔다.
// bulbSize도 0.07→0.05로 한 단계 더 줄여서 전구가 서로 뭉쳐 보이는 걸 줄였다.
function TentLightOutline({
  ridgeSpan,
  slopeSpan,
  poleHeight,
  poleOffsets,
  poleInsetX,
  poleInsetZ,
  color = LIGHT_STRING_COLOR,
  bulbsPerMeter = 0.7,
  bulbSize = 0.05,
  intensityScale = 1,
}) {
  const eaveY = poleHeight // 처마(지붕과 처마 천이 만나는 높이)
  const poleLightBottom = 0.15 // 기둥 조명끈 시작 높이(바닥에서 살짝 띄움)
  const poleLightTop = poleHeight - 0.55 // 랜턴(poleHeight-0.32 부근)과 안 겹치게 그 아래에서 멈춤

  const segments = [
    // 1) 처마 둘레 사각 테두리 — 발밑까지 천막을 감싸는 느낌을 주는 4변. (16번 항목: 예전엔
    //    여기에 용마루+hip 대각선 라인도 있었는데, 그 역할은 이제 CanopyRidgeLights가 지붕
    //    "위"에서 전담하므로 겹치지 않게 여기서는 뺐다 — 처마 테두리+기둥만 남김.)
    [
      [-ridgeSpan / 2, eaveY, -slopeSpan],
      [ridgeSpan / 2, eaveY, -slopeSpan],
    ],
    [
      [-ridgeSpan / 2, eaveY, slopeSpan],
      [ridgeSpan / 2, eaveY, slopeSpan],
    ],
    [
      [-ridgeSpan / 2, eaveY, -slopeSpan],
      [-ridgeSpan / 2, eaveY, slopeSpan],
    ],
    [
      [ridgeSpan / 2, eaveY, -slopeSpan],
      [ridgeSpan / 2, eaveY, slopeSpan],
    ],
    // 2) 기둥 6개 각각을 감싸는 세로 조명끈 — 바닥~랜턴 바로 아래까지
    ...poleOffsets.map(([signX, signZ]) => [
      [signX * poleInsetX, poleLightBottom, signZ * poleInsetZ],
      [signX * poleInsetX, poleLightTop, signZ * poleInsetZ],
    ]),
  ]

  return (
    <Select enabled>
      <group>
        {segments.map(([start, end], si) => {
          const length = Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2])
          const bulbCount = Math.max(2, Math.round(length * bulbsPerMeter))
          return Array.from({ length: bulbCount }, (_, i) => {
            const t = (i + 0.5) / bulbCount
            const pos = [0, 1, 2].map((k) => start[k] + (end[k] - start[k]) * t)
            return (
              <mesh key={`${si}-${i}`} position={pos}>
                <sphereGeometry args={[bulbSize, 10, 10]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={TENT_LIGHT_STRING_INTENSITY * intensityScale}
                  toneMapped={false}
                />
              </mesh>
            )
          })
        })}
      </group>
    </Select>
  )
}

// 캐노피 용마루 위 조명(15번 항목, 17번 항목에서 현재 형태로 재정리) — TentLightOutline(지붕/
// 처마/기둥 "윤곽선")과 달리, 용마루(능선) 바로 위에 살짝 띄운 조명 한 줄을 얹어서
// "지붕 위에 조명을 설치"한 느낌을 낸다.
//
// 설계 변경 기록:
//   1) 처음엔 마주보는 처마 모서리끼리(대각선) 이어서 X자로 교차하며 처마 밑으로 처지는
//      (sag) 현수선 형태로 만들었는데, 렌더링해보니 히프지붕이 불투명해서 그 밑을 가려버려
//      지도 카메라(위/바깥에서 보는 구도)에서는 거의 안 보이는 문제가 있었다. 그래서 처지는
//      방향을 위로 뒤집어(sag→rise) 용마루보다 높은 지점을 지나가도록 바꿨다(1차 수정).
//   2) 대각선 방식 그대로 두니, 대각선이 교차하는 용마루 부근에서 두 대각선의 전구 4개가
//      한 지점에 옹기종기 몰려 지붕 한복판에 붕 뜬 것처럼 보였다 — 재원이 스크린샷에서
//      "상단 경사면에 떠있는 조명 네개" 문제로 짚어줌. crestGap으로 그 부분만 잘라내는
//      시도를 했었는데(2차 수정), 재원이 다시 보고 "그게 아니라 그 아래 4개(처마 쪽에
//      걸쳐있던 대각선 나머지 절반)를 없애고 싶었다"고 정정 — 즉 대각선 방식 자체가
//      요구사항과 안 맞았던 것.
//   3) 그래서 대각선 X자 교차 방식을 완전히 버리고, 재원 요청대로 "중앙 모서리(용마루)
//      기준으로 일렬로" 재구성했다 — 지금은 용마루를 따라 한 줄로 나란히 늘어선 조명
//      bulbCount개(기본 4개)가 전부다. 대각선/처짐 계산이 없어져서 컴포넌트도
//      훨씬 단순해짐. 용마루 표면(정확히는 용마루 포인트 컬러 바, HipRoof 지붕 자체보다도
//      약간 더 위)보다 roofClearance만큼 띄워서 붕 뜬 조명 줄처럼 보이게 했다 — 이 높이는
//      어차피 지붕에서 가장 높은 지점이라 별도 수치 검증 없이도 어느 각도에서 봐도 지붕에
//      가려지지 않는다(용마루 자체보다 낮은 지점은 지붕이 가릴 수 있지만, 용마루보다 높은
//      지점은 그 무엇도 가리지 않기 때문).
function CanopyRidgeLights({
  halfRun,
  poleHeight,
  roofRise,
  roofClearance = 0.1,
  color = LIGHT_STRING_COLOR,
  bulbCount = 4,
  bulbSize = 0.045,
  intensityScale = 1,
}) {
  const y = poleHeight + roofRise + roofClearance // 용마루보다 roofClearance만큼 위
  // 용마루 전체 길이(halfRun*2)에 걸쳐 bulbCount개를 균등 배치 — 끝에 딱 붙지 않도록
  // 살짝 안쪽으로 여백을 둔다(0.85배, 가장자리에서 15%씩 인셋).
  const span = halfRun * 2 * 0.85

  return (
    <Select enabled>
      <group>
        {Array.from({ length: bulbCount }, (_, i) => {
          const t = bulbCount === 1 ? 0.5 : i / (bulbCount - 1)
          const x = -span / 2 + span * t
          return (
            <mesh key={i} position={[x, y, 0]}>
              <sphereGeometry args={[bulbSize, 10, 10]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={TENT_LIGHT_STRING_INTENSITY * intensityScale}
                toneMapped={false}
              />
            </mesh>
          )
        })}
      </group>
    </Select>
  )
}

// 3m x 6m 캐노피(가젤보) 천막 본체 — booth_size "BIG"(기본값). 21번 항목 참고.
// 원래 BoothMarker 본문에 있던 천막 지오메트리(기둥·랜턴·히프지붕·용마루 바·조명끈·처마 천)를 JSX·값 그대로 옮겨 왔다.
// 바뀐 건 치수를 constants/boothSizes.js 규격표에서 읽는다는 것뿐이다(6x3, 처마 0.25, 기둥 2.3, 지붕 1 — 이전과 같은 값).
// lightScale: 조명끈 밝기 배율(BRIGHTNESS_TIERS의 lightScale) — 밝기 단계 계산은 BoothMarker가 하고 결과만 넘겨받는다.
function CanopyTent({ color = '#1d5fa8', accentColor = '#123f75', lightScale = 1 }) {
  // width: 부스 폭 — 통로와 나란한 긴 변(정면이 넓게 보이는 방향), 캐노피 천막 표준 규격
  // depth: 부스 깊이 — 통로에서 안쪽으로 들어가는 짧은 변
  // roofRise: 처마 대비 용마루 높이 — 16번 항목: 재원 피드백("천막이 너무 납작해보여")으로 0.55→1(경사각
  // 약 17°→30°)로 올림. 히프지붕/조명끈 좌표가 전부 이 값 하나로 계산되는 구조라(useHipRoofGeometry,
  // TentLightOutline, CanopyRidgeLights 전부 roofRise를 prop으로 받아 계산) 이 숫자만 바꿔도
  // 나머지 지오메트리·조명끈이 자동으로 같이 따라 올라간다 — 다른 코드는 손댈 필요 없었음.
  // eaveOverhang: 처마가 다리보다 살짝 튀어나오는 정도(0.25)
  const { width, depth, eaveOverhang, poleHeight, roofRise } = BOOTH_SIZE_SPECS[BOOTH_SIZE.BIG]
  const valanceHeight = 0.28 // 처마 밑으로 늘어지는 천 높이

  const halfWidth = width / 2
  const halfDepth = depth / 2
  const poleInsetX = halfWidth - 0.2
  const poleInsetZ = halfDepth - 0.2
  const slopeSpan = halfDepth + eaveOverhang // 용마루 중심에서 처마까지(Z축) 거리
  const ridgeSpan = width + eaveOverhang * 2 // 처마 전체 길이(X축, 처마 돌출 포함) — 히프지붕의 처마단
  const halfRidge = ridgeSpan / 2
  const halfRun = Math.max(halfRidge - ROOF_HIP_INSET, 0.3) // 용마루 절반 길이(14번 항목, 최소 0.3 보장)
  const ridgeRun = halfRun * 2 // 용마루 전체 길이 — 처마(ridgeSpan)보다 짧아진 실제 용마루

  // 다리 6개 — 긴 변(X축)마다 3개씩 2줄로 배치 (실제 3m x 6m 캐노피 천막 프레임과 동일)
  const poleOffsets = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 1],
    [0, 1],
    [1, 1],
  ]

  return (
    <>
      {/* 다리(프레임) 6개 — 은색 알루미늄 톤 + 기둥마다 장식용 랜턴 1개씩 */}
      {poleOffsets.map(([signX, signZ], i) => (
        <group key={i}>
          <mesh position={[signX * poleInsetX, poleHeight / 2, signZ * poleInsetZ]} castShadow receiveShadow>
            <cylinderGeometry args={[0.05, 0.05, poleHeight, 8]} />
            <meshStandardMaterial color="#c7ccd1" metalness={0.4} roughness={0.5} />
          </mesh>
          {/* 랜턴은 기둥 바깥쪽(통로에서 보이는 쪽)으로 살짝 띄워서 기둥에 매단 것처럼 배치 */}
          <PoleLantern
            position={[
              signX * (poleInsetX + 0.13),
              poleHeight - 0.32,
              signZ * (poleInsetZ + 0.13),
            ]}
          />
        </group>
      ))}

      {/* 히프(모임)지붕 캐노피 — 짧아진 용마루(ridgeRun) 양 끝에서 네 처마 모서리로 접히는
          진짜 4면 지붕(14번 항목, useHipRoofGeometry). 카테고리 색(color prop)만 표시하는
          일반 재질 — 밝기 단계 표현은 바닥 글로우가 전담하므로 여기서는 emissive/블룸을
          쓰지 않는다(9번 항목, 재원 요청은 그대로 유지 — 이번 요청은 형태만 바꿔달라는 것). */}
      <group position={[0, poleHeight, 0]}>
        <HipRoof halfRidge={halfRidge} halfRun={halfRun} slopeSpan={slopeSpan} roofRise={roofRise} color={color} />
      </group>

      {/* 용마루 포인트 컬러 라인 — 짧아진 용마루 길이(ridgeRun)에 맞춰 폭도 같이 줄임 */}
      <mesh position={[0, poleHeight + roofRise + 0.03, 0]}>
        <boxGeometry args={[ridgeRun, 0.06, 0.06]} />
        <meshStandardMaterial color={accentColor} />
      </mesh>

      {/* 천막 조명 테두리 — 처마 둘레 사각 테두리 + 기둥 6개를 조명끈으로 감싸서, 천막 아랫부분
          윤곽이 빛으로 드러나도록 한다(재원 피드백: "천막이 밋밋하다" + "깃발보다는 빛 효과로
          부각"). 16번 항목: 지붕 위 능선 조명은 이제 CanopyRidgeLights가 전담하므로
          여기서는 뺐다(재원 피드백 "조명이 난잡해" — 같은 모서리에 두 세트가 겹치던 문제 해소).
          15번 항목부터 brightnessLevel에 반응하고, 18번 항목에서 폭을 12%~150%(BRIGHTNESS_TIERS의
          lightScale)로 넓혔다 — 0단계도 완전히 꺼지진 않고, 최고 단계에선 기본 강도보다 더 세게 빛난다. */}
      <TentLightOutline
        ridgeSpan={ridgeSpan}
        slopeSpan={slopeSpan}
        poleHeight={poleHeight}
        poleOffsets={poleOffsets}
        poleInsetX={poleInsetX}
        poleInsetZ={poleInsetZ}
        intensityScale={lightScale}
      />

      {/* 캐노피 위 용마루 조명(15번 항목, 17번 항목에서 지금 형태로 재정리) — 재원이 공유한
          참고 사진처럼 지붕 "위"에 조명을 설치하되(용마루보다 높은 지점에 띄워서 지붕 표면에
          가려지지 않음), 재원이 최종적으로 요청한 대로 대각선 교차 없이 용마루를 따라
          일렬로 배치했다(컴포넌트 자체 주석에 전체 변경 이력 정리). TentLightOutline과
          같은 lightScale 배율을 받아 brightnessLevel에 따라 12%~150% 밝기로 반응(18번 항목). */}
      <CanopyRidgeLights
        halfRun={halfRun}
        poleHeight={poleHeight}
        roofRise={roofRise}
        intensityScale={lightScale}
      />

      {/* 처마 밑으로 늘어지는 천(valance) — 긴 변 2면 + 짧은 변 2면, 처마 둘레를 감싸는 형태.
          지붕과 마찬가지로 카테고리 색만 표시하는 일반 재질(9번 항목, 재원 요청으로 emissive 제거). */}
      <mesh position={[0, poleHeight - valanceHeight / 2, -slopeSpan]}>
        <boxGeometry args={[ridgeSpan, valanceHeight, 0.03]} />
        <meshStandardMaterial color={color} side={2} />
      </mesh>
      <mesh position={[0, poleHeight - valanceHeight / 2, slopeSpan]}>
        <boxGeometry args={[ridgeSpan, valanceHeight, 0.03]} />
        <meshStandardMaterial color={color} side={2} />
      </mesh>
      <mesh position={[-ridgeSpan / 2, poleHeight - valanceHeight / 2, 0]}>
        <boxGeometry args={[0.03, valanceHeight, slopeSpan * 2]} />
        <meshStandardMaterial color={color} side={2} />
      </mesh>
      <mesh position={[ridgeSpan / 2, poleHeight - valanceHeight / 2, 0]}>
        <boxGeometry args={[0.03, valanceHeight, slopeSpan * 2]} />
        <meshStandardMaterial color={color} side={2} />
      </mesh>
    </>
  )
}

export default function BoothMarker({
  position,
  rotationY = 0,
  label,
  showLabel = true,
  category,
  lanternCount = 0,
  size,
  color,
  accentColor,
  brightnessLevel = null,
  onClick,
}) {
  // 천막 규격(21번 항목) — API의 booth_size를 "BIG" | "SMALL"로 정리한다. 값이 없거나 모르는 값이면 "BIG"(기존 천막).
  const boothSize = normalizeBoothSize(size)
  const isSmallTent = boothSize === BOOTH_SIZE.SMALL

  // 밝기 단계 결정(19번 항목): brightnessLevel이 명시되면(개발용 override) 그 값을, 아니면 이 부스의
  // 등불 개수로 getLanternTier()가 정한 단계를 쓴다. lanternCount도 Number()로 감싸는 이유는 API 응답이
  // 문자열("32")이나 null로 올 수 있어서(NaN/null → 0개 → 0단계).
  const resolvedLevel = brightnessLevel ?? getLanternTier(Number(lanternCount) || 0)
  // 0~MAX_BRIGHTNESS_LEVEL(현재 5) 범위로 안전하게 clamp — 잘못된 값(음수, 범위 초과, 문자열,
  // undefined/NaN)이 들어와도 배열 밖을 참조하지 않도록. Number()로 한 번 감싸는 이유는 나중에
  // API 응답값이 문자열("3")로 들어오는 경우까지 방어하기 위함(NaN이면 || 0으로 0단계 처리).
  // 표에서 꺼낸 값들은 바닥 글로우(GroundGlow)와 조명끈(TentLightOutline+CanopyRidgeLights)에만
  // 쓰인다 — 지붕/처마 자체는 여전히 밝기 단계에 반응하지 않음(9번 항목 참고, 재원 요청 유지).
  const safeLevel = Math.min(Math.max(Math.round(Number(resolvedLevel) || 0), 0), MAX_BRIGHTNESS_LEVEL)
  // 낮 게이팅(20번 항목): 낮에는 바닥 글로우를 0단계 값으로 고정(위치 식별만), 조명끈만 단계 반영.
  // 노을/밤(그리고 Provider 없이 단독 렌더할 때의 기본값 'night')은 표 값을 그대로 쓴다.
  const isDaytime = useTimeOfDay() === 'day'
  const tierValues = BRIGHTNESS_TIERS[safeLevel]
  const { glowOpacity, glowRadius, glowIntensity } = isDaytime ? BRIGHTNESS_TIERS[0] : tierValues
  const { lightScale } = tierValues

  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      {/* 바닥 글로우 링 — 부스 위치 자체를 카메라 거리와 무관하게 눈에 띄게 하는 마커.
          색은 카테고리색이 아니라 랜턴과 같은 따뜻한 노란빛(GROUND_GLOW_COLOR)으로 통일.
          brightnessLevel(등불 개수 단계)이 올라갈수록 진하기(opacity)·반경(radius)·빛 세기
          (intensity, HDR 배율 → 블룸 번짐)가 같이 커지도록 연동했다 — 재원 요청("등불 개수에
          연동, 일단 버튼으로 미리보기") + 18번 항목("단계 차이를 드라마틱하게"). 0단계에서도
          완전히 안 보이진 않게 최소 opacity는 남겨둠(위치 식별 기능 자체는 항상 유지).
          단계별 실제 값은 전부 BRIGHTNESS_TIERS 표에 있다 — 여기서 수식으로 계산하지 않음.
          21번 항목: 천막 크기(booth_size)와 무관하게 같은 표를 쓴다 — 작은 천막이라고 글로우까지 작으면
          "등불이 적은 부스"처럼 읽혀서, 등불 인기도 표현은 천막 크기와 상관없이 똑같이 보여준다. */}
      <GroundGlow opacity={glowOpacity} radius={glowRadius} intensity={glowIntensity} />

      {/* 천막 본체 — booth_size별로 다른 천막을 그린다(21번 항목). 큰 천막(기본)은 기존 캐노피 그대로이고,
          작은 천막은 조명 장식 없이 천막만 있다(재원 선택) — 등불 단계는 위 바닥 글로우로만 보인다. */}
      {isSmallTent ? (
        <PagodaTent color={color} />
      ) : (
        <CanopyTent color={color} accentColor={accentColor} lightScale={lightScale} />
      )}

      {/* 부스명 라벨 앵커 — 원래 계획(B안)은 이 좌표 위에 프론트A가 drei Html로 텍스트를 얹는
          것이었음. 2026-09-13: 재원 요청("지금 localhost에서 부스 위에 마커가 뜨게 해줘")으로,
          로컬 확인/데모용 참고 구현을 여기 임시로 붙였다 — 프론트A가 맡을 최종 디자인(아이콘,
          클릭 인터랙션, 카테고리별 스타일 등)을 대체하는 게 아니라 "이 자리에 이렇게 달면 된다"는
          예시. distanceFactor로 카메라 거리에 따라 자연스럽게 크기가 줄어들게 했고, occlude는
          지형/다른 부스에 가려질 때 깜빡임(재계산 비용)이 있어서 이번 참고 구현에는 넣지 않음 —
          필요하면 프론트A가 <Html occlude> 형태로 바꿔도 됨. 색은 랜턴/조명 톤(#ffdca0 계열)과
          맞춰 부스 장식 팔레트와 통일감을 줬다. */}
      {label && showLabel ? (
        <group
          name={`booth-label-${label}`}
          position={[0, getBoothTopHeight(boothSize) + 0.5, 0]}
        >
          <Html center distanceFactor={30} zIndexRange={[10, 0]}>
            <PinLabel onClick={onClick} label={label} category={category} lanternCount={lanternCount} />
          </Html>
        </group>  
      ) : null}
    </group>
  )
}

# 구역별 3D 씬 자산

여기에는 구역별 `.glb` 로더/좌표 매핑 코드만 둔다 (블렌더 원본 `.blend` 파일은 이 레포에 두지 않음 — "목업" 폴더가 source of truth).

확정된 3개 구역 (`campus-map/final-plan-team-share.md` v3) + 추가 구역:

- `zone1` — 경영관·혜화관 거리 → `public/models/zone1.glb` (`Zone1Scene.jsx`, API 부스 좌표 사용)
- `zone2` — 팔정도 → `public/models/zone2.glb` (`Zone2Scene.jsx`, API 부스 좌표 사용)
- `zone3` — 만해광장 + 후문쪽 거리 → `public/models/zone3.glb` (`Zone3Scene.jsx`, API 부스 좌표 사용; 씬에서 glb를 2배로 키워 씀)
- `zone4` — 학림관 → `public/models/hangnimgwan.glb` (`Zone4Scene.jsx`, API 부스 좌표 사용)
- `zone5` — 원흥관 (2026-09-20 추가, 별개 독립 구역) → `public/models/zone5.glb` (`Zone5Scene.jsx`; 씬에서 glb를 2배로 키워 씀)

최종 export된 `.glb` 파일 자체는 `public/models/`에 두고, 이 폴더에는 구역별 로딩 컴포넌트(예: `Zone1Scene.jsx`)와 부스 앵커 좌표 JSON 연동 코드를 둔다.

## 부스 API → 3D 배치

- zone1~4는 `useMapZoneBooths`에서 받은 API 데이터를 `ZoneBooths`와 `BoothMarker`로 렌더링한다.
- `map_x`, `map_y`, `map_elevation`, `rotation`, `lantern_count`는 API 응답을 그대로 사용한다.
- zone5를 포함한 모든 구역의 부스 좌표는 장소 목록 API 응답을 사용한다.
- zone3·zone5는 씬의 `MAP_SCALE`이 2이므로 부스 좌표에도 같은 배율이 반영되어야 한다.

## 부스 천막 규격(booth_size) — 2026-09-22

- 부스마다 천막 종류를 `booth_size`로 고른다(API 명세: `rotation` 바로 다음 필드). `"BIG"` = 3m×6m 캐노피(기존 천막, 기본값), `"SMALL"` = 3m×3m 파고다 천막(`PagodaTent.jsx` — 흰색, 조명 장식 없음).
- 값은 `GET /api/booths/` 부스 항목의 `booth_size`를 그대로 받는다. 없거나(`undefined`/`null`) 모르는 값이면 `"BIG"`으로 그리고, 소문자(`"small"`)·앞뒤 공백은 알아서 맞춘다 — `src/constants/boothSizes.js`의 `normalizeBoothSize`.
- 천막 치수(가로·세로·기둥 높이·지붕 높이)는 `src/constants/boothSizes.js`의 `BOOTH_SIZE_SPECS`가 단일 출처다. 지도 뷰어(festival-map-viewer)도 이 파일을 sync로 가져가서 겹침 계산·이름표 높이에 쓴다.
- `BoothMarker`는 위치·회전·클릭·바닥 글로우·라벨 앵커(두 천막 공통)만 맡고, 천막 모양은 크기별 컴포넌트(`CanopyTent` — BoothMarker.jsx 안, `PagodaTent.jsx`)가 맡는다.
- 좌표(`map_x`/`map_y`)는 두 천막 모두 천막 **중심**이다. rotation 0이면 큰 천막은 6m 변이 x축과 나란하다.
- 바닥 글로우(등불 단계)는 천막 크기와 상관없이 같은 표를 쓴다 — 작은 천막이라고 글로우까지 작아지면 "등불이 적은 부스"처럼 보이기 때문.

## glb 최적화 파이프라인 (2026-09-16, 이슈 #33)

블렌더에서 export한 raw glb를 그대로 쓰지 않고 [gltf-transform](https://gltf-transform.dev/)으로 한 번 줄여서 올린다.
드로우콜과 용량을 같이 줄이는 게 목적이고, 로더 쪽 코드는 바꿀 필요가 없다.

```bash
# 1) 블렌더 export (GLB, 모디파이어 적용, +Y up, 카메라/라이트 제외, 텍스처 1K로 축소)
#    -> C:\workspace\campus-map\blender\export_glb_small.py 를 블렌더 파이썬 콘솔에서 exec

# 2) 최적화: meshopt 압축 + 정점 양자화 + WebP 텍스처(최대 1024px) + 재질별 메시 병합 + GPU 인스턴싱
npx @gltf-transform/cli optimize <raw.glb> <out.glb> \
  --compress meshopt --texture-compress webp --texture-size 1024 \
  --simplify false --palette false --join true --flatten true --instance true

# 3) 노멀/러프니스 맵은 512px로 한 단계 더 축소 (지도 카메라 거리에서 차이 없음)
npx @gltf-transform/cli resize <out.glb> <out.glb> --width 512 --height 512 --pattern "*{_rough_,_nor_gl_}*"
npx @gltf-transform/cli webp   <out.glb> <out.glb> --quality 78 --slots "{normalTexture,metallicRoughnessTexture}"

# 4) meshopt 재적용 (2026-09-19 추가) — 3)의 resize/webp가 meshopt를 디코드해버려서
#    마지막에 한 번 더 압축해야 최종 파일에 EXT_meshopt_compression이 남는다.
npx @gltf-transform/cli meshopt <out.glb> <out.glb>
```

- `--simplify false`: 창턱·연석처럼 얇은 박스가 많아서 지오메트리 단순화는 끈다.
- `--palette false`: 재질 이름을 유지하려고 팔레트 병합은 끈다(시간대 조명/재질 튠 때 이름으로 찾을 수 있게).
- `--join`: 같은 재질의 메시를 병합한다 → **glb 안의 오브젝트 이름이 사라진다.** 부스 좌표는 JSON 기반이라 영향이 없지만,
  나중에 "건물 클릭" 같은 이름 기반 기능이 필요해지면 그때 `--join false`로 다시 export하면 된다.
- 결과(2026-09-16): zone1 12.4 MB → 2.98 MB(메시 1,533 → 91), zone2 10.2 MB → 3.25 MB(224 → 37), 학림관 7.8 MB → 1.75 MB(39 → 28).
- 결과(2026-09-20): zone5(원흥관) 40.6 MB → 1.86 MB. 원본 .blend 가 블렌더 5.2 라서 클라우드의 5.0.1 로 열면
  "newer Blender binary" 경고가 뜨지만 export 결과에는 문제가 없었다(라운드트립 검증 완료). 퀄리티 패스 스크립트는
  `C:\workspace\campus-map\blender\wonheung_quality_pass\` 에 있다.
- 결과(2026-09-19): zone3(만해광장) 5.17 MB → 0.85 MB. 4)단계가 없으면 0.98 MB + meshopt 미적용 상태가 된다 —
  기존 세 구역 glb도 같은 이유로 meshopt가 빠져 있을 수 있으니, 다음 재-export 때 4)단계까지 돌리면 용량이 더 줄어들 여지가 있다.
- 블렌더 쪽 주의(2026-09-19): 나무 에셋(tree_X12_+X1 Rock Pack)의 잎/수피 머티리얼이 Diffuse BSDF 노드라서
  glb export에서 텍스처가 빠져 회색으로 나왔다 → Principled BSDF로 변환하는 `fix_tree_materials.py`(campus-map/blender/)를
  만해광장 파일에 적용해서 해결. 같은 에셋을 다른 구역에 새로 쓸 때도 export 전에 한 번 돌려주면 된다.
- 로더 요구사항: `EXT_meshopt_compression`(drei `useGLTF` 기본 MeshoptDecoder), `EXT_texture_webp`(three r118+), `KHR_mesh_quantization`.
  셋 다 현재 스택(three 0.180 / drei 10.7)에서 추가 설정 없이 동작함을 헤드리스 크롬 렌더로 확인.

import LanternViewTab from '../LanternViewTab/LanternViewTab'
import { useOptionalMapContext } from '../../context/MapProvider'
import { useEffect, useState } from 'react'
import { useLanterns } from '../../../lantern/context/LanternProvider'
import { useAuth } from '../../../../hooks/useAuth'
import { getBoothDetail } from '../../../../api/map'
import lanternOn from '../../../../assets/map/lantern/lanternOn.svg'
import lanternOff from '../../../../assets/map/lantern/lanternOff.svg'
import { useTranslation } from '../../../../i18n/useTranslation'
import * as S from './BoothDetailPanel.styles'

// 실제 부스 설명은 장소 상세 페이지와 공통 콘텐츠를 재사용하도록 연결한다.
export default function BoothDetailPanel({ boothId, onBack, sheetTab, setSheetTab, selectedDate }) {
  const { language, t } = useTranslation()
  const { setActiveBooth } = useLanterns()
  const { isLoggedIn } = useAuth()
  // 등불 보기 탭에서 수정/삭제가 일어나면 MapProvider의 boothRevision이 올라간다.
  // 홈 랭킹 모달처럼 MapProvider 밖에서 열릴 때는 컨텍스트가 없으므로 0으로 고정(재조회 없음).
  const boothRevision = useOptionalMapContext()?.boothRevision ?? 0
  const [detail, setDetail] = useState(null)
  const currentDetail = detail?.boothId === boothId && detail?.isLoggedIn === isLoggedIn
    ? detail : null
  const booth = currentDetail?.booth ?? null
  const isLoading = currentDetail == null

  useEffect(() => {
    let ignore = false
    getBoothDetail(boothId)
      .then(({ data: response }) => {
        if (ignore) return
        if (!response?.success || response.data?.booth_id !== Number(boothId)) {
          throw new Error('Invalid booth detail response')
        }
        setDetail({
          boothId,
          isLoggedIn,
          booth: {
            ...response.data,
            operations: response.data.operations ?? [],
            menus: response.data.menus ?? [],
          },
        })
      })
      .catch((error) => {
        if (ignore) return
        setDetail({
          boothId,
          isLoggedIn,
          booth: null,
          errorKey: error.response?.status === 404
            ? 'map.placeNotFound'
            : 'map.placeLoadError',
        })
      })
    return () => { ignore = true }
  }, [boothId, isLoggedIn, boothRevision])
  const simple =
    booth &&
    (booth.place_type === 'FACILITY' ||
      ['TOILET', 'ALCOHOL'].includes(booth.category))
  const money = (value) => value
    ? t('map.currency', { value: value.toLocaleString(language) })
    : t('map.free')

  const activeBoothId = booth && !simple ? booth.booth_id : null
  const festivalDate = selectedDate ?? '2026-09-29'

  useEffect(() => {
    setActiveBooth(activeBoothId == null ? null : {
      boothId: activeBoothId,
      festivalDate,
    })

    // 목록으로 돌아가거나 지도 페이지를 떠날 때 이전 부스 선택을 남기지 않는다.
    return () => setActiveBooth(null)
  }, [activeBoothId, festivalDate, setActiveBooth])

  return (
    <S.Panel>
      <S.Toolbar>
        <S.Back
          type="button"
          onClick={onBack}
          aria-label={t('map.backToList')}
          title={t('map.backToList')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="14"
            viewBox="0 0 16 14"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M14.375 5.7512H3.00917L6.48792 1.57287C6.65058 1.37716 6.72884 1.12485 6.70548 0.87144C6.68211 0.618031 6.55904 0.384283 6.36333 0.221617C6.16763 0.0589506 5.91531 -0.0193087 5.66191 0.00405519C5.4085 0.0274191 5.17475 0.150493 5.01208 0.3462L0.220417 6.0962C0.187523 6.1415 0.158662 6.18961 0.134167 6.23995C0.134167 6.28787 0.134167 6.31662 0.0670835 6.36453C0.0236456 6.47441 0.000901908 6.59138 0 6.70953C0.000901908 6.82769 0.0236456 6.94465 0.0670835 7.05453C0.0670835 7.10245 0.0670832 7.1312 0.134167 7.17912C0.158662 7.22946 0.187523 7.27756 0.220417 7.32287L5.01208 13.0729C5.10219 13.181 5.21502 13.268 5.34256 13.3277C5.4701 13.3873 5.60921 13.4181 5.75 13.4179C5.97392 13.4183 6.19092 13.3403 6.36333 13.1975C6.46037 13.117 6.54059 13.0182 6.59938 12.9067C6.65818 12.7952 6.6944 12.6732 6.70597 12.5477C6.71755 12.4222 6.70424 12.2956 6.66682 12.1752C6.62941 12.0548 6.56861 11.943 6.48792 11.8462L3.00917 7.66787H14.375C14.6292 7.66787 14.8729 7.5669 15.0526 7.38718C15.2324 7.20745 15.3333 6.9637 15.3333 6.70953C15.3333 6.45537 15.2324 6.21161 15.0526 6.03189C14.8729 5.85217 14.6292 5.7512 14.375 5.7512Z"
              fill="#9F9C99"
            />
          </svg>
        </S.Back>
        {booth && !simple && (
          <S.Tabs aria-label={t('map.boothDetailView')}>
            <S.Tab
              type="button"
              $active={sheetTab === 'info'}
              aria-pressed={sheetTab === 'info'}
              onClick={() => setSheetTab('info')}
            >
              {t('map.boothDescription')}
            </S.Tab>
            <S.Tab
              type="button"
              $active={sheetTab === 'lantern'}
              aria-pressed={sheetTab === 'lantern'}
              onClick={() => setSheetTab('lantern')}
            >
              {t('map.viewLanterns')}
            </S.Tab>
          </S.Tabs>
        )}
      </S.Toolbar>
      {isLoading ? (
        <S.Message role="status">{t('map.loadingPlace')}</S.Message>
      ) : !booth ? (
        <S.Message role="alert">{t(currentDetail.errorKey)}</S.Message>
      ) : (
        <>
          <S.Header>
            <S.Identity>
              <S.Title>{booth.name}</S.Title>
              {!simple && booth.subtitle && (
                <S.Subtitle>{booth.subtitle}</S.Subtitle>
              )}
            </S.Identity>
            {!simple && (
              <S.Lantern $on={booth.has_my_lantern}>
                <img
                  src={booth.has_my_lantern ? lanternOn : lanternOff}
                  alt={booth.has_my_lantern ? t('map.lanternRegistered') : t('map.lanternNotRegistered')}
                />
                <span>{booth.lantern_count}</span>
              </S.Lantern>
            )}
          </S.Header>
          {!simple && sheetTab === 'lantern' ? (
            <LanternViewTab key={booth.booth_id} boothId={booth.booth_id} selectedDate={festivalDate} />
          ) : (
            <>
              {simple ? (
                <>
                  <S.Section>
                    <S.Label>{t('map.location')}</S.Label>
                    <S.Text>{booth.location_detail || booth.zone}</S.Text>
                  </S.Section>
                  {booth.place_type === 'FACILITY' && booth.directions && (
                    <S.Section>
                      <S.Label>{t('map.directions')}</S.Label>
                      <S.Text>{booth.directions}</S.Text>
                    </S.Section>
                  )}
                </>
              ) : (
                <>
                  {booth.description && (
                    <S.Section>
                      <S.Label>{t('map.introduction')}</S.Label>
                      <S.Text>{booth.description}</S.Text>
                    </S.Section>
                  )}
                  <S.Section>
                    <S.LabelRow>
                      <S.Label>{t('map.information')}</S.Label>
                      {booth.has_reusable_container && (
                        
                        <S.Reusable>
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 11 10" fill="none">
                            <path d="M10.8753 0.892131C8.26171 2.42573 8.44891 5.57573 6.61771 6.99713C5.23951 8.06693 3.29491 7.52513 2.17051 7.06493C2.17051 7.06493 1.40851 8.02673 0.861909 9.30893C0.678909 9.73913 -0.124491 9.26513 0.0165087 8.90093C1.80331 4.28993 7.88251 1.98953 7.88251 1.98953C7.88251 1.98953 3.59311 1.80773 0.726309 5.55353C0.649509 4.69793 0.522308 2.38313 2.74231 0.963531C5.75191 -0.963069 11.4855 0.534531 10.8753 0.892131Z" fill="#0D9352"/>
                          </svg>
                          {t('map.reusableBooth')}</S.Reusable>
                      )}
                    </S.LabelRow>
                    <S.Text>{t('map.operationLocation')}: {booth.location_detail || booth.zone}</S.Text>
                    <S.Operations aria-label={t('map.operationSchedule')}>
                      {booth.operations.map((op) => (
                        <li key={`${op.festival_date}-${op.time_slot}`}>
                          {t('map.operationTime')}: {Number(op.festival_date.slice(5, 7))}/
                          {Number(op.festival_date.slice(8, 10))} ({t(op.time_slot === 'DAY' ? 'map.day' : 'map.night')}){' '}
                          {op.open_at}–{op.close_at}
                        </li>
                      ))}
                    </S.Operations>
                    {!booth.operations.length && <S.Text>{t('map.scheduleTbd')}</S.Text>}
                    <S.Text>{t('map.admissionFee')}: {money(booth.entrance_fee)}</S.Text>
                  </S.Section>
                  {booth.category !== 'ECO' && booth.menus.length > 0 && (
                    <S.Section>
                      <S.Label>{t('map.menu')}</S.Label>
                      <S.MenuList>
                        {[...booth.menus]
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((menu) => (
                            <li key={menu.menu_id}>
                              <span>{menu.name}</span>
                              <span>{money(menu.price)}</span>
                            </li>
                          ))}
                      </S.MenuList>
                    </S.Section>
                  )}
                  {booth.event_description && (
                    <S.Section>
                      <S.Label>{t('map.event')}</S.Label>
                      <S.Text>{booth.event_description}</S.Text>
                    </S.Section>
                  )}
                  {booth.instagram_id && (
                    <S.Section>
                      <S.Label>{t('map.instagram')}</S.Label>
                      <S.Instagram
                        href={`https://www.instagram.com/${encodeURIComponent(booth.instagram_id)}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        @{booth.instagram_id}
                      </S.Instagram>
                    </S.Section>
                  )}
                </>
              )}
              {booth.image_url && (
                <S.Section>
                  <S.Label>{t('map.image')}</S.Label>
                  <S.Poster
                    src={booth.image_url}
                    alt={t('map.boothImageAlt', { name: booth.name })}
                  />
                </S.Section>
              )}
            </>
          )}
        </>
      )}
    </S.Panel>
  )
}

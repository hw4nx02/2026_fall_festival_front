import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import Modal from '../../../components/common/Modal'
import BoothDetailPanel from '../../map/components/BottomSheet/BoothDetailPanel'
import { getCurrentFestivalDate } from '../../lantern/utils/getCurrentFestivalDate'

import donggam from '../assets/donggam.png'
import ecoco from '../assets/ecoco.png'
import scien from '../assets/scien.png'
import sogaeting from '../assets/sogaeting.svg'
import ba from '../assets/ba.png'
import ace from '../assets/ace.png'

// 상단 광고 배너 (기능명세서 바탕으로) 일정 시간(5초)마다 자동 롤링, 클릭 시 안내>협업 페이지로 이동

// TODO(API): 배너 목록 API가 정해지면 연결할거고 일단 지금은 더미 데이터로 구현해둿습니다
// image에 실제 배너 이미지가 들어오면 Wrapper 배경으로 깔린다 (title은 스크린리더용)
const BANNERS = [
  {
    id: 1,
    title: '동감',
    image: donggam,
    href: null,
    boothId: null,
    to: '/info/collab/donggam',
  },
  {
    id: 2,
    title: '에코코',
    image: ecoco,
    href: null,
    boothId: null,
    to: '/info/collab/ecoco',
  },
  {
    id: 3,
    title: '자연科 함께',
    image: scien,
    href: null,
    boothId: null,
    to: '/info/collab/with-nature',
  },
  {
    id: 4,
    title: '소개팅',
    image: sogaeting,
    href: 'https://threadoffate.site/?ref=dgufest',
    boothId: null,
    to: null,
  },
  {
    id: 5,
    title: '경영학과 야간부스',
    image: ba,
    href: null,
    boothId: null,
    to: null,
  },
  {
    id: 6,
    title: '첨단융합대학 야간부스',
    image: ace,
    href: null,
    boothId: null,
    to: null,
  },
]

const ROLLING_INTERVAL = 5000

// 홈 부스 랭킹 모달과 동일한 바텀시트라서 이거 pr 이후에 공통으로 분리할 예정
const SHEET_STYLE = {
  position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
  width: '100%', maxWidth: 375, maxHeight: 'calc(100dvh - 40px)',
  overflowY: 'auto', overscrollBehavior: 'contain', boxSizing: 'border-box',
  borderRadius: '28px 28px 0 0', textAlign: 'left',
  padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
}

// 배너 안에 놓이는 건 인디케이터 하나뿐이라, 시안 padding이 곧 인디케이터 위치가 된다.
// 350 + 14(인디케이터) + 11 = 375 / 61 + 12 + 7 = 80
const Wrapper = styled.button`
  width: calc(100% + 32px);
  height: 80px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  align-self: stretch;
  margin: 0 -16px;
  padding: 61px 11px 7px 350px;
  border: 0;
  border-radius: 0;
  background-color: #a6a6a6;
  background-image: ${({ $image }) => ($image ? `url(${$image})` : 'none')};
  background-size: cover;
  background-position: center;
`

const Indicator = styled.span`
  color: #fff;
  font-size: 9px;
  line-height: 1;
  white-space: nowrap;
`

export default function AdBanner() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [openBoothId, setOpenBoothId] = useState(null)
  const [sheetTab, setSheetTab] = useState('info')
  const triggerRef = useRef(null)

  const closeSheet = useCallback(() => {
    setOpenBoothId(null)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % BANNERS.length)
    }, ROLLING_INTERVAL)

    return () => clearInterval(timer)
  }, [])

  if (BANNERS.length === 0) {
    return null
  }

  const banner = BANNERS[index]

  const handleClick = (event) => {
    if (banner.href) {
      window.open(banner.href, '_blank', 'noopener,noreferrer')
      return
    }
    if (banner.boothId) {
      triggerRef.current = event.currentTarget
      setSheetTab('info')
      setOpenBoothId(banner.boothId)
      return
    }
    if (banner.to) {
      navigate(banner.to)
    }
  }

  return (
    <>
      <Wrapper
        type="button"
        $image={banner.image}
        aria-label={banner.title}
        aria-haspopup={banner.boothId ? 'dialog' : undefined}
        onClick={handleClick}
      >
        <Indicator aria-hidden="true">
          {index + 1}/{BANNERS.length}
        </Indicator>
      </Wrapper>

      {openBoothId != null && (
        <Modal open onClose={closeSheet} style={SHEET_STYLE}>
          <BoothDetailPanel
            boothId={openBoothId}
            onBack={closeSheet}
            sheetTab={sheetTab}
            setSheetTab={setSheetTab}
            selectedDate={getCurrentFestivalDate()}
          />
        </Modal>
      )}
    </>
  )
}

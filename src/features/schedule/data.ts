// 일정 만들기 결과 & 내 일정(승차권/일정표)에서 공유하는 목업 데이터.
// 아직 전용 백엔드가 없어 화면 구성을 위한 정적 데이터로 유지한다.

/** 승차권 카드 한 장 */
export type Ticket = {
  dateLabel: string; // "2026년 07월 03일(금)"
  seatLabel: string; // "좌석지정권 1매"
  from: string; // "서울"
  to: string; // "부산"
  departTime: string; // "08:00"
  arriveTime: string; // "14:00"
  train: string; // "KTX 111"
  platform: string; // "9번"
  car: string; // "7호차"
  seat: string; // "15A"
  meta: string; // "일반실 · 정방향 · 어른"
  ticketNo: string; // "87399 - 0636 -20266 -55"
  issuedAt: string; // "2026-06-26 22:57:14"
};

/** 일정표 타임라인 한 항목 */
export type TimelineItem = {
  time?: string; // "9:00"
  station: string; // "서울역 승차"
  hasCard?: boolean; // 사진/메모 카드 표시 여부
};

export type TripDay = {
  label: string; // "DAY 01"
  date: string; // "07.03/금"
  ticket: Ticket;
  timeline: TimelineItem[];
};

export type Trip = {
  title: string; // "부산 2박 3일 여행"
  dateRange: string; // "07.03(금) ~ .07.05(일)"
  datePill: string; // "07/03"
  days: TripDay[];
};

/** "일정표에 추가하기" 시 내 일정 탭으로 넘겨지는 샘플 여행 */
export const SAMPLE_TRIP: Trip = {
  title: "부산 2박 3일 여행",
  dateRange: "07.03(금) ~ .07.05(일)",
  datePill: "07/03",
  days: [
    {
      label: "DAY 01",
      date: "07.03/금",
      ticket: {
        dateLabel: "2026년 07월 03일(금)",
        seatLabel: "좌석지정권 1매",
        from: "서울",
        to: "부산",
        departTime: "08:00",
        arriveTime: "14:00",
        train: "KTX 111",
        platform: "9번",
        car: "7호차",
        seat: "15A",
        meta: "일반실 · 정방향 · 어른",
        ticketNo: "87399 - 0636 -20266 -55",
        issuedAt: "2026-06-26 22:57:14",
      },
      timeline: [{ time: "9:00", station: "서울역 승차", hasCard: true }],
    },
    {
      label: "DAY 02",
      date: "07.04/토",
      ticket: {
        dateLabel: "2026년 07월 04일(토)",
        seatLabel: "좌석지정권 1매",
        from: "부산",
        to: "경주",
        departTime: "10:20",
        arriveTime: "10:50",
        train: "KTX 213",
        platform: "3번",
        car: "4호차",
        seat: "8C",
        meta: "일반실 · 정방향 · 어른",
        ticketNo: "87400 - 0712 -20267 -12",
        issuedAt: "2026-06-26 22:57:14",
      },
      timeline: [{ time: "10:00", station: "부산역 승차", hasCard: true }],
    },
  ],
};

/** 일정 만들기 결과 화면(상세 타임라인) 목업 */
export type ItineraryStep =
  | { kind: "board"; station: string; time: string; move: string }
  | { kind: "alight"; station: string }
  | { kind: "place"; name: string; address: string; walk: string };

export const RESULT_ITINERARY = {
  totalHours: "9",
  totalMinutes: "18",
  timeRange: "오전 9:00 - 오후 18:00",
  baseline: "오전 9:00 기준",
  // 슬라이더 마커 (left: 0~1 비율)
  markers: [
    { station: "대전역", duration: "54분", left: 0.22 },
    { station: "부산역", duration: "1시간", left: 0.58 },
  ],
  steps: [
    {
      kind: "board",
      station: "서울역 승차",
      time: "9:00",
      move: "9개 역 이동",
    },
    { kind: "alight", station: "대전역 하차" },
    {
      kind: "place",
      name: "프라페 파스타",
      address: "대전광역시 도청로 40",
      walk: "도보 203m",
    },
  ] as ItineraryStep[],
  moveDuration: "54분",
  walkDuration: "4분",
};

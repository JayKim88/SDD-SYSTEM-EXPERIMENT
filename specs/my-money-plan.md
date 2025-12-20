# My Money Plan - 개인 자산관리 서비스

> 나만을 위한 스마트 자산관리 플랫폼

현재와 미래의 자산을 체계적으로 관리하고, 재무 목표를 달성하기 위한 개인 맞춤형 서비스입니다.

---

## 프로젝트 정보

**프로젝트명**: My Money Plan
**목적**: 개인 자산의 현황 파악 및 미래 계획 수립
**주요 사용자**: 본인 (1인 사용)

---

## 핵심 기능

### 1. 자산 현황 대시보드
- 총 자산 조회 (실시간)
- 카테고리별 자산 분포 (입출금, 저축, 주식, 암호화폐)
- 자산 변동 추이 그래프 (일별, 주별, 월별, 연별)
- 순자산 계산 (자산 - 부채)

### 2. 수입 관리
- 월급 등록 (금액, 지급일)
- 기타 수입 등록 (프리랜싱, 부수입 등)
- 월별 수입 통계
- 연간 수입 예측

### 3. 지출 관리
- 고정 지출 관리 (월세, 통신비, 보험료 등)
- 변동 지출 기록 (식비, 교통비, 문화생활 등)
- 카테고리별 지출 분석
- 예산 대비 실제 지출 비교
- 지출 알림 (예산 초과 시)

### 4. 저축 관리
- 저축 목표 설정 (단기/중기/장기)
- 자동 이체 스케줄 관리
- 저축률 추적 (월별, 연별)
- 목표 달성률 시각화

### 5. 투자 포트폴리오
- 주식 투자 현황
  - 보유 종목 리스트
  - 평가 손익
  - 수익률
- 암호화폐 투자 현황
  - 보유 코인 리스트
  - 평가 손익
  - 수익률
- 포트폴리오 분산도 (자산 배분)
- 투자 성과 분석

### 6. 재무 계획
- 월별 자산 증감 예측
- 목표 자산 시뮬레이션
- 은퇴 계획 (N년 후 목표 자산)
- 비상금 추천 (월 지출의 3-6개월)

### 7. 리포트 & 인사이트
- 월간 재무 리포트
- 연간 재무 리포트
- 전월 대비 증감률
- AI 기반 재무 조언

---

## 데이터 모델

> **모델 설계 전략**:
> - `Transaction`: 통합 거래 모델 (수입, 지출, 이체, 투자 모두 포함)
> - `Income`, `Expense`: Transaction의 부분집합 (편의를 위한 뷰 또는 별도 테이블)
> - 실제 구현 시 Transaction 하나로 통합하거나, 별도 테이블로 유지 가능

### User (사용자)
- id: string (UUID)
- name: string
- email: string
- salaryDay: number (월급날, 1-31)
- createdAt: Date

### Asset (자산)
- id: string (UUID)
- userId: string
- type: AssetType (checking, savings, stock, crypto)
- name: string (예: "KB국민은행 입출금", "삼성전자", "비트코인")
- currency: string (KRW, USD, BTC 등)
- lastUpdated: Date
- createdAt: Date
- updatedAt: Date

**투자 상품 전용 필드** (주식, 암호화폐):
- quantity?: number (수량)
- averagePrice?: number (평균 매수가)
- currentPrice?: number (현재가)

**현금성 자산 전용 필드** (입출금, 저축):
- balance?: number (잔액)

**계산 필드** (API에서 반환):
- currentValue: number (평가액 = quantity × currentPrice 또는 balance)
- profitLoss?: number (평가손익 = currentValue - (quantity × averagePrice))
- profitLossRate?: number (수익률 % = profitLoss / (quantity × averagePrice) × 100)

### Income (수입)
- id: string (UUID)
- userId: string
- type: IncomeType (salary, side, bonus, other)
- amount: number
- description: string
- date: Date
- isRecurring: boolean (정기 수입 여부)
- recurringDay?: number (정기 수입일, 1-31)

### Expense (지출)
- id: string (UUID)
- userId: string
- category: ExpenseCategory (housing, food, transport, culture, etc)
- amount: number
- description: string
- date: Date
- isFixed: boolean (고정 지출 여부)

### Budget (예산)
- id: string (UUID)
- userId: string
- category: ExpenseCategory
- monthlyLimit: number
- year: number
- month: number
- createdAt: Date
- updatedAt: Date

### SavingGoal (저축 목표)
- id: string (UUID)
- userId: string
- name: string (예: "비상금", "자동차 구매")
- targetAmount: number
- currentAmount: number
- deadline: Date
- priority: number (1-5)
- createdAt: Date
- updatedAt: Date

### Transaction (거래 내역 - 통합 모델)
- id: string (UUID)
- userId: string
- type: TransactionType (income, expense, transfer, investment)
- amount: number
- description: string
- date: Date
- createdAt: Date
- updatedAt: Date

**수입/지출 관련 필드**:
- category?: string (ExpenseCategory 또는 IncomeType)
- isFixed?: boolean (고정 지출/수입 여부)
- isRecurring?: boolean (정기 수입/지출 여부)
- recurringDay?: number (정기 수입/지출일, 1-31)

**자산 관련 필드**:
- assetId?: string (관련 자산 - 이체, 투자 시)
- fromAssetId?: string (이체 시 출발 자산)
- toAssetId?: string (이체 시 도착 자산)

> **구현 옵션**:
> 1. Transaction만 사용 (권장): 모든 거래를 하나의 테이블에 저장, type으로 구분
> 2. Income/Expense 별도: Transaction은 이체/투자만, Income/Expense는 별도 테이블

---

## Enum 타입

### AssetType
- checking (입출금 계좌)
- savings (저축)
- stock (주식)
- crypto (암호화폐)
- realEstate (부동산)
- other (기타)

### IncomeType
- salary (월급)
- side (부수입)
- bonus (보너스)
- investment (투자 수익)
- other (기타)

### ExpenseCategory
- housing (주거비: 월세, 관리비)
- food (식비)
- transport (교통비)
- culture (문화생활)
- shopping (쇼핑)
- health (의료/건강)
- education (교육)
- insurance (보험)
- communication (통신비)
- utility (공과금)
- subscription (구독료)
- other (기타)

### TransactionType
- income (수입)
- expense (지출)
- transfer (이체)
- investment (투자)

---

## API 엔드포인트

### 자산 관리
- `GET /api/assets` - 전체 자산 조회
- `GET /api/assets/summary` - 자산 요약 (총액, 카테고리별)
- `POST /api/assets` - 자산 등록
- `PATCH /api/assets/[id]` - 자산 수정
- `DELETE /api/assets/[id]` - 자산 삭제

### 수입 관리
- `GET /api/income` - 수입 내역 조회
- `GET /api/income/monthly?year=2025&month=12` - 월별 수입
- `POST /api/income` - 수입 등록
- `PATCH /api/income/[id]` - 수입 수정
- `DELETE /api/income/[id]` - 수입 삭제

### 지출 관리
- `GET /api/expenses` - 지출 내역 조회
- `GET /api/expenses/monthly?year=2025&month=12` - 월별 지출
- `GET /api/expenses/category` - 카테고리별 지출
- `POST /api/expenses` - 지출 등록
- `PATCH /api/expenses/[id]` - 지출 수정
- `DELETE /api/expenses/[id]` - 지출 삭제

### 예산 관리
- `GET /api/budgets?year=2025&month=12` - 예산 조회
- `POST /api/budgets` - 예산 설정
- `PATCH /api/budgets/[id]` - 예산 수정
- `DELETE /api/budgets/[id]` - 예산 삭제
- `GET /api/budgets/status` - 예산 대비 지출 현황

### 저축 목표
- `GET /api/goals` - 저축 목표 조회
- `POST /api/goals` - 목표 생성
- `PATCH /api/goals/[id]` - 목표 수정
- `PATCH /api/goals/[id]/progress` - 진행률 업데이트
- `DELETE /api/goals/[id]` - 목표 삭제

### 거래 내역
- `GET /api/transactions` - 전체 거래 조회
- `GET /api/transactions?from=2025-01-01&to=2025-12-31` - 기간별 조회
- `POST /api/transactions` - 거래 등록
- `PATCH /api/transactions/[id]` - 거래 수정
- `DELETE /api/transactions/[id]` - 거래 삭제

### 투자 관리
- `GET /api/investments` - 전체 투자 포트폴리오 조회 (주식 + 암호화폐)
- `GET /api/investments/stocks` - 주식 포트폴리오
- `GET /api/investments/crypto` - 암호화폐 포트폴리오
- `GET /api/investments/performance` - 투자 성과 (수익률, 손익)
- `GET /api/investments/allocation` - 자산 배분 (주식 vs 암호화폐 비율)

### 리포트
- `GET /api/reports/monthly?year=2025&month=12` - 월간 재무 리포트
- `GET /api/reports/annual?year=2025` - 연간 재무 리포트
- `GET /api/reports/category-analysis` - 카테고리별 분석
- `GET /api/reports/savings-rate` - 저축률 통계
- `POST /api/reports/export` - PDF/Excel 내보내기

### 대시보드
- `GET /api/dashboard/overview` - 전체 요약
- `GET /api/dashboard/trends` - 자산 변동 추이
- `GET /api/dashboard/monthly-report` - 월간 리포트
- `GET /api/dashboard/projection` - 미래 예측

### 사용자 설정
- `GET /api/user/settings` - 사용자 설정 조회
- `PATCH /api/user/settings` - 설정 수정 (월급일, 알림 등)
- `GET /api/user/profile` - 프로필 조회
- `PATCH /api/user/profile` - 프로필 수정

---

## 시각화 차트 목록

### 대시보드 차트
1. **총 자산 추이 라인 차트** (`@visx/shape`, `@visx/axis`)
   - X축: 날짜 (일/주/월/년 선택 가능)
   - Y축: 총 자산 금액
   - 인터랙티브: 툴팁 (날짜, 금액), 줌/팬
   - 데이터: `/api/dashboard/trends`

2. **자산 분포 도넛 차트** (`@visx/shape`)
   - 카테고리: 입출금, 저축, 주식, 암호화폐
   - 중앙: 총 자산 금액
   - 인터랙티브: 호버 시 금액/비율 표시
   - 데이터: `/api/assets/summary`

3. **월간 수입/지출 바 차트** (`@visx/shape`, `@visx/group`)
   - X축: 월 (최근 12개월)
   - Y축: 금액
   - 두 개 바: 수입 (파란색), 지출 (빨간색)
   - 인터랙티브: 클릭 시 월별 상세 페이지 이동
   - 데이터: `/api/dashboard/monthly-report`

4. **저축률 영역 차트** (`@visx/shape`)
   - X축: 월
   - Y축: 저축률 (%)
   - 목표선 표시 (예: 50%)
   - 데이터: `/api/dashboard/trends`

### 지출 분석 차트
5. **카테고리별 지출 파이 차트** (`@visx/shape`)
   - 카테고리: 주거비, 식비, 교통비, 문화생활 등
   - 데이터: `/api/expenses/category`

6. **예산 대비 지출 프로그레스 바** (Custom SVG)
   - 카테고리별 프로그레스 바
   - 색상: 초록(여유), 노랑(80% 이상), 빨강(초과)
   - 데이터: `/api/budgets/status`

7. **지출 추이 히트맵** (`@visx/heatmap`)
   - X축: 요일
   - Y축: 시간대
   - 색상 강도: 지출 빈도
   - 데이터: `/api/expenses`

### 투자 차트
8. **포트폴리오 성과 라인 차트** (`@visx/shape`)
   - 여러 라인: 주식, 암호화폐, 총 자산
   - Y축: 수익률 (%)
   - 데이터: `/api/investments`

9. **자산 배분 트리맵** (`@visx/hierarchy`)
   - 계층: 자산 유형 > 개별 자산
   - 크기: 평가액
   - 색상: 수익률 (빨강-초록 스펙트럼)
   - 데이터: `/api/assets`

### 미래 예측 차트
10. **자산 시뮬레이션 차트** (`@visx/shape`, `@visx/annotation`)
    - 실선: 현재 추세 기반 예측
    - 점선: 시나리오별 예측 (저축률 변경 시)
    - 밴드: 불확실성 범위
    - 목표선 표시
    - 데이터: `/api/dashboard/projection`

11. **목표 달성 타임라인** (`@visx/shape`)
    - 저축 목표별 진행 상황
    - 예상 달성일 표시
    - 데이터: `/api/goals`

### 리포트 차트
12. **연간 재무 요약 대시보드** (복합 차트)
    - 수입/지출/저축 트렌드
    - 월별 비교 바 차트
    - 전년 대비 증감률
    - 데이터: `/api/reports`

---

## UI 패턴 및 컴포넌트

### 카드 컴포넌트
- **요약 카드**: 총 자산, 이번 달 수입/지출, 저축률 등
- **목표 카드**: 저축 목표별 진행률 (프로그레스 바 + 텍스트)
- **자산 카드**: 자산별 간단한 정보 (아이콘 + 이름 + 금액)

### 리스트/타임라인
- **거래 내역**: 타임라인 형태 (날짜 그룹핑)
  - 아이콘 + 설명 + 금액 + 카테고리 태그
  - 무한 스크롤
  - 필터 (날짜 범위, 카테고리, 타입)

- **자산 목록**: 카드/리스트 토글
  - 카테고리별 탭 (입출금, 저축, 주식, 암호화폐)

### 데이터 테이블
- **투자 포트폴리오 테이블** (TanStack Table)
  - 컬럼: 종목명, 수량, 평균단가, 현재가, 평가금액, 수익률
  - 기능: 정렬 (수익률, 금액), 검색
  - 모바일: 카드 형태로 전환

- **거래 상세 검색 테이블** (선택적)
  - 고급 필터 (날짜, 금액 범위, 카테고리, 키워드)
  - CSV 내보내기 버튼

### 폼
- **빠른 입력 폼**: 지출/수입 등록 (모달 또는 슬라이드 업)
- **자산 추가/수정 폼**: 단계별 폼 (타입 선택 → 상세 정보)

### 인터랙티브 요소
- **툴팁**: 차트 호버 시 상세 정보
- **드릴다운**: 차트 클릭 시 상세 페이지 이동
- **필터**: 날짜 범위, 카테고리 선택
- **토글**: 기간 선택 (일/주/월/년), 뷰 타입 (차트/테이블)

---

## 페이지 구성

### 1. 대시보드 (`/`) - **시각화 중심**

**레이아웃**: 2열 그리드

**상단 요약 카드** (4개):
- 총 자산 (큰 숫자 + 전월 대비 증감)
- 이번 달 수입 (아이콘 + 금액)
- 이번 달 지출 (아이콘 + 금액)
- 저축률 (% + 프로그레스 서클)

**메인 차트** (3개):
1. 총 자산 추이 라인 차트 (큰 차트, 전체 너비)
   - 기간 토글: 1주/1개월/3개월/1년/전체
2. 자산 분포 도넛 차트 (좌측)
   - 호버: 금액/비율 표시
3. 월간 수입/지출 바 차트 (우측)
   - 최근 12개월

**하단**:
- 다가오는 고정 지출 (카드 3개)
- 저축 목표 진행률 (미니 프로그레스 바 3개)

### 2. 자산 관리 (`/assets`) - **카드 + 차트**

**상단**:
- 총 자산 요약 카드
- 자산 배분 트리맵 차트 (크기: 평가액, 색상: 수익률)

**자산 목록**:
- 카테고리별 탭 (입출금, 저축, 주식, 암호화폐)
- 카드 그리드 형태
  - 아이콘 + 자산명 + 금액 + 수익률(투자 상품)
- 클릭 시 상세 모달

**액션**:
- FAB 버튼: 자산 추가

### 3. 수입/지출 (`/transactions`) - **타임라인 + 차트**

**상단**:
- 기간 선택 (날짜 범위 피커)
- 카테고리별 지출 파이 차트 (작은 차트)
- 지출 추이 히트맵 (요일/시간대)

**거래 내역**:
- 타임라인 형태 (날짜별 그룹핑)
  - 날짜 헤더 + 일별 총액
  - 거래 카드: 아이콘 + 설명 + 카테고리 태그 + 금액
- 무한 스크롤
- 필터: 타입(수입/지출), 카테고리, 금액 범위

**액션**:
- FAB 버튼: 빠른 입력 (모달)
- 우측 상단: 상세 검색 (테이블 뷰로 전환)

### 4. 예산 관리 (`/budget`) - **프로그레스 바 + 차트**

**상단 요약**:
- 이번 달 총 예산 vs 실제 지출 (큰 프로그레스 바)
- 남은 예산 (카드)

**카테고리별 예산**:
- 리스트 형태
  - 카테고리명 + 아이콘
  - 예산 금액 / 사용 금액
  - 프로그레스 바 (색상: 초록/노랑/빨강)
  - 클릭 시 월별 상세 차트

**하단**:
- 예산 초과 경고 (있을 경우)
- 월간 예산 사용 추이 바 차트

**액션**:
- 예산 설정/수정 버튼

### 5. 저축 목표 (`/goals`) - **카드 + 타임라인 차트**

**목표 카드 그리드**:
- 목표별 카드 (우선순위 순)
  - 목표명 + 아이콘
  - 현재 금액 / 목표 금액
  - 프로그레스 바 + %
  - 예상 달성일 (날짜 + D-day)
  - 클릭 시 상세 모달

**상단**:
- 목표 달성 타임라인 차트
  - 목표별 진행 상황 시각화

**액션**:
- 목표 추가 버튼

### 6. 투자 (`/investments`) - **테이블 + 차트**

**상단 요약**:
- 총 평가액 / 총 수익률 (카드)
- 포트폴리오 성과 라인 차트 (주식/암호화폐/전체)

**주식 포트폴리오**:
- **테이블** (TanStack Table)
  - 컬럼: 종목명, 수량, 평균단가, 현재가, 평가금액, 수익률
  - 정렬: 수익률순, 금액순
  - 검색: 종목명
  - 모바일: 카드 뷰로 전환

**암호화폐 포트폴리오**:
- **테이블** (동일 구조)

**하단**:
- 자산 배분 도넛 차트 (주식 vs 암호화폐)

### 7. 리포트 (`/reports`) - **차트 중심 대시보드**

**기간 선택**: 월간 / 연간

**월간 리포트**:
1. 수입/지출/저축 요약 카드 (3개)
2. 전월 대비 증감률 (화살표 + %)
3. 카테고리별 지출 파이 차트
4. 주간 지출 추이 라인 차트
5. 저축률 프로그레스 바

**연간 리포트**:
1. 연간 수입/지출/저축 합계 (카드)
2. 월별 비교 바 차트 (12개월)
3. 카테고리별 연간 지출 분석
4. 자산 증가 추이 라인 차트
5. 저축률 통계 (평균, 최고, 최저)

**액션**:
- PDF/Excel 내보내기 버튼

### 8. 미래 예측 (`/projection`) - **시뮬레이션 차트**

**시나리오 설정**:
- 월 저축액 슬라이더
- 투자 수익률 입력 (%)
- 목표 자산 입력

**차트**:
1. 자산 시뮬레이션 차트 (큰 차트)
   - 실선: 현재 추세
   - 점선: 시나리오별 예측
   - 밴드: 불확실성 범위
   - 목표선
2. 은퇴 계획 차트
   - N년 후 예상 자산

**하단**:
- 시나리오 비교 카드 (최대 3개)

### 9. 설정 (`/settings`)
- 프로필 설정
- 월급일 설정
- 알림 설정
- 데이터 백업/복원
- API 연동 관리

---

## 초기 데이터 (Seed Data - Mock)

### 사용자
```typescript
{
  name: "사용자",
  email: "user@example.com",
  salaryDay: 25  // 매월 25일
}
```

### 자산 (Mock 데이터)
```typescript
[
  {
    type: "checking",
    name: "KB국민은행 입출금",
    amount: 5000000,
    currency: "KRW"
  },
  {
    type: "savings",
    name: "신한은행 정기적금",
    amount: 10000000,
    currency: "KRW"
  },
  {
    type: "stock",
    name: "주식 포트폴리오",
    currentValue: 8000000,
    purchaseValue: 7500000,  // 수익률 +6.7%
    currency: "KRW"
  },
  {
    type: "crypto",
    name: "암호화폐 포트폴리오",
    currentValue: 5000000,
    purchaseValue: 4500000,  // 수익률 +11.1%
    currency: "KRW"
  }
]
// 총 자산: 28,000,000원
```

### 정기 수입
```typescript
{
  type: "salary",
  amount: 5000000,
  description: "월급 (실수령액)",
  isRecurring: true,
  recurringDay: 25
}
```

### 고정 지출 (Mock)
```typescript
[
  {
    category: "housing",
    amount: 700000,
    description: "월세",
    isFixed: true
  },
  {
    category: "communication",
    amount: 80000,
    description: "통신비 (인터넷 + 휴대폰)",
    isFixed: true
  },
  {
    category: "subscription",
    amount: 50000,
    description: "구독 서비스 (넷플릭스, 유튜브 프리미엄 등)",
    isFixed: true
  },
  {
    category: "insurance",
    amount: 150000,
    description: "보험료",
    isFixed: true
  },
  {
    category: "utility",
    amount: 100000,
    description: "공과금 (전기, 수도, 가스)",
    isFixed: true
  }
]
// 총 고정 지출: 1,080,000원
```

### 변동 지출 (월평균 Mock)
```typescript
[
  {
    category: "food",
    amount: 400000,
    description: "식비"
  },
  {
    category: "transport",
    amount: 150000,
    description: "교통비"
  },
  {
    category: "culture",
    amount: 200000,
    description: "문화생활"
  },
  {
    category: "shopping",
    amount: 150000,
    description: "쇼핑"
  },
  {
    category: "other",
    amount: 100000,
    description: "기타"
  }
]
// 총 변동 지출: 1,000,000원
// 전체 월 지출: 2,080,000원
```

### 저축 목표 (Mock)
```typescript
[
  {
    name: "비상금",
    targetAmount: 10000000,
    currentAmount: 5000000,
    deadline: "2026-06-30",
    priority: 1
  },
  {
    name: "자동차 구매",
    targetAmount: 30000000,
    currentAmount: 8000000,
    deadline: "2027-12-31",
    priority: 2
  },
  {
    name: "해외여행",
    targetAmount: 5000000,
    currentAmount: 2000000,
    deadline: "2026-12-31",
    priority: 3
  }
]
```

### 월간 재무 요약 (Mock)
```typescript
{
  month: "2025-12",
  income: {
    salary: 5000000,
    side: 0,
    total: 5000000
  },
  expense: {
    fixed: 1080000,
    variable: 1000000,
    total: 2080000
  },
  savings: 2920000,  // 수입 - 지출
  savingsRate: 58.4  // (저축 / 수입) * 100
}
```

---

## 기술 스택

### Frontend

**핵심 프레임워크**:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

**시각화**:
- **Visx** (차트 및 시각화 - Airbnb의 D3 + React 라이브러리)
  - `@visx/shape` - 기본 도형 (라인, 바, 도넛, 파이 등)
  - `@visx/axis` - 축 렌더링
  - `@visx/scale` - 스케일 (선형, 시간, 범주형)
  - `@visx/tooltip` - 툴팁
  - `@visx/grid` - 그리드 라인
  - `@visx/group` - SVG 그룹핑
  - `@visx/gradient` - 그라디언트
  - `@visx/annotation` - 주석 (목표선, 레이블 등)
  - `@visx/hierarchy` - 트리맵, 트리 구조 차트
  - `@visx/heatmap` - 히트맵
  - `@visx/responsive` - 반응형 차트

**UI 컴포넌트**:
- Shadcn UI (컴포넌트)
- TanStack Table v8 (데이터 테이블 - 투자 포트폴리오용)

**상태 관리 & 데이터 페칭** (필수):
- **TanStack Query (React Query) v5**
  - **이유**: 서버 상태 관리 및 캐싱으로 API 호출 최적화
  - **사용 사례**:
    - 암호화폐 시세 자동 리프레시 (30초마다)
    - 대시보드 데이터 캐싱 (불필요한 API 호출 방지)
    - Optimistic Updates (빠른 UI 반응)
    - 무한 스크롤 (거래 내역 페이지)
  - **필수 이유**: API 연동이 많고 실시간 데이터 업데이트가 필요하므로 캐싱과 자동 리페칭이 필수

**폼 & 검증** (필수):
- **react-hook-form v7**
  - **이유**: 성능 최적화된 폼 처리 (uncontrolled)
  - **사용 사례**:
    - 자산 추가/수정 폼
    - 거래 빠른 입력 폼
    - 예산 설정 폼
    - 저축 목표 폼
  - **필수 이유**: 복잡한 폼이 많고 TypeScript 통합이 우수하여 개발 생산성 향상

- **Zod v3**
  - **이유**: TypeScript 기반 스키마 검증 및 타입 추론
  - **사용 사례**:
    - API 요청/응답 검증
    - 폼 데이터 검증 (react-hook-form과 통합)
    - Prisma 스키마와 타입 일치 확인
    - 환경 변수 검증
  - **필수 이유**: 금융 데이터의 정확성이 중요하므로 런타임 검증 필수

**알림**:
- **react-hot-toast v2**
  - **이유**: 간단하고 가벼운 토스트 알림
  - **사용 사례**:
    - 거래 등록 성공/실패 알림
    - 예산 초과 경고
    - API 동기화 완료 알림
    - 에러 메시지 표시
  - **필수 이유**: 사용자 피드백이 중요하고 설정이 간단함

**유틸리티**:
- date-fns (날짜 처리)

### Backend

**API & ORM**:
- Next.js API Routes
- Prisma ORM
- PostgreSQL

**캐싱 & 성능** (강력 추천):
- **Upstash Redis**
  - **이유**: Serverless Redis로 Vercel과 완벽 통합
  - **사용 사례**:
    - API 응답 캐싱 (오픈뱅킹, 암호화폐 시세)
    - Rate limiting (API 호출 제한 - 1분당 10회)
    - 세션 저장
    - 계산 결과 캐싱 (수익률, 예측 등)
  - **추천 이유**:
    - 외부 API 호출 비용 절감
    - 응답 속도 개선 (캐시 히트 시 밀리초 단위)
    - Vercel 무료 티어 제공

**백그라운드 작업** (강력 추천):
- **BullMQ v4**
  - **이유**: Redis 기반 큐 시스템
  - **사용 사례**:
    - 자동 동기화 스케줄 (매일 자정 은행 계좌)
    - 주식 시세 업데이트 (장 마감 후)
    - 암호화폐 시세 업데이트 (매시간)
    - 재시도 로직 (API 실패 시)
  - **추천 이유**:
    - Cron Job보다 강력한 스케줄링
    - 실패 시 자동 재시도
    - 작업 진행 상황 추적
    - API 호출을 백그라운드로 이동하여 사용자 경험 개선

- **ioredis v5**
  - **이유**: BullMQ를 위한 Redis 클라이언트
  - **추천 이유**: BullMQ와 함께 사용 필수

### 보안

**인증**:
- NextAuth.js (선택사항, 개인용이므로 간단한 비밀번호도 가능)

**암호화** (강력 추천):
- **bcrypt v5**
  - **이유**: 비밀번호 해싱 (단방향 암호화)
  - **사용 사례**:
    - 로그인 비밀번호 해싱
    - 개인용이지만 보안 강화
  - **추천 이유**: 금융 데이터 보호를 위한 기본 보안 필수

- **crypto (Node.js 내장)**
  - **이유**: API 키 암호화 (AES-256)
  - **사용 사례**:
    - 오픈뱅킹 Access Token 암호화
    - 증권사 API Key 암호화
    - 암호화폐 거래소 API Secret 암호화
  - **필수 이유**: 민감한 API 키를 DB에 저장하므로 암호화 필수

### 개발 도구

- **@tanstack/react-query-devtools** (개발 환경)
  - **이유**: React Query 상태 디버깅
  - 캐시 상태 확인, API 호출 추적

---

## 패키지 의존성 (package.json)

### 핵심 의존성
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",

    "@prisma/client": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-table": "^8.0.0",
    "@upstash/redis": "^1.28.0",

    "@visx/axis": "^3.0.0",
    "@visx/shape": "^3.0.0",
    "@visx/scale": "^3.0.0",
    "@visx/tooltip": "^3.0.0",
    "@visx/grid": "^3.0.0",
    "@visx/group": "^3.0.0",
    "@visx/gradient": "^3.0.0",
    "@visx/annotation": "^3.0.0",
    "@visx/hierarchy": "^3.0.0",
    "@visx/heatmap": "^3.0.0",
    "@visx/responsive": "^3.0.0",

    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",

    "react-hot-toast": "^2.4.0",
    "date-fns": "^3.0.0",

    "bullmq": "^4.15.0",
    "ioredis": "^5.3.0",
    "bcrypt": "^5.1.0",

    "next-auth": "^4.24.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/bcrypt": "^5.0.0",
    "prisma": "^5.0.0"
  }
}
```

### 설치 명령어
```bash
# 필수 의존성
npm install @tanstack/react-query @tanstack/react-table
npm install react-hook-form @hookform/resolvers zod
npm install react-hot-toast date-fns

# Visx (차트)
npm install @visx/axis @visx/shape @visx/scale @visx/tooltip @visx/grid @visx/group @visx/gradient @visx/annotation @visx/hierarchy @visx/heatmap @visx/responsive

# 강력 추천 (백엔드)
npm install @upstash/redis bullmq ioredis bcrypt

# 개발 도구
npm install -D @tanstack/react-query-devtools
```

---

## 외부 API 연동 (실제 데이터 자동 수집)

### 1. 오픈뱅킹 API (금융결제원)

**기능**: 은행 계좌 잔액 및 거래내역 자동 조회

**연동 방법**:
```typescript
// API: https://openapi.openbanking.or.kr
// 필요: 사용자 동의, Access Token

// 계좌 잔액 조회
GET /v2.0/account/balance/fin_num

// 거래 내역 조회
GET /v2.0/account/transaction_list/fin_num
```

**수집 데이터**:
- 입출금 계좌 잔액
- 예금/적금 잔액
- 거래 내역 (입금, 출금, 이체)
- 거래 일시, 금액, 거래처

**자동화**:
- 매일 자정 잔액 자동 업데이트
- 새로운 거래 자동 분류 및 저장
- 지출 카테고리 AI 자동 분류

---

### 2. 증권사 API (주식 투자)

**지원 증권사**:
- 한국투자증권 (KIS Developers)
- 키움증권 (OpenAPI)
- 이베스트투자증권 (xingAPI)
- NH투자증권

**연동 방법 (한국투자증권 예시)**:
```typescript
// API: https://apiportal.koreainvestment.com

// 보유 주식 조회
GET /uapi/domestic-stock/v1/trading/inquire-balance

// 주식 현재가
GET /uapi/domestic-stock/v1/quotations/inquire-price
```

**수집 데이터**:
- 보유 종목 리스트 (종목명, 수량, 평균 단가)
- 현재 평가 금액
- 평가 손익 (금액, 수익률)
- 실현 손익
- 배당금

**자동화**:
- 장 마감 후 일일 평가액 업데이트
- 종목별 수익률 계산
- 포트폴리오 분산도 자동 계산

---

### 3. 암호화폐 거래소 API

**지원 거래소**:
- 업비트 (Upbit)
- 빗썸 (Bithumb)
- 코인원 (Coinone)

**연동 방법 (업비트 예시)**:
```typescript
// API: https://docs.upbit.com

// 전체 계좌 조회
GET /v1/accounts

// 주문 가능 정보
GET /v1/orders/chance

// 시세 조회
GET /v1/ticker
```

**수집 데이터**:
- 보유 코인 목록 (코인명, 수량)
- 평균 매수가
- 현재 시세
- 평가 금액
- 평가 손익

**자동화**:
- 실시간 또는 주기적 시세 업데이트
- 코인별 수익률 계산
- 총 자산 평가액 실시간 반영

---

### 4. 카드사 API (지출 자동 수집)

**지원 카드사**:
- 신한카드
- 삼성카드
- KB국민카드
- 현대카드

**연동 방법**:
```typescript
// 카드 승인 내역 조회
GET /card/approval-list

// 청구 예정 금액
GET /card/billing-amount
```

**수집 데이터**:
- 카드 사용 내역 (일시, 금액, 가맹점)
- 할부 정보
- 청구 예정 금액
- 포인트/마일리지

**자동화**:
- 카드 사용 시 자동으로 지출 기록
- 가맹점 정보로 카테고리 자동 분류
- 청구 금액 알림

---

### 5. API 연동 데이터 모델 확장

기존 모델에 API 연동 정보 추가:

```typescript
// 계좌 연동 정보
interface BankConnection {
  id: string;
  userId: string;
  bankName: string;        // 은행명
  accountNumber: string;   // 계좌번호 (마스킹)
  apiProvider: 'openbanking' | 'manual';
  accessToken?: string;    // API Access Token (암호화)
  refreshToken?: string;   // Refresh Token (암호화)
  lastSynced: Date;        // 마지막 동기화 시각
  autoSync: boolean;       // 자동 동기화 여부
  syncInterval: number;    // 동기화 주기 (분)
}

// 증권 연동 정보
interface StockConnection {
  id: string;
  userId: string;
  brokerName: string;      // 증권사명
  apiProvider: 'kis' | 'kiwoom' | 'manual';
  apiKey?: string;         // API Key (암호화)
  apiSecret?: string;      // API Secret (암호화)
  accountNumber: string;   // 계좌번호 (마스킹)
  lastSynced: Date;
  autoSync: boolean;
}

// 암호화폐 거래소 연동
interface CryptoConnection {
  id: string;
  userId: string;
  exchangeName: string;    // 거래소명
  apiProvider: 'upbit' | 'bithumb' | 'manual';
  apiKey?: string;         // API Key (암호화)
  apiSecret?: string;      // API Secret (암호화)
  lastSynced: Date;
  autoSync: boolean;
}
```

---

### 6. API 연동 UI/UX

**설정 페이지** (`/settings/integrations`):

1. **은행 계좌 연동**
   - 오픈뱅킹 인증 버튼
   - 연동된 계좌 리스트
   - 자동 동기화 on/off
   - 마지막 동기화 시각

2. **증권사 연동**
   - API Key 입력 폼
   - 계좌번호 입력
   - 연동 테스트 버튼
   - 동기화 주기 설정

3. **암호화폐 거래소 연동**
   - 거래소 선택
   - API Key/Secret 입력
   - Read-only 권한 확인

4. **수동 동기화 버튼**
   - 즉시 데이터 가져오기
   - 진행률 표시
   - 성공/실패 알림

---

### 7. API 연동 보안

**필수 보안 조치**:
```typescript
// 1. API 키 암호화 저장 (AES-256-CBC)
import crypto from 'crypto';

// 암호화 (AES-256 requires 32 bytes key)
const encrypt = (text: string, key: string) => {
  const iv = crypto.randomBytes(16); // 초기화 벡터
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'), // 32 bytes (64 hex characters)
    iv
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted; // IV와 암호문 함께 저장
};

// 복호화
const decrypt = (encryptedText: string, key: string) => {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    iv
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// 2. 환경 변수로 암호화 키 관리
// ENCRYPTION_KEY는 32 bytes = 64 hex characters
// 생성: crypto.randomBytes(32).toString('hex')
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 64자 hex string

// 3. HTTPS 필수
// 4. Rate Limiting (API 호출 제한)
// 5. Read-only 권한만 사용
```

**데이터 보호**:
- API Key/Secret은 절대 클라이언트로 전송 금지
- 서버 사이드에서만 API 호출
- 계좌번호 마스킹 표시 (****-**-1234)
- Access Token은 암호화하여 DB 저장

---

### 8. API 연동 엔드포인트

```typescript
// 오픈뱅킹 인증
POST /api/integrations/openbanking/auth
GET  /api/integrations/openbanking/callback

// 계좌 연동
POST /api/integrations/bank/connect
GET  /api/integrations/bank/accounts
POST /api/integrations/bank/sync

// 증권 연동
POST /api/integrations/stock/connect
GET  /api/integrations/stock/portfolio
POST /api/integrations/stock/sync

// 암호화폐 연동
POST /api/integrations/crypto/connect
GET  /api/integrations/crypto/balance
POST /api/integrations/crypto/sync

// 통합 동기화
POST /api/integrations/sync-all
```

---

### 9. 자동 동기화 스케줄

**Cron Job 설정**:
```typescript
// lib/cron/sync-scheduler.ts

// 은행 계좌: 매일 자정
'0 0 * * *'  // 잔액 및 거래내역 동기화

// 주식: 장 마감 후 (오후 4시)
'0 16 * * 1-5'  // 평가액 업데이트

// 암호화폐: 매시간
'0 * * * *'  // 실시간에 가까운 업데이트

// 카드: 매일 오전 6시
'0 6 * * *'  // 전날 사용 내역
```

**수동 동기화**:
- 대시보드에 "새로고침" 버튼
- 즉시 모든 연동 계좌 업데이트
- 진행률 표시 및 완료 알림

---

### 10. 자동 분류 (AI)

API로 수집한 거래 내역을 AI가 자동 분류:

```typescript
// 거래 내역 예시
{
  description: "스타벅스 강남점",
  amount: 5500
}

// AI 자동 분류 결과
{
  category: "food",  // 식비
  subCategory: "cafe",
  merchant: "스타벅스",
  confidence: 0.95
}
```

**학습 데이터**:
- 사용자의 수동 분류 이력
- 가맹점명 패턴
- 금액 범위
- 시간대

---

## 추가 고려사항

### 보안
- 민감한 재무 정보이므로 암호화 필요
- 환경 변수로 DB 접근 제어
- HTTPS 필수

### 데이터 백업
- 주기적 자동 백업
- 수동 백업/복원 기능
- JSON/CSV 내보내기

### 확장 가능성
- 은행 API 연동 (Open Banking)
- 증권사 API 연동
- 자동 지출 분류 (AI)
- 영수증 OCR

### 성능
- 대시보드 데이터 캐싱
- 차트 데이터 최적화
- 무한 스크롤 페이지네이션

---

## 성공 지표

- ✅ 매월 재무 상태 한눈에 파악
- ✅ 예산 초과 방지 (알림)
- ✅ 저축률 20% 이상 달성
- ✅ 투자 수익률 추적
- ✅ 연간 자산 증가 목표 달성

---

## 향후 로드맵

### Phase 1 (MVP - 시각화 기반)
**목표**: 자산 현황을 한눈에 파악할 수 있는 대시보드

- 기본 데이터 모델 (User, Asset, Income, Expense, Transaction)
- **대시보드 페이지**
  - 총 자산 추이 라인 차트
  - 자산 분포 도넛 차트
  - 월간 수입/지출 바 차트
  - 요약 카드 4개
- 자산 관리 페이지 (카드 뷰 + 기본 CRUD)
- 거래 내역 페이지 (타임라인 뷰 + 기본 CRUD)
- Seed 데이터 구현

**예상 개발 기간**: 핵심 기능 우선

### Phase 2 (예산 및 목표 관리)
**목표**: 지출 통제 및 저축 목표 설정

- **예산 관리 페이지**
  - 카테고리별 프로그레스 바
  - 예산 사용 추이 바 차트
  - 예산 초과 알림
- **저축 목표 페이지**
  - 목표 카드 그리드
  - 목표 달성 타임라인 차트
- **지출 분석 강화**
  - 카테고리별 파이 차트
  - 지출 추이 히트맵

### Phase 3 (투자 추적 및 리포트)
**목표**: 투자 성과 분석 및 종합 리포트

- **투자 페이지**
  - 포트폴리오 테이블 (TanStack Table)
  - 성과 라인 차트
  - 자산 배분 트리맵
- **리포트 페이지**
  - 월간/연간 리포트
  - 다양한 분석 차트
  - PDF/Excel 내보내기

### Phase 4 (미래 예측 및 시뮬레이션)
**목표**: 데이터 기반 재무 계획 수립

- **미래 예측 페이지**
  - 자산 시뮬레이션 차트 (불확실성 밴드)
  - 시나리오 비교 (저축률, 수익률 변수)
  - 은퇴 계획 차트
- 목표 자산 달성 예측
- AI 기반 재무 조언 (선택)

### Phase 5 (API 연동 및 자동화)
**목표**: 실제 금융 데이터 자동 수집

- **외부 API 연동**
  - 오픈뱅킹 API (은행 계좌)
  - 암호화폐 거래소 API (Upbit, Bithumb)
  - 증권사 API (선택)
- 자동 동기화 스케줄 (Cron Job)
- 거래 내역 AI 자동 분류
- API 연동 관리 페이지

### Phase 6 (고도화 및 확장)
**목표**: 사용자 경험 개선 및 확장

- 고급 차트 인터랙션 (드릴다운, 크로스 필터)
- 차트 애니메이션
- 다크 모드
- PWA (모바일 친화적)
- 데이터 백업/복원 자동화
- 알림 시스템 (예산 초과, 목표 달성)

# [Financial App Name]

> [Brief description]

## 프로젝트 정보

- **프로젝트명**: [Project Name]
- **목적**: 재무 관리 및 분석
- **주요 사용자**: 개인 사용자

## 핵심 기능

1. 자산 현황 대시보드
2. 수입/지출 관리
3. 예산 관리
4. 저축 목표 설정
5. 투자 포트폴리오 추적
6. 재무 리포트 생성

## 데이터 모델

### User (사용자)
- id: string (UUID)
- name: string
- email: string
- createdAt: Date
- updatedAt: Date

### Account (계좌)
- id: string (UUID)
- userId: string
- name: string (예: "KB국민은행 입출금")
- type: AccountType (checking, savings, investment)
- balance: number
- currency: string (KRW, USD 등)
- createdAt: Date
- updatedAt: Date

### Transaction (거래)
- id: string (UUID)
- userId: string
- accountId: string
- type: TransactionType (income, expense, transfer)
- amount: number
- description: string
- category: string
- date: Date
- createdAt: Date
- updatedAt: Date

### Budget (예산)
- id: string (UUID)
- userId: string
- category: string
- monthlyLimit: number
- year: number
- month: number
- createdAt: Date
- updatedAt: Date

## Enum 타입

### AccountType
- checking (입출금)
- savings (저축)
- investment (투자)

### TransactionType
- income (수입)
- expense (지출)
- transfer (이체)

## API 엔드포인트

### Account Management
- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/[id]` - Get account by ID
- `POST /api/accounts` - Create new account
- `PATCH /api/accounts/[id]` - Update account
- `DELETE /api/accounts/[id]` - Delete account

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD` - Get transactions by date range
- `POST /api/transactions` - Create transaction
- `DELETE /api/transactions/[id]` - Delete transaction

### Budget
- `GET /api/budgets?year=YYYY&month=MM` - Get budgets
- `POST /api/budgets` - Create budget
- `PATCH /api/budgets/[id]` - Update budget
- `DELETE /api/budgets/[id]` - Delete budget

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard summary
- `GET /api/dashboard/trends` - Get asset trends

## 페이지 구성

### 1. Dashboard (`/`)
**Layout**: 2-column grid

**Components**:
- Total balance card
- Income/Expense summary cards
- Balance trend chart (line chart)
- Recent transactions list

### 2. Transactions (`/transactions`)
**Layout**: List view

**Components**:
- Transaction list (with infinite scroll)
- Filter controls (date, category, type)
- Quick add button (FAB)

### 3. Budget (`/budget`)
**Layout**: Grid

**Components**:
- Budget cards by category
- Progress bars
- Budget vs actual comparison

## 기술 스택

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts or Visx (for charts)

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL

### Additional
- React Query (data fetching)
- react-hook-form (forms)
- Zod (validation)

## 초기 데이터 (Seed Data)

```typescript
// User
{
  name: "Test User",
  email: "user@example.com"
}

// Account
{
  userId: "[user-id]",
  name: "Main Checking",
  type: "checking",
  balance: 1000000,
  currency: "KRW"
}
```

## 향후 로드맵

### Phase 1 (MVP)
- Basic account management
- Transaction tracking
- Simple dashboard

### Phase 2
- Budget management
- Savings goals
- Basic reports

### Phase 3
- Investment tracking
- Advanced analytics
- External API integration

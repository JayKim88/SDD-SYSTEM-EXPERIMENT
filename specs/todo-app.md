# Todo App

간단한 할 일 관리 애플리케이션

## 프로젝트 개요

사용자가 할 일을 추가, 완료, 삭제할 수 있는 간단한 Todo 앱입니다.

## 핵심 기능

### 1. Todo 관리
- **Todo 추가**: 새로운 할 일을 추가할 수 있습니다
- **Todo 완료**: 완료된 할 일을 체크할 수 있습니다
- **Todo 삭제**: 할 일을 삭제할 수 있습니다
- **Todo 목록**: 모든 할 일을 목록으로 볼 수 있습니다

### 2. 필터링
- **전체 보기**: 모든 할 일 표시
- **미완료만**: 미완료된 할 일만 표시
- **완료만**: 완료된 할 일만 표시

### 3. 통계
- 전체 할 일 수
- 완료된 할 일 수
- 미완료 할 일 수

## 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API
- **Form**: React Hook Form + Zod

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

### UI Components
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 데이터 모델

### Todo
```typescript
interface Todo {
  id: string;              // UUID
  title: string;           // 할 일 제목
  description?: string;    // 선택적 설명
  completed: boolean;      // 완료 여부
  userId: string;          // 사용자 ID
  createdAt: Date;         // 생성 시간
  updatedAt: Date;         // 수정 시간
}
```

### User
```typescript
interface User {
  id: string;              // UUID
  email: string;           // 이메일
  name?: string;           // 이름 (선택)
  createdAt: Date;         // 생성 시간
}
```

## 페이지 구조

### 인증 페이지
- `/login` - 로그인 페이지
- `/signup` - 회원가입 페이지

### 메인 페이지
- `/` - 랜딩 페이지 (비로그인 시)
- `/dashboard` - Todo 대시보드 (로그인 시)

## API 엔드포인트

### Todo API
- `GET /api/todos` - Todo 목록 조회
- `POST /api/todos` - Todo 생성
- `PATCH /api/todos/[id]` - Todo 수정
- `DELETE /api/todos/[id]` - Todo 삭제

### Auth API
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃

## 주요 컴포넌트

### UI Components
- `Button` - 버튼 컴포넌트
- `Input` - 입력 필드
- `Card` - 카드 컨테이너
- `Modal` - 모달 다이얼로그
- `Loading` - 로딩 스피너

### Feature Components
- `TodoList` - Todo 목록 표시
- `TodoItem` - 개별 Todo 아이템
- `TodoForm` - Todo 추가/수정 폼
- `TodoFilters` - 필터 버튼 그룹
- `TodoStats` - 통계 카드

### Layout Components
- `Header` - 헤더 (로고, 로그아웃 버튼)
- `Sidebar` - 사이드바 (모바일에서는 숨김)

## 환경 변수

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Supabase 스키마

### todos 테이블
```sql
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own todos"
  ON todos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own todos"
  ON todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos"
  ON todos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos"
  ON todos FOR DELETE
  USING (auth.uid() = user_id);
```

## 사용자 시나리오

### 1. 회원가입 및 로그인
1. 사용자가 `/signup` 페이지에서 이메일과 비밀번호로 가입
2. 자동으로 로그인되어 `/dashboard`로 이동
3. 또는 `/login` 페이지에서 기존 계정으로 로그인

### 2. Todo 추가
1. 대시보드에서 "새 할 일 추가" 버튼 클릭
2. 모달이 열리고 제목과 설명 입력
3. "추가" 버튼 클릭
4. Todo 목록에 즉시 반영

### 3. Todo 완료
1. Todo 아이템의 체크박스 클릭
2. 완료 상태로 변경 (취소선 표시)
3. 통계 업데이트

### 4. Todo 삭제
1. Todo 아이템의 삭제 버튼 클릭
2. 확인 다이얼로그 표시
3. "삭제" 확인 시 목록에서 제거

### 5. 필터링
1. "미완료만" 버튼 클릭
2. 완료되지 않은 할 일만 표시
3. 다른 필터 클릭 시 즉시 변경

## UI/UX 요구사항

### 디자인
- 깔끔하고 미니멀한 디자인
- 반응형 레이아웃 (모바일, 태블릿, 데스크톱)
- 다크 모드 미지원 (추후 추가 가능)

### 사용성
- 직관적인 인터페이스
- 빠른 응답 (Optimistic UI 업데이트)
- 명확한 에러 메시지
- 로딩 상태 표시

### 접근성
- 키보드 네비게이션 지원
- ARIA 라벨 사용
- 충분한 색상 대비

## 성공 기준

1. ✅ 회원가입/로그인이 정상 작동
2. ✅ Todo CRUD 기능 정상 작동
3. ✅ 필터링이 즉시 반영
4. ✅ 통계가 실시간 업데이트
5. ✅ 모바일에서도 정상 작동
6. ✅ 에러 없이 즉시 실행 가능

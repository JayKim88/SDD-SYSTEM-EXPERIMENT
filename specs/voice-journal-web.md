# Voice Journal - Web Version

음성으로 감정을 기록하는 웹 애플리케이션

## 핵심 기능

- 🎤 음성 녹음 및 텍스트 변환
- 📝 일기 작성 및 편집
- 🤖 AI 감정 분석
- 📊 감정 통계 대시보드
- 🔐 사용자 인증 (이메일/비밀번호)

## 기술 스택

- Frontend: Next.js 14 (App Router)
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- AI: OpenAI API (Whisper for transcription, GPT for sentiment analysis)

## 데이터 모델

### User
```typescript
interface User {
  id: string; // UUID
  email: string; // unique
  name: string;
  created_at: Date;
}
```

### Journal
```typescript
interface Journal {
  id: string; // UUID
  user_id: string; // FK to User
  title: string;
  content: string; // 텍스트 변환된 내용
  audio_url?: string; // 음성 파일 URL (Supabase Storage)
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number; // 0-1
  mood_tags: string[]; // ['happy', 'excited', ...]
  created_at: Date;
  updated_at: Date;
}
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃

### Journals
- `GET /api/journals` - 내 일기 목록 조회
- `POST /api/journals` - 일기 생성
- `GET /api/journals/[id]` - 일기 상세 조회
- `PATCH /api/journals/[id]` - 일기 수정
- `DELETE /api/journals/[id]` - 일기 삭제

### Audio
- `POST /api/audio/transcribe` - 음성 → 텍스트 변환
- `POST /api/audio/upload` - 음성 파일 업로드

### Sentiment Analysis
- `POST /api/sentiment/analyze` - 텍스트 감정 분석

### Statistics
- `GET /api/stats/summary` - 감정 통계 요약

## UI Components

### Pages
- `/` - 랜딩 페이지
- `/login` - 로그인 페이지
- `/signup` - 회원가입 페이지
- `/dashboard` - 대시보드 (일기 목록 + 통계)
- `/journal/new` - 새 일기 작성
- `/journal/[id]` - 일기 상세 보기

### Components
- `VoiceRecorder` - 음성 녹음 컴포넌트
- `JournalCard` - 일기 카드
- `JournalList` - 일기 목록
- `SentimentChart` - 감정 차트 (7일간)
- `MoodTagCloud` - 무드 태그 클라우드
- `AudioPlayer` - 음성 재생기
- `Header` - 네비게이션 헤더
- `ProtectedRoute` - 인증 보호 라우트

## 요구사항

### Functional
- 사용자는 음성으로 일기를 녹음할 수 있다
- 녹음된 음성은 자동으로 텍스트로 변환된다
- 일기 내용은 AI가 감정을 분석한다
- 사용자는 일주일간의 감정 변화를 차트로 볼 수 있다
- 사용자는 과거 일기를 검색하고 조회할 수 있다

### Non-Functional
- 음성 녹음은 60초로 제한
- 페이지 로딩 시간은 2초 이내
- 반응형 디자인 (모바일, 태블릿, 데스크톱)
- WCAG 2.1 AA 접근성 준수

### Constraints
- 음성 파일은 Supabase Storage에 저장
- AI API 비용 절감을 위해 캐싱 활용
- 사용자당 일기 개수 제한 없음

# SDD System - Spec-Driven Development Automation

> AI Agent 기반 애플리케이션 자동 생성 시스템

Specification(명세서)를 작성하면 AI Agent들이 자동으로 완전한 웹 애플리케이션을 생성합니다.

---

## 📋 목차

- [개요](#개요)
- [Quick Start](#quick-start)
- [Agent 구성](#agent-구성)
- [워크플로우](#워크플로우)
- [프로젝트 구조](#프로젝트-구조)
- [사용 예시](#사용-예시)
- [문서](#문서)

---

## 개요

### 핵심 개념

```
Spec (명세서) → 9개 AI Agents → 완전한 Next.js 앱
```

**Input**: Markdown 형식의 애플리케이션 명세서
**Process**: 9개의 전문화된 AI Agent가 단계적으로 코드 생성
**Output**: 즉시 실행 가능한 Next.js/React 앱

### 특징

- ✅ **Spec-Driven**: 명세서만 작성하면 코드 자동 생성
- ✅ **AI-Powered**: Claude Sonnet 4.5 기반 Agent 시스템
- ✅ **전문화된 Agents**: 각 Agent가 특정 영역 담당
- ✅ **프로덕션 품질**: TypeScript, Accessibility, Best practices
- ✅ **점진적 확장**: 6개 Core Agent 완성 + 3개 선택적 추가

---

## Quick Start

### 1. 설치

```bash
git clone <repository-url>
cd sdd-system
npm install
```

### 2. 환경 변수 설정

```bash
# .env 파일 생성
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env
```

### 3. Spec 작성

`specs/my-app.md` 파일 생성:

```markdown
# My Todo App

간단한 할 일 관리 애플리케이션

## 데이터 모델

### Todo
- id: string (UUID)
- title: string
- completed: boolean
- createdAt: Date

## 기능
- Todo 추가
- Todo 완료 체크
- Todo 삭제
```

### 4. 앱 생성

```bash
npm run generate specs/my-app.md
```

### 5. 실행

```bash
cd output/my-app
npm install
npm run dev
```

---

## Agent 구성

### ✅ 구현 완료 (6개)

#### 1. Spec Parser Agent
**역할**: Markdown 명세서 → 구조화된 JSON

```
Input:  specs/my-app.md
Output: .temp/parsed-spec.json
```

#### 2. Architecture Agent
**역할**: 프로젝트 구조 및 파일 리스트 설계

```
Input:  .temp/parsed-spec.json
Output: .temp/architecture.json (68 files 계획)
```

#### 3. Database Agent
**역할**: Prisma/Drizzle 스키마 생성

```
Input:  parsedSpec + architecture
Output: prisma/schema.prisma
        lib/database/client.ts
        prisma/seed.ts
        (~4-12 files)
```

#### 4. Frontend Agent
**역할**: React/Next.js 컴포넌트 생성

```
Input:  parsedSpec + architecture
Output: components/ui/*.tsx
        components/forms/*.tsx
        app/*/page.tsx
        contexts/*Provider.tsx
        (~20-40 files)
```

#### 5. Backend Agent
**역할**: API Routes 및 Server 로직 생성

```
Input:  parsedSpec + architecture
Output: app/api/**/ route.ts
        lib/actions/*.ts
        middleware.ts
        (~10-20 files)
```

#### 6. Config Agent
**역할**: 프로젝트 설정 파일 생성 (템플릿 기반, AI 호출 없음)

```
Input:  parsedSpec + architecture + database (ORM 감지)
Output: package.json (Prisma deps 자동 포함)
        tsconfig.json
        tailwind.config.ts
        .env.example
        (9 files)
```

---

### ⏳ 구현 예정 (3개)

#### 7. Deployment Agent
**역할**: Docker, CI/CD 설정 생성 (템플릿 기반)

```
Output: Dockerfile
        docker-compose.yml
        .github/workflows/ci.yml
```

**구현 시간**: ~1시간

#### 8. Testing Agent
**역할**: 테스트 파일 자동 생성

```
Output: components/**/*.test.tsx
        app/api/**/*.test.ts
        e2e/**/*.spec.ts
```

**구현 시간**: ~2-3시간

#### 9. Fix Agent
**역할**: 빌드 에러 자동 수정

```
Input:  TypeScript/ESLint 에러
Output: 자동 수정된 코드
```

**구현 시간**: ~4-6시간

---

## 워크플로우

### 전체 실행 흐름

```
Markdown Spec (specs/my-app.md)
    ↓
Phase 0: Spec Parser Agent
    → parsed-spec.json
    ↓
Phase 1: Architecture Agent
    → architecture.json (68 files 계획)
    ↓
Phase 2: Database Agent
    → prisma/schema.prisma, seed.ts (12 files)
    ↓
Phase 3: Frontend Agent
    → components/, app/ (27 files)
    ↓
Phase 4: Backend Agent
    → app/api/, lib/actions/ (16 files)
    ↓
Phase 5: Config Agent (Database ORM 인식)
    → package.json (Prisma deps), configs (9 files)
    ↓
Complete Next.js App (64 files)
```

### CLI 실행 예시

```bash
$ npm run generate specs/todo-app.md

🚀 SDD System - Starting...

📝 Phase 0: Spec Parser Agent
   Reading: specs/todo-app.md
   ✅ Generated: .temp/parsed-spec.json

🏗️  Phase 1: Architecture Agent
   Designing project structure...
   ✅ Generated: .temp/architecture.json

💾 Phase 2: Database Agent
   Generating database schema & ORM code...
   ✅ Generated: 12 database files
      - Schema: 1
      - Seeds: 1
      - Clients: 2

🎨 Phase 3: Frontend Agent
   Generating React/Next.js components...
   ✅ Generated: 27 frontend files
      - Components: 14
      - Pages: 4
      - Providers: 2

⚙️  Phase 4: Backend Agent
   Generating API routes & server logic...
   ✅ Generated: 16 backend files
      - API Routes: 2
      - Middleware: 1

📦 Phase 5: Config Agent
   Generating config files...
   Detected ORM from Database Agent: prisma
   ✅ Generated: 9 config files

🎉 Success! Your app is ready.

📦 Project: output/todo-app
📄 Files Generated:
   Database: 12 files
   Frontend: 27 files
   Backend: 16 files
   Config: 9 files
   Total: 64 files

📖 Next steps:
   cd output/todo-app
   npm install
   # Set up database
   cp .env.example .env.local
   # Edit .env.local with your DATABASE_URL
   npm run db:push
   npm run db:seed
   npm run dev
```

**실행 시간**: ~3분 (Todo 앱 기준)
**Token 사용**: ~90K tokens (~$0.30-0.50)

---

## 프로젝트 구조

```
sdd-system/                          # SDD 시스템 루트
├── lib/
│   └── agents/                      # ✅ Agent 구현
│       ├── base-agent.ts           # Base Agent 추상 클래스
│       │
│       ├── spec-parser/            # Agent 1
│       │   ├── AGENT.md
│       │   ├── index.ts
│       │   └── types.ts
│       │
│       ├── architecture/           # Agent 2
│       ├── database/               # Agent 3 (NEW)
│       ├── frontend/               # Agent 4 (NEW)
│       ├── backend/                # Agent 5 (NEW)
│       ├── config/                 # Agent 6 (NEW)
│       │
│       ├── deployment/             # Agent 7 (TODO)
│       ├── testing/                # Agent 8 (TODO)
│       └── fix/                    # Agent 9 (TODO)
│
├── specs/                          # 📝 입력: Spec 파일
│   ├── todo-app.md                # Todo App Spec
│   └── voice-journal-web.md       # Voice Journal Spec
│
├── .temp/                          # 🔄 중간 산출물 (자동 생성)
│   ├── parsed-spec.json
│   └── architecture.json
│
├── output/                         # 🎁 출력: 생성된 앱
│   ├── todo-app/                  # 완전한 Next.js 프로젝트
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── prisma/
│   │   ├── package.json
│   │   └── ...
│   │
│   └── voice-journal-web/
│       └── ...
│
├── cli.ts                          # 🚀 CLI 진입점
├── package.json                    # SDD 시스템 의존성
├── tsconfig.json
├── README.md                       # 이 파일
├── AGENT_ARCHITECTURE.md           # Agent 상세 설계
├── IMPLEMENTATION_LOG.md           # 구현 기록
└── .env                            # API Keys
```

---

## 사용 예시

### 예시 1: Todo App

**Spec 파일** (`specs/todo-app.md`):
```markdown
# Todo App

## 데이터 모델
- Todo: id, title, completed, userId, createdAt

## API 엔드포인트
- GET /api/todos - 목록 조회
- POST /api/todos - 생성
- PATCH /api/todos/[id] - 수정
- DELETE /api/todos/[id] - 삭제
```

**생성 결과**:
- ✅ 64개 파일 생성
- ✅ Prisma schema 자동 생성
- ✅ CRUD API 완벽 구현
- ✅ React 컴포넌트 + Tailwind CSS
- ✅ 즉시 실행 가능

---

### 예시 2: Voice Journal App

**Spec 파일** (`specs/voice-journal-web.md`):
```markdown
# Voice Journal Web

## 기능
- 음성 녹음
- AI 감정 분석
- 일기 저장

## Tech Stack
- Database: Supabase
- AI: OpenAI Whisper
```

**생성 결과**:
- ✅ 68개 파일 생성
- ✅ Supabase 클라이언트 자동 설정
- ✅ OpenAI API 통합
- ✅ 음성 녹음 컴포넌트

---

## 생성된 코드 품질

### ✅ TypeScript Strict Mode
```typescript
// 모든 타입 명시
interface Todo {
  id: string;
  title: string;
  completed: boolean;
}
```

### ✅ Accessibility
```tsx
<button
  aria-label="Add todo"
  role="button"
  className="..."
>
  Add
</button>
```

### ✅ Error Handling
```typescript
try {
  await prisma.todo.create({ data })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Todo already exists' },
        { status: 409 }
      )
    }
  }
  throw error
}
```

### ✅ Best Practices
- Server/Client Component 자동 구분 ('use client' directive)
- Prisma Client Singleton 패턴
- Responsive Design (모바일 우선)
- CRUD API with proper HTTP status codes

---

## 문서

### 상세 문서
- [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md) - Agent 상세 설계 (9개 Agent 명세)
- [IMPLEMENTATION_LOG.md](./IMPLEMENTATION_LOG.md) - 구현 기록 및 테스트 결과

### Agent별 지시사항 (AGENT.md)
- [Spec Parser AGENT.md](./lib/agents/spec-parser/AGENT.md)
- [Architecture AGENT.md](./lib/agents/architecture/AGENT.md)
- [Database AGENT.md](./lib/agents/database/AGENT.md)
- [Frontend AGENT.md](./lib/agents/frontend/AGENT.md)
- [Backend AGENT.md](./lib/agents/backend/AGENT.md)

---

## 기술 스택

### SDD System (이 프로젝트)
- **Language**: TypeScript
- **AI Model**: Claude Sonnet 4.5 (Anthropic API)
- **Runtime**: Node.js 18+

### 생성되는 앱
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **ORM**: Prisma (or Drizzle)
- **Database**: PostgreSQL (Supabase 지원)
- **Validation**: Zod

---

## 성능

### Token 사용량 (Todo 앱 기준)

| Agent | Tokens | 비용 |
|-------|--------|------|
| Spec Parser | ~4K | $0.01 |
| Architecture | ~8K | $0.02 |
| Database | ~8K | $0.02 |
| Frontend | ~46K | $0.15 |
| Backend | ~24K | $0.08 |
| Config | 0 (템플릿) | $0.00 |
| **Total** | **~90K** | **~$0.28** |

### 실행 시간 (Todo 앱 기준)

| Agent | 시간 |
|-------|------|
| Spec Parser | ~20초 |
| Architecture | ~30초 |
| Database | ~30초 |
| Frontend | ~60초 |
| Backend | ~40초 |
| Config | ~1초 |
| **Total** | **~3분** |

---

## 왜 9개 Agent인가?

### ❌ 초기 설계: 28개 Agent
- 너무 복잡
- 불필요한 분리
- 유지보수 어려움

### ✅ 최종 설계: 9개 Agent
- **6개 Core Agents**: MVP 완성 (현재 구현 완료)
- **3개 Optional Agents**: 선택적 추가 (미구현)
- **19개 Agent 제거**: 불필요하거나 통합 가능

**제거된 Agent들**:
- Input Validation, Requirement Analyzer (→ Spec Parser로 통합)
- Auth, Business Logic (→ Backend Agent로 통합)
- Security, Performance (→ ESLint 플러그인으로 대체)
- Documentation (→ Frontend/Backend Agent가 JSDoc 포함)
- Validation, Build Check (→ 명령어로 충분: `tsc`, `eslint`)

---

## 로드맵

### v1.0 (현재) ✅
- [x] 6개 Core Agent 구현
- [x] Todo App 생성 성공
- [x] Database Agent (Prisma 지원)
- [x] Config Agent (ORM 자동 감지)

### v1.1 (다음)
- [ ] Deployment Agent 추가
- [ ] Testing Agent 추가
- [ ] Fix Agent 추가

### v1.2 (실행 제어)
- [ ] Interactive Mode (각 Agent 후 결과 확인)
- [ ] Resume from Checkpoint (특정 Phase부터 재개)
- [ ] Agent 선택 실행 (원하는 Agent만 실행)
- [ ] Dry Run (실행 전 미리보기 & 비용 예측)

### v2.0 (미래)
- [ ] Agent 병렬 실행 (실행 시간 단축)
- [ ] Incremental Generation (변경된 파일만 재생성)
- [ ] Web UI (GUI 기반 Spec 작성)
- [ ] Agent Marketplace (커뮤니티 Agent 공유)

---

## 라이선스

MIT

---

## 기여

Issue 및 PR 환영합니다!

---

## Contact

- GitHub: [sdd-system](https://github.com/your-username/sdd-system)
- Email: your-email@example.com

---

**작성일**: 2025-12-17
**버전**: 2.0
**작성자**: Claude Sonnet 4.5

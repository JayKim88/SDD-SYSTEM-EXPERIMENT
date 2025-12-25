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
Spec (명세서) → 10개 AI Agents → 완전한 Next.js 앱
```

**Input**: Markdown 형식의 애플리케이션 명세서
**Process**: 10개의 전문화된 AI Agent가 단계적으로 코드 생성
**Output**: 즉시 실행 가능한 Next.js/React 앱

### 특징

- ✅ **Spec-Driven**: 명세서만 작성하면 코드 자동 생성
- ✅ **AI-Powered**: Claude Sonnet 4.5 기반 Agent 시스템
- ✅ **전문화된 Agents**: 각 Agent가 특정 영역 담당
- ✅ **프로덕션 품질**: TypeScript, Accessibility, Best practices
- ✅ **점진적 확장**: 8개 Core Agent 완성 + 2개 선택적 추가

---

## Quick Start

### 🎯 어떤 방식을 사용해야 하나요?

| 방식 | 사용 시나리오 | 특징 |
|------|--------------|------|
| **방법 1 (v3.0)** | Claude Code로 대화형 개발 | 🌟 Interactive Mode, 병렬 실행, Checkpoint |
| **방법 2 (v1.0)** | CLI로 자동 생성 | ⚡ 빠른 자동화, CI/CD 통합 |
| **방법 3** | 수동으로 spec 작성 | ✍️ 정확한 spec 작성, 반복 생성 |

---

### 방법 1: Claude Code 사용 (v3.0, 권장) ⭐

**Claude Code CLI**에서 AI와 대화하며 앱을 생성합니다.

```bash
# 1. 설치
git clone <repository-url>
cd sdd-system
npm install

# 2. 환경 변수 설정
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env

# 3. Claude Code 실행
claude-code  # 또는 npx claude-code

# 4. Claude와 대화
You: /generate specs/my-money-plan.md
# Interactive mode로 각 Phase 완료 후 확인하며 진행

# 5. 생성된 앱 실행
cd output/personal-finance-tracker
npm install
npm run dev
```

**v3.0 핵심 기능**:
- 🎯 **Interactive Mode**: 각 Phase 완료 후 확인 (yes/no/modify/skip)
- 💾 **Checkpoint System**: 자동 저장/복구 (.temp/checkpoint.json)
- ⚡ **병렬 실행**: Phase 3-8 동시 실행 (59% 빠름, 4-5분)
- 🔄 **순차 실행**: 안정적인 단계별 실행 (8-10분)
- 🤖 **3-Layer 구조**: Command → Sub Agents → Skills

**실행 모드**:
```bash
# Interactive + Sequential (기본, 첫 테스트 권장)
/generate specs/my-app.md

# Auto + Parallel (최고 속도, 프로덕션)
/generate specs/my-app.md --auto --parallel

# 중단 후 재개
/generate specs/my-app.md --resume
```

> 자세한 사용법: [SDD_SYSTEM_ARCHITECTURE.md](./docs/SDD_SYSTEM_ARCHITECTURE.md)

---

### 방법 2: CLI 사용 (v1.0, 자동화) ⚡

**Spec Writer Agent**로 spec 작성 후 CLI로 자동 생성합니다.

```bash
# 1. 설치
git clone <repository-url>
cd sdd-system
npm install

# 2. 환경 변수 설정
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env

# 3. 대화형 spec 작성
npm run spec:new -- --idea "Personal finance tracker" --template financial

# 4. 생성된 spec으로 앱 생성
npm run generate specs/personal-finance-tracker.md

# 5. 실행
cd output/personal-finance-tracker
npm install
npm run dev
```

**특징**:
- ⚡ 빠른 자동 생성 (~5분)
- 🔁 CI/CD 파이프라인 통합 가능
- 📦 9개 Agents가 순차 실행

---

### 방법 3: 수동 Spec 작성

직접 spec을 작성할 수도 있습니다.

```bash
# 1. 설치
git clone <repository-url>
cd sdd-system
npm install

# 2. 환경 변수 설정
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env

# 3. Spec 파일 생성
```

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

```bash
# 4. 앱 생성 (Claude Code 또는 CLI)
claude-code  # → You: /generate specs/my-app.md
# 또는
npm run generate specs/my-app.md

# 5. 실행
cd output/my-app
npm install
npm run dev
```

---

## Agent 구성

### ✅ 구현 완료 (8개) + ⏳ 구현 예정 (2개)

#### 0. Spec Writer Agent ⭐ NEW!
**역할**: AI 대화형 spec 작성, 개선, 검토

```
Input:  사용자 아이디어 또는 기존 spec
Output: 완성된 specs/*.md 파일
Modes:  new (신규), refine (개선), review (검토)
```

**사용법**:
```bash
# 새 spec 작성
npm run spec:new -- --idea "E-commerce platform" --template ecommerce

# 기존 spec 개선
npm run spec:refine specs/my-app.md

# Spec 검토 및 자동 수정
npm run spec:review specs/my-app.md --fix
```

**특징**:
- 🤖 AI 대화형 기획 지원
- 📝 데이터 모델, API, 페이지 자동 설계
- ✅ 일관성 자동 검증 (Critical 이슈 자동 발견)
- 💡 기술 스택 추천
- 🔧 자동 수정 기능

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
Output: package.json (Prisma deps + test deps 자동 포함)
        tsconfig.json
        tailwind.config.ts
        .env.example
        (9 files)
```

#### 7. Testing Agent ⏳
**역할**: 테스트 파일 자동 생성 (구현 예정)

```
Input:  parsedSpec + architecture + frontend + backend
Output: components/**/*.test.tsx
        app/api/**/*.test.ts
        e2e/**/*.spec.ts
        vitest.config.ts
        playwright.config.ts
        (~15-50 files)
```

#### 8. Deployment Agent ⏳
**역할**: Docker, CI/CD 설정 생성 (구현 예정, 템플릿 기반)

```
Input:  parsedSpec + architecture + database (ORM 감지)
Output: Dockerfile
        docker-compose.yml
        .dockerignore
        .github/workflows/ci.yml
        DEPLOYMENT.md
        (5 files)
```

#### 9. Fix Agent ✅
**역할**: TypeScript/ESLint 에러 자동 수정

```
Input:  projectPath (생성된 프로젝트)
Process:
  1. TypeScript/ESLint 에러 검사
  2. 에러를 파일별로 그룹화
  3. Claude에게 각 파일 수정 요청
  4. 수정된 코드 적용
  5. 재검증 (최대 3회)
Output: 수정된 파일 목록, 에러 수정 통계
```

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
    → package.json (Prisma deps + test deps), configs (9 files)
    ↓
Phase 6: Testing Agent
    → test files, test configs (~15-50 files)
    ↓
Phase 7: Deployment Agent
    → Dockerfile, CI/CD configs (5 files)
    ↓
Phase 8: Fix Agent
    → 에러 검사 및 자동 수정 (TypeScript + ESLint)
    ↓
Complete Production-Ready Next.js App (~90-110 files, 에러 수정 완료)
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

🧪 Phase 6: Testing Agent
   Generating test suites...
   ✅ Generated: 35 test files
      - Component tests: 14
      - API tests: 2
      - E2E tests: 3
      - Config files: 4

🚀 Phase 7: Deployment Agent
   Generating deployment files...
   ✅ Generated: 5 deployment files

🔧 Phase 8: Fix Agent
   Checking and fixing errors...
   ✅ Fix completed:
      - Attempts: 2
      - Errors fixed: 8
      - Remaining errors: 0
      - Files modified: 3

🎉 Success! Your app is ready.

📦 Project: output/todo-app
📄 Files Generated:
   Database: 12 files
   Frontend: 27 files
   Backend: 16 files
   Config: 9 files
   Testing: 35 files
   Deployment: 5 files
   Total: 104 files

📖 Next steps:
   cd output/todo-app
   npm install
   # Set up database
   cp .env.example .env.local
   # Edit .env.local with your DATABASE_URL
   npm run db:push
   npm run db:seed
   npm run dev
   # Run tests
   npm run test          # Run unit & integration tests
   npm run test:e2e      # Run E2E tests
   # Or run with Docker
   docker-compose up -d  # Start with Docker
```

**실행 시간**: ~4-5분 (Todo 앱 기준, 테스트 포함)
**Token 사용**: ~150K tokens (~$0.50-0.70)

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
│       ├── database/               # Agent 3
│       ├── frontend/               # Agent 4
│       ├── backend/                # Agent 5
│       ├── config/                 # Agent 6
│       ├── testing/                # Agent 7
│       ├── deployment/             # Agent 8
│       └── fix/                    # Agent 9 ✅
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
├── docs/                           # 프로젝트 문서
│   ├── SDD_SYSTEM_ARCHITECTURE.md # 전체 아키텍처 (v1.0~v3.0)
│   ├── IMPLEMENTATION_GUIDE.md    # 구현 가이드
│   ├── IMPLEMENTATION_LOG.md      # 구현 기록
│   └── CLAUDE_CODE_LEARNING.md    # Claude Code 학습 가이드
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

### 아키텍처 문서
- [SDD_SYSTEM_ARCHITECTURE.md](./docs/SDD_SYSTEM_ARCHITECTURE.md) - 전체 시스템 아키텍처 (v1.0 ~ v3.0)
- [CLAUDE_CODE_LEARNING.md](./docs/CLAUDE_CODE_LEARNING.md) - Claude Code 학습 가이드

### 구현 가이드
- [IMPLEMENTATION_GUIDE.md](./docs/IMPLEMENTATION_GUIDE.md) - Agent 구현 가이드
- [IMPLEMENTATION_LOG.md](./docs/IMPLEMENTATION_LOG.md) - 구현 기록 및 테스트 결과

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
| Testing | ~60K | $0.20 |
| Deployment | 0 (템플릿) | $0.00 |
| Fix | ~20-40K | $0.07-0.13 |
| **Total** | **~170-190K** | **~$0.55-0.61** |

### 실행 시간 (Todo 앱 기준)

| Agent | 시간 |
|-------|------|
| Spec Parser | ~20초 |
| Architecture | ~30초 |
| Database | ~30초 |
| Frontend | ~60초 |
| Backend | ~40초 |
| Config | ~1초 |
| Testing | ~60-90초 |
| Deployment | ~1초 |
| Fix | ~30-60초 |
| **Total** | **~5-6분** |

---

## 왜 9개 Agent인가?

### ❌ 초기 설계: 28개 Agent
- 너무 복잡
- 불필요한 분리
- 유지보수 어려움

### ✅ 최종 설계: 9개 Agent (모두 완료!)
- **6개 Core Agents**: 기본 앱 생성
- **2개 Quality Agents**: 테스트 & 배포
- **1개 Fix Agent**: 에러 자동 수정
- **19개 Agent 제거**: 불필요하거나 통합 가능

**제거된 Agent들**:
- Input Validation, Requirement Analyzer (→ Spec Parser로 통합)
- Auth, Business Logic (→ Backend Agent로 통합)
- Security, Performance (→ ESLint 플러그인으로 대체)
- Documentation (→ Frontend/Backend Agent가 JSDoc 포함)
- Validation, Build Check (→ 명령어로 충분: `tsc`, `eslint`)

---

## 로드맵

### v1.0 (2025-12-13) ✅ - 9개 Agent 완성
- [x] 6개 Core Agent 구현
- [x] Todo App 생성 성공
- [x] Database Agent (Prisma 지원)
- [x] Config Agent (ORM 자동 감지)
- [x] Testing Agent (Vitest + Playwright)
- [x] Deployment Agent (Docker + CI/CD)
- [x] Fix Agent (TypeScript/ESLint 에러 자동 수정)

### v2.0 (2025-12-23) ✅ - Skills 기반 시스템
- [x] Claude Code Skills 10개 구현
- [x] 대화형 개발 지원
- [x] Max 플랜 활용 (API 크레딧 불필요)

### v3.0 (2025-12-25) ✅ - Command + Sub Agents + Skills
- [x] Interactive Mode (각 Phase 후 확인)
- [x] Checkpoint System (자동 저장/복구)
- [x] 병렬 실행 (Phase 3-8, 59% 빠름)
- [x] 9개 Sub Agents 구현
- [x] 1개 Command 구현 (오케스트레이터)
- [x] sdd- prefix 제거

### v3.1 (다음) - 최적화 & 개선
- [ ] Agent 선택 실행 (원하는 Phase만 실행)
- [ ] Dry Run (실행 전 미리보기 & 비용 예측)
- [ ] Incremental Generation (변경된 부분만 재생성)
- [ ] 성능 모니터링 대시보드

### v4.0 (미래) - 확장 & 생태계
- [ ] Web UI (GUI 기반 Spec 작성 & 실시간 미리보기)
- [ ] Agent Marketplace (커뮤니티 Agent 공유)
- [ ] Multi-framework 지원 (Vue, Svelte, Angular)
- [ ] Cloud Integration (AWS, Azure, GCP 원클릭 배포)

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

**작성일**: 2025-12-25
**버전**: 3.0
**작성자**: Claude Sonnet 4.5

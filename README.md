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

## 시스템 구성 (v3.0)

### 3-Layer 아키텍처

```
Command (사용자 대면)
   ↓
Sub Agents (전문화된 실행)
   ↓
Skills (재사용 가능한 로직)
```

### Layer 1: Command (1개)

#### generate.md
**위치**: `.claude/commands/generate.md`
**역할**: 전체 워크플로우 오케스트레이션

**기능**:
- 사용자 인터랙션 (Interactive Mode)
- Phase별 Sub Agent 호출
- Checkpoint 저장/복구
- 순차/병렬 실행 제어

**사용법**:
```bash
/generate specs/my-app.md                    # Interactive + Sequential
/generate specs/my-app.md --auto             # Auto + Sequential
/generate specs/my-app.md --parallel         # Interactive + Parallel
/generate specs/my-app.md --auto --parallel  # Auto + Parallel
/generate specs/my-app.md --resume           # 중단 지점부터 재개
```

---

### Layer 2: Sub Agents (9개)

**위치**: `.claude/agents/`

| Agent | Model | 역할 | Output |
|-------|-------|------|--------|
| **parse-agent** | haiku | Spec 파싱 | .temp/parsed-spec.json |
| **architecture-agent** | sonnet | 프로젝트 구조 설계 | .temp/architecture.json |
| **database-agent** | sonnet | DB 스키마 생성 | prisma/schema.prisma |
| **frontend-agent** | sonnet | React 컴포넌트 생성 | components/, app/ |
| **backend-agent** | sonnet | API Routes 생성 | app/api/, lib/actions/ |
| **config-agent** | sonnet | 설정 파일 생성 | package.json, configs |
| **testing-agent** | sonnet | 테스트 코드 생성 | *.test.tsx, *.spec.ts |
| **deployment-agent** | sonnet | Docker/CI/CD 생성 | Dockerfile, workflows |
| **fix-agent** | sonnet | 에러 자동 수정 | 수정된 파일들 |

**특징**:
- 독립적인 컨텍스트에서 실행
- 사용자 인터랙션 불가 (Parent-Delegate 패턴)
- 내부적으로 Skill 호출
- 병렬 실행 가능 (Phase 3-8)

---

### Layer 3: Skills (10개)

**위치**: `.claude/skills/`

| Skill | 역할 | 사용처 |
|-------|------|--------|
| **parse.md** | Spec → JSON 파싱 | parse-agent |
| **architecture.md** | 프로젝트 구조 설계 | architecture-agent |
| **database.md** | DB 스키마 생성 | database-agent |
| **frontend.md** | React 컴포넌트 생성 | frontend-agent |
| **backend.md** | API Routes 생성 | backend-agent |
| **config.md** | 설정 파일 생성 | config-agent |
| **testing.md** | 테스트 코드 생성 | testing-agent |
| **deployment.md** | Docker/CI/CD 생성 | deployment-agent |
| **fix.md** | 에러 자동 수정 | fix-agent |
| **generate.md** | 전체 파이프라인 | (Deprecated, Command 사용) |

**특징**:
- 재사용 가능한 비즈니스 로직
- Sub Agent 없이도 직접 호출 가능
- 메인 컨텍스트에서 실행

---

## 워크플로우

### 실행 흐름 (v3.0)

#### Sequential Mode (순차 실행)

```
User: /generate specs/my-app.md
  ↓
Phase 1: Parse
  → parse-agent → parse skill
  → .temp/parsed-spec.json
  → [Interactive] Continue? (yes/no/modify/skip)
  ↓
Phase 2: Architecture
  → architecture-agent → architecture skill
  → .temp/architecture.json
  → [Interactive] Continue? (yes/no/modify/skip)
  ↓
Phase 3: Database
  → database-agent → database skill
  → prisma/schema.prisma
  → [Interactive] Continue?
  ↓
Phase 4: Frontend
  → frontend-agent → frontend skill
  → components/, app/
  → [Interactive] Continue?
  ↓
Phase 5: Backend
  → backend-agent → backend skill
  → app/api/, lib/actions/
  → [Interactive] Continue?
  ↓
Phase 6: Config
  → config-agent → config skill
  → package.json, configs
  → [Interactive] Continue?
  ↓
Phase 7: Testing
  → testing-agent → testing skill
  → *.test.tsx, *.spec.ts
  → [Interactive] Continue?
  ↓
Phase 8: Deployment
  → deployment-agent → deployment skill
  → Dockerfile, CI/CD
  → [Interactive] Continue?
  ↓
Phase 9: Fix
  → fix-agent → fix skill
  → 에러 수정 완료
  ↓
Complete! (~90-110 files)

⏱️ 시간: 8-10분
```

#### Parallel Mode (병렬 실행)

```
User: /generate specs/my-app.md --parallel
  ↓
Phase 1: Parse (순차 필수)
  → .temp/parsed-spec.json
  ↓
Phase 2: Architecture (순차 필수)
  → .temp/architecture.json
  ↓
Phase 3-8: 병렬 실행 (동시에 6개 Agent 실행)
  ├─ database-agent   → prisma/
  ├─ frontend-agent   → components/, app/
  ├─ backend-agent    → app/api/
  ├─ config-agent     → configs
  ├─ testing-agent    → tests
  └─ deployment-agent → Docker, CI/CD
  ↓
  [모든 Agent 완료 대기]
  ↓
  [Interactive] Summary 확인 → Continue?
  ↓
Phase 9: Fix (순차 필수)
  → 전체 에러 검사 및 수정
  ↓
Complete! (~90-110 files)

⏱️ 시간: 4-5분 (59% 단축)
```

### Checkpoint System

각 Phase 완료 후 자동 저장:
```json
// .temp/checkpoint.json
{
  "specFile": "specs/my-app.md",
  "lastPhase": 5,
  "completed": ["parse", "architecture", "database", "frontend", "backend"],
  "mode": "interactive",
  "executionMode": "sequential"
}
```

중단 후 재개:
```bash
/generate specs/my-app.md --resume
# Phase 6 (Config)부터 자동 재개
```

### 실행 예시 (v3.0 Interactive Mode)

```bash
$ claude-code
You: /generate specs/todo-app.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1: Spec Parser
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reading: specs/todo-app.md

✅ Parsing completed!

Summary:
  - Models: 2 (User, Todo)
  - Endpoints: 4 (GET, POST, PATCH, DELETE)
  - Components: 5 (TodoList, TodoItem, AddTodo, etc.)
  - Pages: 3 (Home, Dashboard, Login)

Output: .temp/parsed-spec.json
Checkpoint: .temp/checkpoint.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Continue to Phase 2 (Architecture)? (yes/no/modify/skip): yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 2: Architecture Design
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Designing project structure...

✅ Architecture designed!

Summary:
  - Directories: 12
  - Planned files: 64
  - Dependencies: 18 packages
  - Tech stack: Next.js 14, Prisma, Tailwind CSS

Output: .temp/architecture.json
Checkpoint: .temp/checkpoint.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Continue to Phase 3 (Database)? (yes/no/modify/skip): yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 3: Database Schema
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generating Prisma schema...

✅ Database schema generated!

Summary:
  - Models: 2 (User, Todo)
  - Relations: 1 (User ↔ Todo)
  - Files: 4 (schema.prisma, client.ts, seed.ts, types.ts)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Continue to Phase 4 (Frontend)? (yes/no/modify/skip): yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 4-8: Parallel Execution Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Running 5 agents in parallel...

⏳ frontend-agent   (0/1) ...
⏳ backend-agent    (0/1) ...
⏳ config-agent     (0/1) ...
⏳ testing-agent    (0/1) ...
⏳ deployment-agent (0/1) ...

✅ frontend-agent   (1/1) - 24 files
✅ config-agent     (1/1) - 9 files
✅ backend-agent    (1/1) - 14 files
✅ testing-agent    (1/1) - 32 files
✅ deployment-agent (1/1) - 5 files

Combined Summary:
  - Frontend: 24 files (components, pages, providers)
  - Backend: 14 files (API routes, actions)
  - Config: 9 files (package.json, tsconfig, etc.)
  - Testing: 32 files (unit, integration, e2e)
  - Deployment: 5 files (Dockerfile, CI/CD)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Continue to Phase 9 (Fix)? (yes/no/modify/skip): yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 9: Fix Errors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking TypeScript and ESLint errors...

Found 5 errors:
  - app/page.tsx: Missing 'use client'
  - components/TodoItem.tsx: Type error
  - lib/db.ts: Import error

Fixing errors... (Attempt 1/3)

✅ All errors fixed!

Summary:
  - Errors found: 5
  - Errors fixed: 5
  - Files modified: 3
  - Attempts: 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Generation Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Project: output/todo-app
📄 Total files: 88 files

Files by type:
  - Database: 4 files
  - Frontend: 24 files
  - Backend: 14 files
  - Config: 9 files
  - Testing: 32 files
  - Deployment: 5 files

⏱️ Total time: 4 minutes 32 seconds
💾 Checkpoint saved: .temp/checkpoint.json

📖 Next steps:
   cd output/todo-app
   npm install
   cp .env.example .env.local
   # Edit .env.local with your DATABASE_URL
   npm run db:push
   npm run db:seed
   npm run dev
```

**실행 모드별 시간**:
- Interactive + Sequential: ~8-10분
- Interactive + Parallel: ~5-7분
- Auto + Sequential: ~8-10분
- Auto + Parallel: ~4-5분 (최고 속도)

---

## 프로젝트 구조

```
sdd-system/                          # SDD 시스템 루트
│
├── .claude/                         # 🤖 v3.0 Claude Code 구성
│   ├── commands/                    # Layer 1: Commands
│   │   └── generate.md             # 메인 오케스트레이터
│   │
│   ├── agents/                      # Layer 2: Sub Agents
│   │   ├── parse-agent.md          # Phase 1
│   │   ├── architecture-agent.md   # Phase 2
│   │   ├── database-agent.md       # Phase 3
│   │   ├── frontend-agent.md       # Phase 4
│   │   ├── backend-agent.md        # Phase 5
│   │   ├── config-agent.md         # Phase 6
│   │   ├── testing-agent.md        # Phase 7
│   │   ├── deployment-agent.md     # Phase 8
│   │   └── fix-agent.md            # Phase 9
│   │
│   └── skills/                      # Layer 3: Skills
│       ├── parse.md
│       ├── architecture.md
│       ├── database.md
│       ├── frontend.md
│       ├── backend.md
│       ├── config.md
│       ├── testing.md
│       ├── deployment.md
│       ├── fix.md
│       └── generate.md             # (Deprecated)
│
├── lib/                             # 🔧 v1.0 CLI 구현 (레거시)
│   └── agents/                      # TypeScript Agent 구현
│       ├── base-agent.ts
│       ├── spec-parser/
│       ├── architecture/
│       ├── database/
│       ├── frontend/
│       ├── backend/
│       ├── config/
│       ├── testing/
│       ├── deployment/
│       └── fix/
│
├── specs/                           # 📝 입력: Spec 파일
│   ├── todo-app.md
│   ├── my-money-plan.md
│   └── voice-journal-web.md
│
├── .temp/                           # 🔄 중간 산출물 (자동 생성)
│   ├── parsed-spec.json            # Phase 1 output
│   ├── architecture.json           # Phase 2 output
│   └── checkpoint.json             # v3.0 Checkpoint
│
├── output/                          # 🎁 출력: 생성된 앱
│   ├── todo-app/                   # 완전한 Next.js 프로젝트
│   │   ├── app/                    # App Router
│   │   ├── components/             # React 컴포넌트
│   │   ├── lib/                    # Utilities
│   │   ├── prisma/                 # Database
│   │   ├── tests/                  # 테스트
│   │   ├── Dockerfile              # Docker
│   │   ├── package.json
│   │   └── ...
│   │
│   └── my-money-plan/
│       └── ...
│
├── docs/                            # 📚 프로젝트 문서
│   ├── SDD_SYSTEM_ARCHITECTURE.md  # 전체 아키텍처 (v1.0~v3.0)
│   ├── IMPLEMENTATION_GUIDE.md     # 구현 가이드
│   ├── IMPLEMENTATION_LOG.md       # 구현 기록
│   └── CLAUDE_CODE_LEARNING.md     # Claude Code 학습 가이드
│
├── cli.ts                           # 🚀 v1.0 CLI 진입점
├── package.json                     # SDD 시스템 의존성
├── tsconfig.json
├── README.md                        # 이 파일
└── .env                             # API Keys
```

### v3.0 vs v1.0 구조 비교

| 구성 | v1.0 (CLI) | v3.0 (Claude Code) |
|------|-----------|-------------------|
| **위치** | `lib/agents/` | `.claude/` |
| **언어** | TypeScript | Markdown |
| **실행** | `npm run generate` | `/generate` |
| **구조** | 9개 Agent 클래스 | 1 Command + 9 Agents + 10 Skills |
| **상호작용** | 없음 (자동) | Interactive Mode |
| **병렬 실행** | 불가 | 가능 (Phase 3-8) |
| **Checkpoint** | 없음 | 자동 저장/복구 |

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

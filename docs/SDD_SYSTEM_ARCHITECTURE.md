# SDD System Architecture

> Spec-Driven Development 시스템의 전체 아키텍처 문서

**버전**: 3.0
**작성일**: 2025-12-25
**작성자**: Claude Sonnet 4.5

---

## 목차

- [개요](#개요)
- [버전별 아키텍처](#버전별-아키텍처)
  - [v1.0: CLI/API 기반](#v10-cliapi-기반)
  - [v2.0: Skills 기반](#v20-skills-기반)
  - [v3.0: Command + Skills + Sub Agents](#v30-command--skills--sub-agents)
- [선택 가이드](#선택-가이드)
- [10개 컴포넌트 상세](#10개-컴포넌트-상세)
- [실행 흐름](#실행-흐름)
- [데이터 흐름](#데이터-흐름)
- [프로젝트 구조](#프로젝트-구조)
- [참고 자료](#참고-자료)

---

## 개요

SDD System은 Markdown 명세서(Spec)를 입력받아 완전한 Next.js 앱을 자동 생성하는 AI 기반 시스템입니다.

### 핵심 개념

```
Input: Spec (Markdown)
  ↓
10개 전문화된 컴포넌트 (순차 실행)
  ↓
Output: Production-ready Next.js App
```

### 10개 컴포넌트

| # | 이름 | 역할 |
|---|------|------|
| 0 | Spec Writer | Spec 작성/개선/검토 |
| 1 | Spec Parser | Spec → JSON 파싱 |
| 2 | Architecture | 프로젝트 구조 설계 |
| 3 | Database | DB 스키마 생성 (Prisma/Drizzle) |
| 4 | Frontend | React/Next.js 컴포넌트 생성 |
| 5 | Backend | API Routes 생성 |
| 6 | Config | 설정 파일 생성 |
| 7 | Testing | 테스트 코드 생성 |
| 8 | Deployment | Docker/CI/CD 설정 |
| 9 | Fix | 에러 자동 수정 |

---

## 버전별 아키텍처

### v1.0: CLI/API 기반

**구현 위치**: `lib/agents/`
**실행 방법**: `npm run generate specs/my-app.md`
**특징**: TypeScript API, 자동화, CI/CD 통합

#### 구조

```
lib/agents/
├── base-agent.ts          # 기본 Agent 추상 클래스
├── spec-parser/
│   ├── index.ts          # Agent 구현
│   ├── types.ts          # 타입 정의
│   └── AGENT.md          # AI 프롬프트
├── architecture/
├── database/
├── frontend/
├── backend/
├── config/
├── testing/
├── deployment/
└── fix/
```

#### 실행 흐름

```typescript
// cli.ts
import { SpecParserAgent } from './lib/agents/spec-parser';
import { ArchitectureAgent } from './lib/agents/architecture';
// ...

async function generate(specPath: string) {
  // 1. Spec Parser
  const parser = new SpecParserAgent();
  const parsedSpec = await parser.execute(specPath);

  // 2. Architecture
  const architect = new ArchitectureAgent();
  const architecture = await architect.execute(parsedSpec);

  // 3-9. Database → Frontend → Backend → ... → Fix
  // ...
}
```

#### 특징

- ✅ **빠른 실행**: ~5분, 사용자 입력 불필요
- ✅ **자동화**: CI/CD 파이프라인 통합 가능
- ✅ **타입 안정성**: TypeScript로 구현
- ❌ **대화형 불가**: 중간에 사용자 피드백 받을 수 없음

#### 사용 시나리오

- CI/CD 자동화
- 배치 작업으로 여러 앱 생성
- 스크립트로 통합

---

### v2.0: Skills 기반

**구현 위치**: `.claude/skills/`
**실행 방법**: Claude Code에서 `/generate "My App"`
**특징**: 대화형 개발, 실시간 피드백

#### 구조

```
.claude/skills/
├── generate.md        # 메인 오케스트레이터
├── parse.md           # Spec 파싱
├── architecture.md    # 아키텍처 설계
├── database.md        # DB 스키마
├── frontend.md        # 프론트엔드
├── backend.md         # 백엔드
├── config.md          # 설정 파일
├── testing.md         # 테스트
├── deployment.md      # 배포 설정
└── fix.md             # 에러 수정
```

#### 실행 흐름

```markdown
<!-- .claude/skills/generate.md -->
1. spec 파일 확인 (있으면 스킵, 없으면 대화형 작성)
2. /parse 실행 → parsed-spec.json 생성
3. /architecture 실행 → architecture.json 생성
4. /database 실행 → DB 파일 생성
5. /frontend 실행 → 컴포넌트 생성
6. /backend 실행 → API 생성
7. /config 실행 → 설정 파일 생성
8. /testing 실행 → 테스트 생성
9. /deployment 실행 → Docker/CI 생성
10. /fix 실행 → 에러 수정
```

#### 특징

- ✅ **대화형**: AI와 실시간 대화하며 개발
- ✅ **즉시 피드백**: 각 단계마다 결과 확인 및 수정 가능
- ✅ **유연성**: 원하는 단계만 실행 가능
- ❌ **자동화 제한**: 사용자 상호작용 필요

#### 사용 시나리오

- 대화형 개발 (프로토타이핑)
- 실시간 피드백이 필요한 경우
- 학습 및 실험

---

### v3.0: Command + Skills + Sub Agents

**구현 위치**: `.claude/commands/` + `.claude/skills/` + Sub Agents
**실행 방법**: Claude Code에서 `/sdd "My App"` (Command) 또는 `/generate` (Skill)
**특징**: 하이브리드 아키텍처, 최적화된 대화형 개발

#### 3-Layer 아키텍처

```
Layer 1: Commands (Entry Point)
   ↓
Layer 2: Skills (Workflow Orchestration)
   ↓
Layer 3: Sub Agents (Specialized Tasks)
```

#### 각 Layer 역할

**Layer 1: Commands** (`.claude/commands/`)
- 사용자 요청 진입점
- 빠른 접근 (`/sdd` vs `/generate`)
- 파라미터 검증 및 전처리
- Skill 호출

**Layer 2: Skills** (`.claude/skills/`)
- 워크플로우 오케스트레이션
- 순차 실행 관리 (파이프라인)
- 사용자 인터랙션 (AskUserQuestion)
- Context 공유 (메인 대화 컨텍스트)

**Layer 3: Sub Agents**
- 전문화된 작업 수행
- 독립적인 Context (Parent-Delegate 패턴)
- 사용자 인터랙션 불가
- 결과만 반환

#### 실행 흐름

```
User: /sdd "Todo App"
  ↓
Command (generate.md)
  - 파라미터 검증
  - Skill 호출: /generate
  ↓
Skill (generate.md)
  - Spec 확인/작성
  - Pipeline 관리
  - 각 Skill 순차 호출
  ↓
Skills (parse, architecture, ...)
  - 각 단계별 작업
  - Sub Agent 호출 (필요시)
  - 결과 파일 생성
  ↓
Complete!
```

#### Command vs Skill 조합 예시

```markdown
<!-- .claude/commands/generate.md -->
/sdd [idea]

빠른 진입점, 파라미터만 받아서 /generate에 전달

---

<!-- .claude/skills/generate.md -->
/generate [idea]

실제 워크플로우 실행:
1. Spec 작성
2. Parse → Architecture → ... → Fix
3. 각 단계마다 사용자 확인
```

#### 특징

- ✅ **최상의 대화형 경험**: Command로 빠른 진입, Skill로 유연한 실행
- ✅ **모듈화**: 각 Layer가 명확히 분리
- ✅ **확장성**: 새 Command/Skill/Sub Agent 쉽게 추가
- ✅ **재사용성**: Skill은 Command나 다른 Skill에서 재사용 가능

#### Interactive Mode (핵심 기능)

**기본 동작**:
- 각 Phase 완료 후 사용자에게 확인 요청
- 옵션: yes (계속), no (중단), modify (수정), skip (건너뛰기)
- 실시간 결과 확인 및 피드백

**예시**:
```
Phase 2: Architecture Design
--------------------------------

[OK] Architecture designed successfully!

Summary:
  - Directories: 12
  - Dependencies: 21 packages
  - Planned Files: 19

Checkpoint: .temp/checkpoint.json

--------------------------------
Continue to Phase 3 (Database)? (yes/no/modify/skip)
```

#### Checkpoint System

**자동 저장**:
- 각 Phase 완료 후 `.temp/checkpoint.json`에 진행 상황 저장
- 중단 시에도 진행 상황 보존

**복구**:
```bash
/generate specs/my-money-plan.md --resume
```

**Checkpoint 구조**:
```json
{
  "specFile": "specs/my-money-plan.md",
  "projectName": "my-money-plan",
  "lastPhase": 3,
  "completed": ["parse", "architecture", "database"],
  "timestamp": "2025-12-25T12:00:00Z"
}
```

#### 실행 모드

**1. Interactive + Sequential (기본값)**
```bash
/generate specs/my-money-plan.md
```
- 각 Phase 후 확인
- 순차 실행
- 시간: 8-10분
- 권장: 첫 테스트, 학습

**2. Auto + Sequential**
```bash
/generate specs/my-money-plan.md --auto
```
- 확인 없이 자동 실행
- 순차 실행
- 시간: 8-10분
- 권장: 안정성 우선

**3. Interactive + Parallel**
```bash
/generate specs/my-money-plan.md --parallel
```
- 각 Phase 후 확인
- Phase 3-8 병렬 실행
- 시간: 5-7분
- 권장: 일반 사용

**4. Auto + Parallel (최고 속도)**
```bash
/generate specs/my-money-plan.md --auto --parallel
```
- 확인 없이 자동 실행
- Phase 3-8 병렬 실행
- 시간: 4-5분
- 권장: 프로덕션

#### 병렬 실행 구조

```
Phase 1: Parse (순차 필수)
  ↓
Phase 2: Architecture (순차 필수)
  ↓
Phase 3-8: 병렬 실행 가능
  ├─ Database Agent
  ├─ Frontend Agent
  ├─ Backend Agent
  ├─ Config Agent
  ├─ Testing Agent
  └─ Deployment Agent
  ↓
Phase 9: Fix (순차 필수)
```

**성능 개선**:
- Phase 3-8 순차 실행: ~390초
- Phase 3-8 병렬 실행: ~160초
- **절감 시간**: 230초 (약 4분)
- **개선율**: 59% 단축

#### Sub Agents (9개)

**구현 위치**: `.claude/agents/`

| Agent | Model | 역할 |
|-------|-------|------|
| parse-agent | haiku | Spec → JSON 파싱 |
| architecture-agent | sonnet | 프로젝트 구조 설계 |
| database-agent | sonnet | DB 스키마 생성 |
| frontend-agent | sonnet | React 컴포넌트 생성 |
| backend-agent | sonnet | API Routes 생성 |
| config-agent | sonnet | 설정 파일 생성 |
| testing-agent | sonnet | 테스트 코드 생성 |
| deployment-agent | sonnet | Docker/CI/CD 생성 |
| fix-agent | sonnet | 에러 자동 수정 |

**공통 패턴**:
```markdown
---
name: {agent-name}
description: {description} using {skill-name} skill
tools: Read, Write, Glob
model: haiku | sonnet
---

## How You Work
1. Read inputs
2. Use the `{skill}` skill
3. Validate output
4. Return summary
```

**제약사항**:
- Sub Agent는 사용자와 직접 대화 불가
- Command가 사용자 인터랙션 담당
- Parent-Delegate 패턴 사용

#### 사용 시나리오

- 대화형 개발 (권장)
- 복잡한 워크플로우
- 사용자 피드백이 중요한 경우
- 병렬 실행으로 빠른 생성 필요

---

## 선택 가이드

### 언제 어떤 버전을 사용해야 하나요?

```
질문 1: 자동화가 필요한가요?
  ├─ YES → v1.0 (CLI/API)
  │         CI/CD, 배치 작업, 스크립트 통합
  │
  └─ NO → 질문 2로

질문 2: AI와 대화하며 개발하고 싶나요?
  ├─ YES → 질문 3으로
  │
  └─ NO → v1.0 (CLI/API)

질문 3: Command 빠른 진입이 필요한가요?
  ├─ YES → v3.0 (Command + Skills + Sub Agents) ⭐ 권장
  │         대화형 개발, /sdd 한 번에 시작
  │
  └─ NO → v2.0 (Skills)
            유연한 실행, 원하는 단계만 실행
```

### 비교표

| 항목 | v1.0 (CLI/API) | v2.0 (Skills) | v3.0 (Command + Agents + Skills) |
|------|----------------|---------------|----------------------------------|
| **실행 방법** | `npm run generate` | `/generate` | `/generate` |
| **대화형** | ❌ | ✅ | ✅ |
| **Interactive Mode** | ❌ | ❌ | ✅ (각 Phase 확인) |
| **Checkpoint** | ❌ | ❌ | ✅ (자동 저장/복구) |
| **병렬 실행** | ❌ | ❌ | ✅ (Phase 3-8) |
| **속도 (순차)** | ~5분 | ~8-10분 | ~8-10분 |
| **속도 (병렬)** | N/A | N/A | ~4-5분 (59% 단축) |
| **자동화** | ✅ | ⚠️ (부분적) | ✅ (--auto 모드) |
| **유연성** | ❌ (전체 실행) | ✅ (단계별 실행) | ✅ (modify/skip 가능) |
| **Context 공유** | N/A | ✅ (메인 Context) | ✅ (메인 Context) |
| **Sub Agents** | ❌ | ❌ | ✅ (9개, 병렬 가능) |
| **CI/CD 통합** | ✅ | ❌ | ⚠️ (API 래퍼 필요) |
| **에러 복구** | ❌ (전체 재시작) | ❌ (전체 재시작) | ✅ (중단 지점부터) |
| **권장 시나리오** | 자동화, 배치 | 학습, 실험 | 대화형 개발 ⭐ |

---

## 10개 컴포넌트 상세

### 0. Spec Writer

**역할**: Spec 작성, 개선, 검토

**입력**:
- 사용자 아이디어 (텍스트)
- 기존 Spec 파일 (선택적)

**출력**:
- `specs/*.md` 파일

**특징**:
- 3가지 모드: new (신규), refine (개선), review (검토)
- AI 대화형 기획 지원
- 자동 검증 및 수정

**v1.0**: `npm run spec:new -- --idea "My App"`
**v2.0/v3.0**: `/generate` 실행 시 자동 호출

---

### 1. Spec Parser

**역할**: Markdown → JSON 파싱

**입력**:
- `specs/my-app.md`

**출력**:
- `.temp/parsed-spec.json`

```json
{
  "projectName": "my-app",
  "description": "간단한 할 일 관리 앱",
  "dataModels": [
    {
      "name": "Todo",
      "fields": [
        { "name": "id", "type": "string" },
        { "name": "title", "type": "string" },
        { "name": "completed", "type": "boolean" }
      ]
    }
  ],
  "features": ["Todo 추가", "Todo 완료", "Todo 삭제"],
  "techStack": {
    "framework": "Next.js 14",
    "database": "PostgreSQL",
    "orm": "Prisma"
  }
}
```

**v1.0**: `SpecParserAgent.execute()`
**v2.0/v3.0**: `/parse` Skill

---

### 2. Architecture

**역할**: 프로젝트 구조 설계

**입력**:
- `.temp/parsed-spec.json`

**출력**:
- `.temp/architecture.json`

```json
{
  "files": [
    {
      "path": "app/page.tsx",
      "type": "page",
      "dependencies": ["@/components/TodoList"]
    },
    {
      "path": "components/TodoList.tsx",
      "type": "component",
      "dependencies": []
    },
    {
      "path": "app/api/todos/route.ts",
      "type": "api",
      "dependencies": ["@/lib/database/client"]
    }
  ],
  "totalFiles": 68
}
```

**v1.0**: `ArchitectureAgent.execute()`
**v2.0/v3.0**: `/architecture` Skill

---

### 3. Database

**역할**: DB 스키마 및 ORM 코드 생성

**입력**:
- `.temp/parsed-spec.json`
- `.temp/architecture.json`

**출력** (~4-12 files):
- `prisma/schema.prisma`
- `lib/database/client.ts`
- `prisma/seed.ts`
- `lib/database/migrations/`

**예시** (`prisma/schema.prisma`):
```prisma
model Todo {
  id        String   @id @default(uuid())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**v1.0**: `DatabaseAgent.execute()`
**v2.0/v3.0**: `/database` Skill

---

### 4. Frontend

**역할**: React/Next.js 컴포넌트 생성

**입력**:
- `.temp/parsed-spec.json`
- `.temp/architecture.json`

**출력** (~20-40 files):
- `components/ui/*.tsx`
- `components/forms/*.tsx`
- `app/*/page.tsx`
- `contexts/*Provider.tsx`

**예시** (`components/TodoList.tsx`):
```tsx
'use client';

import { useState, useEffect } from 'react';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    fetch('/api/todos')
      .then(res => res.json())
      .then(setTodos);
  }, []);

  return (
    <ul className="space-y-2">
      {todos.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

**v1.0**: `FrontendAgent.execute()`
**v2.0/v3.0**: `/frontend` Skill

---

### 5. Backend

**역할**: API Routes 및 Server 로직 생성

**입력**:
- `.temp/parsed-spec.json`
- `.temp/architecture.json`

**출력** (~10-20 files):
- `app/api/**/route.ts`
- `lib/actions/*.ts`
- `middleware.ts`

**예시** (`app/api/todos/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/client';

export async function GET() {
  const todos = await prisma.todo.findMany();
  return NextResponse.json(todos);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const todo = await prisma.todo.create({ data: body });
  return NextResponse.json(todo, { status: 201 });
}
```

**v1.0**: `BackendAgent.execute()`
**v2.0/v3.0**: `/backend` Skill

---

### 6. Config

**역할**: 설정 파일 생성 (템플릿 기반, AI 호출 없음)

**입력**:
- `.temp/parsed-spec.json`
- `.temp/architecture.json`
- Database 정보 (ORM 감지)

**출력** (9 files):
- `package.json`
- `tsconfig.json`
- `tailwind.config.ts`
- `.env.example`
- `next.config.js`
- `.eslintrc.json`
- `.prettierrc`
- `.gitignore`
- `README.md`

**특징**:
- Database Agent가 생성한 ORM 자동 감지
- 필요한 의존성 자동 포함 (Prisma, Drizzle 등)

**v1.0**: `ConfigAgent.execute()`
**v2.0/v3.0**: `/config` Skill

---

### 7. Testing

**역할**: 테스트 파일 자동 생성

**입력**:
- `.temp/parsed-spec.json`
- `.temp/architecture.json`
- Frontend/Backend 파일 목록

**출력** (~15-50 files):
- `components/**/*.test.tsx`
- `app/api/**/*.test.ts`
- `e2e/**/*.spec.ts`
- `vitest.config.ts`
- `playwright.config.ts`

**예시** (`components/TodoList.test.tsx`):
```tsx
import { render, screen } from '@testing-library/react';
import { TodoList } from './TodoList';

describe('TodoList', () => {
  it('renders todo items', async () => {
    render(<TodoList />);
    // ...
  });
});
```

**v1.0**: `TestingAgent.execute()`
**v2.0/v3.0**: `/testing` Skill

---

### 8. Deployment

**역할**: Docker, CI/CD 설정 생성 (템플릿 기반)

**입력**:
- `.temp/parsed-spec.json`
- `.temp/architecture.json`
- Database 정보 (ORM 감지)

**출력** (5 files):
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `.github/workflows/ci.yml`
- `DEPLOYMENT.md`

**예시** (`docker-compose.yml`):
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=postgres
```

**v1.0**: `DeploymentAgent.execute()`
**v2.0/v3.0**: `/deployment` Skill

---

### 9. Fix

**역할**: TypeScript/ESLint 에러 자동 수정

**입력**:
- `output/my-app/` (생성된 프로젝트)

**프로세스**:
1. TypeScript/ESLint 에러 검사
2. 에러를 파일별로 그룹화
3. Claude에게 각 파일 수정 요청
4. 수정된 코드 적용
5. 재검증 (최대 3회)

**출력**:
- 수정된 파일 목록
- 에러 수정 통계

**v1.0**: `FixAgent.execute()`
**v2.0/v3.0**: `/fix` Skill

---

## 실행 흐름

### v1.0 실행 흐름 (CLI)

```
$ npm run generate specs/todo-app.md
  ↓
cli.ts
  ↓
Phase 0: SpecParserAgent.execute()
  → .temp/parsed-spec.json
  ↓
Phase 1: ArchitectureAgent.execute()
  → .temp/architecture.json
  ↓
Phase 2: DatabaseAgent.execute()
  → prisma/schema.prisma, seed.ts, ...
  ↓
Phase 3: FrontendAgent.execute()
  → components/, app/, ...
  ↓
Phase 4: BackendAgent.execute()
  → app/api/, lib/actions/, ...
  ↓
Phase 5: ConfigAgent.execute()
  → package.json, tsconfig.json, ...
  ↓
Phase 6: TestingAgent.execute()
  → test files, test configs
  ↓
Phase 7: DeploymentAgent.execute()
  → Dockerfile, CI/CD configs
  ↓
Phase 8: FixAgent.execute()
  → 에러 검사 및 자동 수정
  ↓
Complete! (~5분)
```

---

### v2.0/v3.0 실행 흐름 (Claude Code)

```
User: /sdd "Todo App"
  ↓
Command: generate.md (v3.0만 해당)
  - 파라미터 검증
  - /generate 호출
  ↓
Skill: generate.md
  - Spec 확인 (specs/todo-app.md)
  - 없으면 대화형 작성
  - 있으면 다음 단계로
  ↓
Skill: parse.md
  - Spec → JSON 파싱
  - .temp/parsed-spec.json 생성
  ↓
Skill: architecture.md
  - 프로젝트 구조 설계
  - .temp/architecture.json 생성
  ↓
Skill: database.md
  - DB 스키마 생성
  - prisma/schema.prisma, seed.ts, ...
  ↓
Skill: frontend.md
  - React 컴포넌트 생성
  - components/, app/, ...
  ↓
Skill: backend.md
  - API Routes 생성
  - app/api/, lib/actions/, ...
  ↓
Skill: config.md
  - 설정 파일 생성
  - package.json, tsconfig.json, ...
  ↓
Skill: ssd-testing.md
  - 테스트 코드 생성
  - test files, test configs
  ↓
Skill: deployment.md
  - Docker/CI 설정 생성
  - Dockerfile, docker-compose.yml, ...
  ↓
Skill: fix.md
  - 에러 검사 및 자동 수정
  - 수정된 파일 목록 출력
  ↓
Complete! (~5-10분)
  - 각 단계마다 사용자 확인 가능
  - 에러 발생 시 즉시 피드백
```

---

## 데이터 흐름

### 중간 산출물

```
.temp/                      # 중간 산출물 디렉토리
├── parsed-spec.json       # Spec Parser 출력
└── architecture.json      # Architecture 출력
```

### 최종 출력

```
output/my-app/              # 생성된 Next.js 앱
├── app/                   # Next.js App Router
│   ├── page.tsx          # 메인 페이지
│   ├── layout.tsx        # 레이아웃
│   └── api/              # API Routes
│       └── todos/
│           └── route.ts
├── components/            # React 컴포넌트
│   ├── ui/
│   └── forms/
├── lib/                   # 유틸리티
│   ├── database/
│   │   └── client.ts
│   └── actions/
├── prisma/                # Prisma 스키마
│   ├── schema.prisma
│   └── seed.ts
├── __tests__/             # 테스트 파일
│   ├── components/
│   ├── api/
│   └── e2e/
├── package.json           # 의존성
├── tsconfig.json          # TS 설정
├── tailwind.config.ts     # Tailwind 설정
├── Dockerfile             # Docker 설정
├── docker-compose.yml     # Docker Compose
└── .github/               # CI/CD
    └── workflows/
        └── ci.yml
```

---

## 프로젝트 구조

### Dual Structure (v1.0 + v2.0/v3.0)

```
sdd-system/
├── lib/                          # v1.0: CLI/API 구현
│   └── agents/
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
├── .claude/                      # v2.0/v3.0: Claude Code
│   ├── commands/                 # v3.0 Commands (Entry)
│   │   └── generate.md               # /sdd 명령어
│   │
│   └── skills/                   # v2.0/v3.0 Skills
│       ├── generate.md      # 메인 오케스트레이터
│       ├── parse.md
│       ├── architecture.md
│       ├── database.md
│       ├── frontend.md
│       ├── backend.md
│       ├── config.md
│       ├── testing.md
│       ├── deployment.md
│       └── fix.md
│
├── specs/                        # 입력: Spec 파일
│   ├── todo-app.md
│   └── voice-journal-web.md
│
├── .temp/                        # 중간 산출물
│   ├── parsed-spec.json
│   └── architecture.json
│
├── output/                       # 출력: 생성된 앱
│   ├── todo-app/
│   └── voice-journal-web/
│
├── cli.ts                        # v1.0 CLI 진입점
├── package.json
├── tsconfig.json
├── README.md
└── docs/
    ├── SDD_SYSTEM_ARCHITECTURE.md      # 이 문서
    ├── AGENT_ARCHITECTURE.md           # v1.0 Agent 상세
    ├── CLAUDE_CODE_LEARNING.md         # Claude Code 학습
    ├── IMPLEMENTATION_GUIDE.md
    └── IMPLEMENTATION_LOG.md
```

### 왜 Dual Structure인가?

1. **v1.0 (lib/agents/)**: 자동화, CI/CD, TypeScript API 필요
2. **v2.0/v3.0 (.claude/)**: 대화형 개발, 유연한 실행 필요
3. **공존 이유**: 각 버전이 서로 다른 사용 시나리오에 최적화

---

## 참고 자료

### 상세 문서

- [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md) - v1.0 Agent 상세 설계
- [CLAUDE_CODE_LEARNING.md](./CLAUDE_CODE_LEARNING.md) - Claude Code 학습 가이드
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Agent 구현 가이드
- [IMPLEMENTATION_LOG.md](./IMPLEMENTATION_LOG.md) - 구현 기록

### Claude Code 공식 문서

- [Claude Code GitHub](https://github.com/anthropics/claude-code)
- [Skills Documentation](https://github.com/anthropics/claude-code/blob/main/docs/skills.md)
- [Commands Documentation](https://github.com/anthropics/claude-code/blob/main/docs/slash-commands.md)

### 관련 기술

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Claude API (Anthropic)](https://docs.anthropic.com/)

---

**마지막 업데이트**: 2025-12-25
**버전**: 3.0
**작성자**: Claude Sonnet 4.5

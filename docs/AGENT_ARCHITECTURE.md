# SDD System - Agent Architecture

> Spec-Driven Development 자동화를 위한 AI Agent 시스템 아키텍처

---

## 📋 목차

- [개요](#개요)
- [Agent 구조](#agent-구조)
- [Agent 상세 명세](#agent-상세-명세)
- [실행 흐름](#실행-흐름)
- [구현 현황](#구현-현황)

---

## 개요

### 설계 원칙

1. **단일 책임**: 각 Agent는 하나의 명확한 책임만 가짐
2. **독립성**: Agent는 독립적으로 동작하며 교체 가능
3. **조합성**: Agent들을 조합하여 복잡한 작업 수행
4. **점진적 확장**: 최소 Agent로 시작해 필요에 따라 추가

### 핵심 개념

```typescript
// Agent의 기본 인터페이스
interface Agent<TInput, TOutput> {
  name: string;
  version: string;

  execute(input: TInput): Promise<TOutput>;
}
```

---

## Agent 구조

### Base Agent (추상 클래스)

**모든 Agent의 부모 클래스**로, 공통 기능을 제공합니다.

```typescript
// lib/agents/base-agent.ts
export abstract class BaseAgent<TInput, TOutput> {
  protected anthropic: Anthropic;
  protected context: AgentContext;

  public readonly name: string;
  public readonly version: string;

  // 각 Agent가 구현해야 하는 메서드
  abstract execute(input: TInput): Promise<TOutput>;

  // 공통 기능
  protected async callClaude(prompt: string, system?: string): Promise<string>;
  protected async loadInstructions(agentDir: string): Promise<string>;
  protected extractJSON<T>(response: string): T;
  protected extractCodeBlocks(response: string): Map<string, string>;
  protected log(message: string, isError?: boolean): void;
}
```

**제공하는 공통 기능:**

1. **`callClaude()`** - Claude API 호출
2. **`loadInstructions()`** - AGENT.md 파일 로드
3. **`extractJSON()`** - 응답에서 JSON 추출
4. **`extractCodeBlocks()`** - 코드 블록 추출
5. **`log()`** - 로깅

---

## Agent 상세 명세

### Phase 0: Spec 작성 (선택적)

#### Agent 0: Spec Writer Agent ✅

**역할**: AI와 대화하며 애플리케이션 명세서 작성/개선/검토

**Input**:
```typescript
interface SpecWriterInput {
  mode: 'new' | 'refine' | 'review';
  idea?: string;                    // 새 spec 작성 시
  templateType?: TemplateType;      // 템플릿 타입
  existingSpecPath?: string;        // 기존 spec 경로
  outputPath?: string;
  autoFix?: boolean;                // 검토 모드 자동 수정
}
```

**Output**:
```typescript
interface SpecWriterOutput {
  specPath: string;
  reviewResults: {
    consistency: number;      // 0-100
    completeness: number;     // 0-100
    feasibility: number;      // 0-100
    overall: number;          // 0-100
    issues: Issue[];
    suggestions: Suggestion[];
  };
  stats: {
    totalLines: number;
    dataModelsCount: number;
    apiEndpointsCount: number;
    pagesCount: number;
  };
}
```

**동작**:
1. **NEW 모드**: 아이디어 → 완전한 Spec 생성
2. **REFINE 모드**: 기존 Spec 개선 (누락 섹션, 불일치 수정)
3. **REVIEW 모드**: Spec 검토 및 자동 수정

**파일**:
- `lib/agents/spec-writer/index.ts`
- `lib/agents/spec-writer/types.ts`
- `lib/agents/spec-writer/AGENT.md`
- `lib/agents/spec-writer/templates/` (템플릿들)
- `spec-writer-cli.ts` (독립 CLI)

**CLI 사용**:
```bash
npm run spec:new -- --idea "Personal finance tracker" --template financial
npm run spec:refine specs/my-app.md
npm run spec:review specs/my-app.md --fix
```

---

### Phase 1: 입력 처리

#### Agent 1: Spec Parser Agent ✅

**역할**: Markdown 명세서를 구조화된 JSON으로 변환

**Input**:
```typescript
interface SpecParserInput {
  specPath: string; // Spec 파일 경로
}
```

**Output**:
```typescript
interface SpecParserOutput {
  projectName: string;
  description: string;
  features: string[];
  techStack: TechStack;
  dataModels: DataModel[];
  apiEndpoints?: ApiEndpoint[];
  uiComponents?: UIComponent[];
  requirements?: Requirements;
}
```

**동작**:
1. Markdown 파일 읽기
2. Claude API 호출 (AGENT.md의 지시사항 전달)
3. 구조화된 JSON 추출
4. `.temp/parsed-spec.json` 저장

**파일**:
- `lib/agents/spec-parser/index.ts`
- `lib/agents/spec-parser/types.ts`
- `lib/agents/spec-parser/AGENT.md`

---

### Phase 2: 아키텍처 설계

#### Agent 2: Architecture Agent ✅

**역할**: 프로젝트 구조 및 파일 리스트 설계

**Input**:
```typescript
interface ArchitectureInput {
  parsedSpec: SpecParserOutput;
}
```

**Output**:
```typescript
interface ArchitectureOutput {
  projectName: string;
  framework: string;
  fileList: FileSpec[];
}

interface FileSpec {
  path: string;      // 파일 경로
  type: string;      // 파일 타입
  purpose: string;   // 파일 목적
}
```

**동작**:
1. Spec Parser 결과 분석
2. Next.js 14 App Router 구조 설계
3. 필요한 파일 리스트 생성
4. `.temp/architecture.json` 저장

**파일**:
- `lib/agents/architecture/index.ts`
- `lib/agents/architecture/types.ts`
- `lib/agents/architecture/AGENT.md`

---

### Phase 2-5: 코드 생성 (4개)

### Phase 3: 코드 생성

#### Agent 3: Database Agent ✅

**역할**: 데이터베이스 스키마 및 ORM 코드 생성

**Input**:
```typescript
interface DatabaseInput {
  parsedSpec: SpecParserOutput;
  architecture: ArchitectureOutput;
}
```

**Output**:
```typescript
interface DatabaseOutput {
  projectPath: string;
  schemaFiles: GeneratedSchemaFile[];
  migrationFiles: GeneratedMigrationFile[];
  seedFiles: GeneratedSeedFile[];
  clientFiles: GeneratedClientFile[];
  filesGenerated: number;
}
```

**동작**:
1. Data models 분석
2. ORM 결정 (Prisma vs Drizzle)
3. Schema 파일 생성
4. Database client 생성
5. Seed data 생성

**생성 파일** (Prisma 예시):
- `prisma/schema.prisma` - Schema 정의
- `lib/database/client.ts` - Client singleton
- `lib/database/index.ts` - Re-exports
- `prisma/seed.ts` - Seed data

**파일**:
- `lib/agents/database/index.ts`
- `lib/agents/database/types.ts`
- `lib/agents/database/AGENT.md`

---

#### Agent 4: Frontend Agent ✅

**역할**: React/Next.js 컴포넌트 생성

**Input**:
```typescript
interface FrontendInput {
  parsedSpec: SpecParserOutput;
  architecture: ArchitectureOutput;
}
```

**Output**:
```typescript
interface FrontendOutput {
  projectPath: string;
  components: GeneratedComponent[];
  pages: GeneratedPage[];
  providers: GeneratedProvider[];
  filesGenerated: number;
}
```

**동작**:
1. Frontend 파일 필터링 (app/, components/, contexts/)
2. Atomic Design 패턴 적용 (atoms, molecules, organisms)
3. 컴포넌트 생성 (TypeScript + Tailwind CSS)
4. Server/Client Component 자동 구분
5. Accessibility 자동 적용

**생성 파일 예시**:
- `components/ui/Button.tsx` - UI 컴포넌트
- `components/forms/TodoForm.tsx` - Feature 컴포넌트
- `app/page.tsx` - 페이지
- `contexts/QueryProvider.tsx` - Provider

**파일**:
- `lib/agents/frontend/index.ts`
- `lib/agents/frontend/types.ts`
- `lib/agents/frontend/AGENT.md`

---

#### Agent 5: Backend Agent ✅

**역할**: API Routes 및 Server 로직 생성

**Input**:
```typescript
interface BackendInput {
  parsedSpec: SpecParserOutput;
  architecture: ArchitectureOutput;
}
```

**Output**:
```typescript
interface BackendOutput {
  projectPath: string;
  apiRoutes: GeneratedAPIRoute[];
  serverActions: GeneratedServerAction[];
  middleware: GeneratedMiddleware[];
  utilities: GeneratedUtility[];
  filesGenerated: number;
}
```

**동작**:
1. Backend 파일 필터링 (app/api/, lib/actions/, middleware.ts)
2. API Routes 생성 (RESTful)
3. Server Actions 생성
4. Middleware 생성
5. Validation with Zod

**생성 파일 예시**:
- `app/api/todos/route.ts` - API Route
- `app/api/todos/[id]/route.ts` - Dynamic Route
- `lib/actions/todos.ts` - Server Actions
- `middleware.ts` - Middleware

**파일**:
- `lib/agents/backend/index.ts`
- `lib/agents/backend/types.ts`
- `lib/agents/backend/AGENT.md`

---

#### Agent 6: Config Agent ✅

**역할**: 프로젝트 설정 파일 생성 (템플릿 기반, AI 호출 없음)

**Input**:
```typescript
interface ConfigInput {
  parsedSpec: SpecParserOutput;
  architecture: ArchitectureOutput;
  database?: DatabaseOutput; // Database Agent 결과
}
```

**Output**:
```typescript
interface ConfigOutput {
  projectPath: string;
  configFiles: GeneratedConfigFile[];
  filesGenerated: number;
}
```

**동작**:
1. Database Agent 결과에서 ORM 감지
2. Tech stack 기반 dependencies 동적 생성
3. 템플릿 기반 config 파일 생성 (API 호출 없음)

**생성 파일** (9개):
- `package.json` - Dependencies & scripts (ORM 자동 감지)
- `tsconfig.json` - TypeScript 설정
- `next.config.js` - Next.js 설정
- `tailwind.config.ts` - Tailwind 설정
- `postcss.config.js` - PostCSS 설정
- `.gitignore` - Git ignore
- `.env.example` - 환경 변수 예제
- `README.md` - 프로젝트 문서
- `.eslintrc.json` - ESLint 설정

**특징**:
- ✅ API 호출 없음 (비용 절감)
- ✅ 빠른 실행 (즉시 생성)
- ✅ Database Agent 인식 (Prisma/Drizzle 자동 설정)

**파일**:
- `lib/agents/config/index.ts`
- `lib/agents/config/types.ts`

---

### Phase 6-7: 배포 & 품질 (3개)

#### Agent 7: Deployment Agent ✅

**역할**: Docker, CI/CD 설정 생성 (템플릿 기반)

**Input**:
```typescript
interface DeploymentInput {
  parsedSpec: SpecParserOutput;
  architecture: ArchitectureOutput;
  database?: DatabaseOutput;
}
```

**Output**:
```typescript
interface DeploymentOutput {
  projectPath: string;
  dockerFiles: GeneratedDockerFile[];
  cicdFiles: GeneratedCICDFile[];
  filesGenerated: number;
}
```

**동작**:
1. 템플릿 기반 Dockerfile 생성
2. docker-compose.yml 생성
3. GitHub Actions workflow 생성
4. Vercel/AWS 설정 생성

**생성 파일**:
- `Dockerfile` - Docker 이미지
- `docker-compose.yml` - Local development
- `.github/workflows/ci.yml` - CI/CD
- `vercel.json` - Vercel 설정 (optional)

**특징**:
- ✅ 템플릿 기반 (AI 호출 없음)
- ✅ Database 연동 (DATABASE_URL 자동 설정)
- ✅ 빠른 배포 준비

**구현 상태**: 미구현
**구현 난이도**: 낮음 (Config Agent와 유사)
**구현 시간**: ~1시간

---

#### Agent 8: Testing Agent ✅

**역할**: 테스트 파일 자동 생성

**Input**:
```typescript
interface TestingInput{
  parsedSpec: SpecParserOutput;
  architecture: ArchitectureOutput;
  frontend: FrontendOutput;
  backend: BackendOutput;
}
```

**Output**:
```typescript
interface TestingOutput {
  projectPath: string;
  componentTests: GeneratedTest[];
  apiTests: GeneratedTest[];
  e2eTests: GeneratedTest[];
  filesGenerated: number;
}
```

**동작**:
1. Frontend 컴포넌트 분석
2. Backend API routes 분석
3. Component tests 생성 (React Testing Library)
4. API tests 생성 (Jest)
5. E2E tests 생성 (Playwright)

**생성 파일 예시**:
- `components/ui/Button.test.tsx` - Component test
- `app/api/todos/route.test.ts` - API test
- `e2e/todo-flow.spec.ts` - E2E test
- `vitest.config.ts` - Test config
- `playwright.config.ts` - E2E config

**특징**:
- ⚠️ Claude API 호출 필요
- ⭐⭐⭐ 테스트 커버리지 자동화
- 선택적 (수동 작성도 가능)

**구현 상태**: 미구현
**구현 난이도**: 중간
**구현 시간**: ~2-3시간

---

### Phase 4: 품질 보증

#### Agent 9: Fix Agent ✅

**역할**: 빌드 에러 자동 수정

**Input**:
```typescript
interface FixInput {
  projectPath: string;
  errors: CompilationError[]; // tsc, eslint 에러
}

interface CompilationError {
  file: string;
  line: number;
  column: number;
  message: string;
  code?: string;
}
```

**Output**:
```typescript
interface FixOutput {
  projectPath: string;
  fixedFiles: FixedFile[];
  unfixedErrors: CompilationError[];
  filesModified: number;
}
```

**동작**:
1. `tsc --noEmit` 실행 → TypeScript 에러 수집
2. `eslint .` 실행 → Lint 에러 수집
3. 각 에러를 Claude API에 전달
4. Claude가 수정된 코드 반환
5. 파일 덮어쓰기
6. 재검증

**사용 예시**:
```bash
# 생성 후 자동 수정
npm run generate specs/my-app.md --fix

# 또는 별도 실행
npm run fix output/my-app
```

**파일**:
- `lib/agents/fix/index.ts`
- `lib/agents/fix/types.ts`
- `lib/agents/fix/AGENT.md`

**특징**:
- ⭐⭐⭐⭐ 매우 높은 가치 (자동 수정)
- ✅ TypeScript + ESLint 에러 자동 수정
- 🔄 반복 수정 지원 (최대 3회 재시도)
- 📝 AGENT.md 기반 일관된 수정 품질

---

## 실행 흐름

### 전체 실행 흐름

```
User Input (specs/my-app.md)
    ↓
Phase 0: Spec Parser Agent
    → parsed-spec.json
    ↓
Phase 1: Architecture Agent
    → architecture.json
    ↓
Phase 2: Database Agent
    → prisma/schema.prisma, seed.ts, client.ts
    ↓
Phase 3: Frontend Agent
    → components/, app/ (pages)
    ↓
Phase 4: Backend Agent
    → app/api/, lib/actions/, middleware.ts
    ↓
Phase 5: Config Agent (Database 인식)
    → package.json (Prisma deps), tsconfig.json, etc.
    ↓
[Optional] Phase 6: Deployment Agent
    → Dockerfile, docker-compose.yml, .github/workflows/
    ↓
[Optional] Phase 7: Testing Agent
    → *.test.tsx, *.test.ts, e2e/*.spec.ts
    ↓
[Optional] Phase 8: Fix Agent
    → Auto-fix compilation errors
    ↓
Complete Next.js App
```

---

## 구현 현황

### ✅ 구현 완료 (8개)

| Agent | 이름 | 상태 | 생성 파일 수 | Claude API |
|-------|------|------|--------------|------------|
| 0 | Spec Writer | ✅ | 1 MD | ✅ |
| 1 | Spec Parser | ✅ | 1 JSON | ✅ |
| 2 | Architecture | ✅ | 1 JSON | ✅ |
| 3 | Database | ✅ | ~4-12 files | ✅ |
| 4 | Frontend | ✅ | ~20-40 files | ✅ |
| 5 | Backend | ✅ | ~10-20 files | ✅ |
| 6 | Config | ✅ | 9 files | ❌ (템플릿) |
| 9 | Fix | ✅ | 수정된 파일들 | ✅ |

**총 8개 Agent 완료 → 완전히 작동하는 Next.js 앱 생성 가능**

---

### ⏳ 구현 예정 (2개)

| Agent | 이름 | 우선순위 | 난이도 | 예상 시간 | Claude API |
|-------|------|----------|--------|-----------|------------|
| 7 | Deployment | ⭐⭐⭐ 높음 | 낮음 | ~1시간 | ❌ (템플릿) |
| 8 | Testing | ⭐⭐ 중간 | 중간 | ~2-3시간 | ✅ |

---

## Agent 간 데이터 흐름

### Input/Output 체이닝

```typescript
// Phase 0
const parsedSpec = await specParser.execute({ specPath });

// Phase 1
const architecture = await architectureAgent.execute({ parsedSpec });

// Phase 2
const database = await databaseAgent.execute({ parsedSpec, architecture });

// Phase 3
const frontend = await frontendAgent.execute({ parsedSpec, architecture });

// Phase 4
const backend = await backendAgent.execute({ parsedSpec, architecture });

// Phase 5 (Database 인식)
const config = await configAgent.execute({
  parsedSpec,
  architecture,
  database  // ✅ Database Agent 결과 전달
});

// Phase 6 (Optional)
const deployment = await deploymentAgent.execute({
  parsedSpec,
  architecture,
  database
});

// Phase 7 (Optional)
const testing = await testingAgent.execute({
  parsedSpec,
  architecture,
  frontend,
  backend
});

// Phase 8 (Optional)
const fixed = await fixAgent.execute({
  projectPath: config.projectPath,
  errors: compilationErrors
});
```

---

## 설계 결정 사항

### 왜 10개 Agent인가?

#### ❌ 제거된 Agent들 (19개)

**Phase 0-1 입력 처리:**
- ~~Input Validation Agent~~ → Spec Parser가 검증 포함
- ~~Requirement Analyzer Agent~~ → Architecture Agent가 분석 포함
- ~~Tech Stack Selector Agent~~ → Architecture Agent가 선택 포함

**Phase 2-3 코드 생성:**
- ~~Project Scaffolding Agent~~ → Config Agent로 통합
- ~~Auth Agent~~ → Backend Agent로 통합
- ~~Business Logic Agent~~ → Backend/Frontend Agent로 통합
- ~~Integration Agent~~ → 불필요 (Agent들이 이미 통합됨)

**Phase 4 품질 보증:**
- ~~Security Agent~~ → ESLint security 플러그인으로 대체
- ~~Performance Agent~~ → 수동 최적화가 더 효과적
- ~~Accessibility Agent~~ → Frontend Agent가 자동 적용

**Phase 5 문서화:**
- ~~Code Documentation Agent~~ → Frontend/Backend Agent가 JSDoc 포함
- ~~API Documentation Agent~~ → 수동 작성이 더 정확
- ~~User Guide Agent~~ → README.md로 충분

**Phase 6 배포 준비:**
- ~~Environment Config Agent~~ → Config Agent로 통합
- ~~Infrastructure Agent~~ → Deployment Agent로 통합
- ~~CI/CD Agent~~ → Deployment Agent로 통합
- ~~Monitoring Agent~~ → 프로덕션 후 수동 설정

**Phase 7 검증:**
- ~~Validation Agent~~ → 명령어로 충분 (`tsc`, `eslint`, `prettier`)
- ~~Build Verification Agent~~ → `npm run build`로 충분
- ~~Type Check Agent~~ → `tsc --noEmit`로 충분
- ~~Lint Agent~~ → `eslint .`로 충분

**Phase 8 배포:**
- ~~Deployment Execution Agent~~ → `vercel deploy` 명령어로 충분

---

### 왜 Frontend/Backend를 분리했는가?

#### Option A: 통합 Code Generator (1개)
```typescript
Code Generator Agent
  ├─ Database 코드
  ├─ Frontend 코드
  ├─ Backend 코드
  └─ Config 파일
```

**장점:**
- ✅ 단순함
- ✅ 파일 간 일관성

**단점:**
- ❌ Token 사용량 증가 (64K+ tokens)
- ❌ Rate limit 위험
- ❌ 에러 시 전체 재실행

---

#### Option B: 분리된 Agents (4개) ✅ 선택
```typescript
Database Agent  → 4-12 files
Frontend Agent  → 20-40 files
Backend Agent   → 10-20 files
Config Agent    → 9 files
```

**장점:**
- ✅ Token 사용량 분산 (각 32K-64K)
- ✅ Rate limit 회피
- ✅ 부분 재실행 가능
- ✅ Agent별 전문화 (AGENT.md)
- ✅ 병렬 실행 가능 (미래)

**단점:**
- ⚠️ 복잡도 약간 증가

**결론:** Rate limit 문제와 재실행 효율성을 고려해 분리 방식 선택

---

## 성능 최적화

### Token 사용량 관리

| Agent | Input Tokens | Output Tokens | Total | 비고 |
|-------|--------------|---------------|-------|------|
| Spec Parser | ~2K | ~2K | ~4K | JSON 생성 |
| Architecture | ~3K | ~5K | ~8K | 파일 리스트 |
| Database | ~4K | ~4K | ~8K | Schema + Seed |
| Frontend | ~6K | ~40K | ~46K | 20-40 files |
| Backend | ~4K | ~20K | ~24K | 10-20 files |
| Config | 0 | 0 | 0 | 템플릿 기반 |

**총 Token 사용량:** ~90K tokens (약 $0.30-0.50)

**최적화 전략:**
1. ✅ Config Agent는 템플릿 기반 (AI 호출 없음)
2. ✅ Database Agent는 32K max_tokens (충분)
3. ✅ Frontend/Backend는 64K max_tokens (여유)
4. ✅ 순차 실행으로 rate limit 회피

---

### 실행 시간

| Agent | 평균 시간 | 비고 |
|-------|-----------|------|
| Spec Parser | ~20초 | Claude API 호출 |
| Architecture | ~30초 | Claude API 호출 |
| Database | ~30초 | Claude API 호출 |
| Frontend | ~60초 | Claude API 호출 (대용량) |
| Backend | ~40초 | Claude API 호출 |
| Config | ~1초 | 템플릿 기반 (즉시) |

**총 실행 시간:** ~3분 (Todo 앱 기준)

---

## 확장성

### 미래 개선 사항

#### 단기 (v1.1-v1.2)

1. **새로운 Agent 추가 (v1.1)**
   - Deployment Agent (Docker, CI/CD)
   - Testing Agent (Component, API, E2E tests)
   - Fix Agent (자동 에러 수정)

2. **실행 제어 기능 (v1.2)**
   - **Interactive Mode**: 각 Agent 실행 후 결과 확인 & 계속 여부 선택
   - **Resume from Checkpoint**: 특정 Phase부터 재개 (시간 절약)
   - **Agent 선택 실행**: 원하는 Agent만 실행 (`--agents=frontend,backend`)
   - **Dry Run**: 실행 전 미리보기 & 비용 예측

#### 장기 (v2.0)

3. **병렬 실행**
   - Frontend/Backend/Database를 동시 실행
   - 실행 시간 ~60초로 단축

4. **Caching**
   - Spec Parser 결과 캐싱
   - 동일 Spec 재실행 시 재사용

5. **Incremental Generation**
   - 변경된 파일만 재생성
   - 전체 재생성 방지

6. **Web UI**
   - GUI 기반 Spec 작성
   - 실시간 미리보기

7. **Agent Marketplace**
   - 커뮤니티 제작 Agent 공유
   - 플러그인 시스템

---

## 결론

### 최종 Agent 구성 (10개)

**✅ 구현 완료 (8개):**
0. Spec Writer Agent
1. Spec Parser Agent
2. Architecture Agent
3. Database Agent
4. Frontend Agent
5. Backend Agent
6. Config Agent
9. Fix Agent

**⏳ 구현 예정 (2개):**
7. Deployment Agent (우선순위: 높음)
8. Testing Agent (우선순위: 중간)

**❌ 불필요 (19개):**
- Input Validation, Requirement Analyzer, Tech Stack Selector
- Project Scaffolding, Auth, Business Logic, Integration
- Security, Performance, Accessibility
- Code Docs, API Docs, User Guide
- Environment Config, Infrastructure, Monitoring
- Validation, Build Verification, Type Check, Lint
- Deployment Execution

### 왜 이 구성인가?

1. **MVP 완성**: 8개 Agent로 완전히 작동하는 Next.js 앱 생성 가능
2. **실용성**: 각 Agent가 명확한 가치 제공
3. **유지보수성**: 적절한 복잡도 유지
4. **확장성**: 필요 시 2개 Agent 추가 가능

---

**작성일**: 2025-12-20 (최종 업데이트)
**버전**: 3.0
**작성자**: Claude Sonnet 4.5

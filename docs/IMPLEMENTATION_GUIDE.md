# SDD System - Implementation Guide

> Agent 구현 실무 가이드: AGENT.md + TypeScript 방식

---

## 📋 목차

- [개요](#개요)
- [Option A: AGENT.md + TypeScript 방식](#option-a-agentmd--typescript-방식)
- [프로젝트 구조](#프로젝트-구조)
- [Agent 구현 프로세스](#agent-구현-프로세스)
- [Step 1: Core Agents 구현](#step-1-core-agents-구현)
- [CLI 통합](#cli-통합)
- [테스트](#테스트)
- [실전: Voice Journal 웹 버전 생성](#실전-voice-journal-웹-버전-생성)

---

## 개요

이 가이드는 **AGENT.md + TypeScript** 방식으로 SDD Agent를 구현하는 실무 방법을 설명합니다.

### 왜 이 방식인가?

```
✅ Instructions를 AGENT.md에 관리 → 가독성, 수정 용이
✅ 실제 구현은 TypeScript → 완전한 제어, 독립 실행
✅ Claude Code의 패턴 차용 → 익숙한 구조
✅ 버전 관리 가능 → Git으로 Instructions 추적
```

---

## Option A: AGENT.md + TypeScript 방식

### 핵심 개념

각 Agent는 **두 개의 파일**로 구성됩니다:

```
agents/my-agent/
├── AGENT.md     ⭐ Instructions (Prompt)
└── index.ts     ⭐ 구현 (TypeScript)
```

### 동작 방식

```typescript
// 1. AGENT.md를 읽어서
const instructions = await fs.readFile('AGENT.md', 'utf-8');

// 2. 입력과 함께 Claude에게 전달
const prompt = `${instructions}\n\n${input}`;
const response = await claude.messages.create({ prompt });

// 3. 결과 파싱 및 반환
return parseResponse(response);
```

### vs 다른 방식들

| 방식 | AGENT.md + TS | Claude Agent SDK | 순수 TypeScript |
|------|--------------|------------------|-----------------|
| Instructions 관리 | Markdown 파일 | 코드 내 문자열 | 코드 내 문자열 |
| 독립 실행 | ✅ | ✅ | ✅ |
| 수정 용이성 | ⭐⭐⭐ 매우 쉬움 | ⭐⭐ 중간 | ⭐ 어려움 |
| 가독성 | ⭐⭐⭐ 높음 | ⭐⭐ 중간 | ⭐ 낮음 |
| 버전 관리 | ✅ 명확 | ⚠️ 코드에 묻힘 | ⚠️ 코드에 묻힘 |
| Claude Code 호환 | ⚠️ 구조만 | ❌ | ❌ |

---

## 프로젝트 구조

### 전체 구조

```
sdd-system/
├── lib/
│   └── agents/
│       ├── base-agent.ts              # 모든 Agent의 기본 클래스
│       │
│       ├── spec-parser/               # Agent 1
│       │   ├── AGENT.md              # Prompt/Instructions
│       │   ├── index.ts              # 구현
│       │   └── types.ts              # Input/Output 타입
│       │
│       ├── architecture/              # Agent 2
│       │   ├── AGENT.md
│       │   ├── index.ts
│       │   └── types.ts
│       │
│       └── code-generator/            # Agent 3
│           ├── AGENT.md
│           ├── index.ts
│           └── types.ts
│
├── cli.ts                             # CLI 진입점
├── specs/                             # 테스트용 Spec 파일들
│   ├── simple-todo.md
│   └── voice-journal-web.md
├── output/                            # 생성된 앱들
├── .env                               # API Keys
├── package.json
└── tsconfig.json
```

### Agent 폴더 구조 (표준)

```
agents/my-agent/
├── AGENT.md                           # Agent Instructions
├── index.ts                           # Agent 구현
├── types.ts                           # TypeScript 타입
├── prompts/                           # 추가 Prompt 템플릿 (선택)
│   ├── system.md
│   └── examples.md
└── __tests__/                         # 테스트 (선택)
    └── my-agent.test.ts
```

---

## Agent 구현 프로세스

### 표준 프로세스 (5단계)

```
1. 타입 정의 (types.ts)
   → Input/Output 인터페이스

2. Instructions 작성 (AGENT.md)
   → Claude에게 줄 Prompt

3. Agent 클래스 구현 (index.ts)
   → BaseAgent 상속

4. 테스트
   → 실제 입력으로 검증

5. CLI 통합
   → Orchestrator에 등록
```

---

## Step 0: Spec Writer Agent (선택적)

### 0. Spec Writer Agent 구현

Spec을 작성하는 데 도움을 주는 AI 에이전트입니다. 사용자와 대화하며 애플리케이션 명세서를 작성, 개선, 검토합니다.

#### Step 0.1: 타입 정의

```typescript
// lib/agents/spec-writer/types.ts
import { SpecParserOutput } from '../spec-parser/types';

export type SpecWriterMode = 'new' | 'refine' | 'review';
export type TemplateType = 'basic' | 'dashboard' | 'ecommerce' | 'financial' | 'social';

export interface SpecWriterInput {
  mode: SpecWriterMode;

  // 새 spec 작성 시
  idea?: string; // 사용자 아이디어
  templateType?: TemplateType; // 템플릿 타입

  // 기존 spec 개선/검토 시
  existingSpecPath?: string;

  // 옵션
  interactive?: boolean;
  outputPath?: string;
  autoFix?: boolean; // 검토 모드에서 자동 수정
}

export interface SpecWriterOutput {
  specPath: string;
  mode: SpecWriterMode;
  parsedSpec?: SpecParserOutput;
  sections: {
    projectInfo: boolean;
    features: boolean;
    dataModels: boolean;
    apiEndpoints: boolean;
    pages: boolean;
    techStack: boolean;
    seedData: boolean;
  };
  reviewResults: ReviewResults;
  stats: {
    totalLines: number;
    dataModelsCount: number;
    apiEndpointsCount: number;
    pagesCount: number;
  };
}

export interface ReviewResults {
  consistency: number;    // 0-100
  completeness: number;   // 0-100
  feasibility: number;    // 0-100
  overall: number;        // 0-100
  issues: Issue[];
  suggestions: Suggestion[];
}
```

#### Step 0.2: Instructions 작성

```markdown
<!-- lib/agents/spec-writer/AGENT.md -->

# Spec Writer Agent

You are an expert specification writer for web applications.
Your role is to help users create, refine, and review application specifications.

## Modes

### 1. NEW Mode
Create a new specification from scratch based on user's idea.

### 2. REFINE Mode
Improve an existing specification by filling gaps and enhancing quality.

### 3. REVIEW Mode
Review a specification and provide quality scores and suggestions.

## Spec Format

All specifications should follow this structure:

1. Project Information (name, purpose, target users)
2. Core Features (list of main features)
3. Data Models (TypeScript interfaces)
4. API Endpoints (RESTful endpoints)
5. Page Structure (UI/UX design)
6. Tech Stack (recommended technologies)
7. Seed Data (initial data examples)

## Review Criteria

- **Consistency**: Are data models consistent with API endpoints?
- **Completeness**: Are all necessary sections present?
- **Feasibility**: Is the spec realistic and implementable?
```

#### Step 0.3: Agent 구현

```typescript
// lib/agents/spec-writer/index.ts
import { BaseAgent } from '../base-agent';
import { SpecWriterInput, SpecWriterOutput } from './types';

export class SpecWriterAgent extends BaseAgent<SpecWriterInput, SpecWriterOutput> {
  async execute(input: SpecWriterInput): Promise<SpecWriterOutput> {
    const instructions = await this.loadInstructions(__dirname);

    switch (input.mode) {
      case 'new':
        return await this.executeNewMode(input, instructions);
      case 'refine':
        return await this.executeRefineMode(input, instructions);
      case 'review':
        return await this.executeReviewMode(input, instructions);
    }
  }

  private async reviewSpec(specPath: string, instructions: string): Promise<ReviewResults> {
    const specContent = await fs.readFile(specPath, 'utf-8');
    const prompt = `Review this specification:\n\n${specContent}`;
    const response = await this.callClaude(prompt, instructions);
    return this.extractJSON<ReviewResults>(response);
  }
}
```

#### Step 0.4: CLI 통합

```bash
# package.json scripts
{
  "spec:new": "tsx spec-writer-cli.ts new",
  "spec:refine": "tsx spec-writer-cli.ts refine",
  "spec:review": "tsx spec-writer-cli.ts review",
  "spec:help": "tsx spec-writer-cli.ts help"
}
```

**사용법**:
```bash
# 새 spec 작성
npm run spec:new -- --idea "Personal finance tracker" --template financial

# 기존 spec 개선
npm run spec:refine specs/my-app.md

# Spec 검토
npm run spec:review specs/my-app.md
```

---

## Step 1: Core Agents 구현

### 1. Base Agent 구현

모든 Agent의 기본이 되는 클래스입니다.

```typescript
// lib/agents/base-agent.ts
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs-extra';
import path from 'path';

export interface AgentContext {
  workingDirectory: string;
  verbose?: boolean;
}

export abstract class BaseAgent<TInput = any, TOutput = any> {
  protected anthropic: Anthropic;
  protected context: AgentContext;
  protected agentDir: string;

  public readonly name: string;
  public readonly version: string;

  constructor(
    name: string,
    agentDir: string,
    apiKey: string,
    context: AgentContext
  ) {
    this.name = name;
    this.version = '1.0.0';
    this.agentDir = agentDir;
    this.anthropic = new Anthropic({ apiKey });
    this.context = context;
  }

  /**
   * 메인 실행 메서드 (각 Agent가 구현)
   */
  abstract execute(input: TInput): Promise<TOutput>;

  /**
   * AGENT.md 파일 로드
   */
  protected async loadInstructions(): Promise<string> {
    const agentMdPath = path.join(this.agentDir, 'AGENT.md');

    if (!await fs.pathExists(agentMdPath)) {
      throw new Error(`AGENT.md not found at ${agentMdPath}`);
    }

    return fs.readFile(agentMdPath, 'utf-8');
  }

  /**
   * Claude API 호출
   */
  protected async callClaude(
    prompt: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    this.log('Calling Claude API...');

    const response = await this.anthropic.messages.create({
      model: options?.model || 'claude-sonnet-4-20250514',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }],
      ...(options?.systemPrompt && { system: options.systemPrompt })
    });

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    this.log(`Response received: ${content.length} characters`);
    return content;
  }

  /**
   * 응답에서 JSON 추출
   */
  protected extractJSON<T = any>(response: string): T {
    // ```json ... ``` 형식 파싱
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // 직접 JSON 찾기
    const directMatch = response.match(/\{[\s\S]*\}/);
    if (directMatch) {
      return JSON.parse(directMatch[0]);
    }

    throw new Error('No JSON found in response');
  }

  /**
   * 응답에서 코드 블록 추출
   */
  protected extractCodeBlocks(response: string): Map<string, string> {
    const blocks = new Map<string, string>();

    // ```typescript path/to/file.ts ... ``` 형식
    const regex = /```(?:typescript|javascript|tsx|jsx)?\s*(?:\/\/\s*)?(.+\.(?:ts|tsx|js|jsx|json|css|md))\n([\s\S]*?)```/g;

    let match;
    while ((match = regex.exec(response)) !== null) {
      const filename = match[1].trim();
      const code = match[2].trim();
      blocks.set(filename, code);
    }

    return blocks;
  }

  /**
   * 로깅
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    if (this.context.verbose || level === 'error') {
      const prefix = `[${this.name}]`;
      const timestamp = new Date().toISOString();
      console.log(`${timestamp} ${prefix} ${message}`);
    }
  }
}
```

---

### 2. Spec Parser Agent 구현

#### Step 2.1: 타입 정의

```typescript
// lib/agents/spec-parser/types.ts
export interface SpecParserInput {
  specFilePath: string;
}

export interface ParsedSpec {
  project: {
    name: string;
    description: string;
  };
  features: Array<{
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  techStack: {
    frontend?: string;
    backend?: string;
    database?: string;
    orm?: string;
    auth?: string;
    styling?: string;
  };
  dataModels: Array<{
    name: string;
    fields: Array<{
      name: string;
      type: string;
      required?: boolean;
      unique?: boolean;
      default?: any;
    }>;
    relations?: Array<{
      type: 'oneToMany' | 'manyToOne' | 'manyToMany';
      model: string;
      field: string;
    }>;
  }>;
  screens?: Array<{
    name: string;
    route: string;
    description: string;
    components?: string[];
  }>;
  apiEndpoints?: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    auth?: boolean;
  }>;
}
```

#### Step 2.2: Instructions 작성

```markdown
<!-- lib/agents/spec-parser/AGENT.md -->

# Spec Parser Agent

You are an expert specification parser. Your role is to read markdown specification documents and extract structured data.

## Instructions

1. **Read the entire specification carefully**
2. **Extract project information** from the overview section
3. **Identify all features** mentioned in the document
4. **Parse data models** from TypeScript interfaces or descriptions
5. **Extract technical stack** information
6. **List all screens/pages** if mentioned
7. **Extract API endpoints** if specified

## Priority Inference Rules

- Keywords "must", "required", "critical" → `high` priority
- Keywords "should", "important" → `medium` priority
- Keywords "could", "nice to have", "optional" → `low` priority
- If unclear → `medium` priority

## Output Format

Return a JSON object with this EXACT structure:

\`\`\`json
{
  "project": {
    "name": "string",
    "description": "string"
  },
  "features": [
    {
      "name": "string",
      "description": "string",
      "priority": "high" | "medium" | "low"
    }
  ],
  "techStack": {
    "frontend": "string",
    "backend": "string",
    "database": "string",
    "orm": "string",
    "auth": "string",
    "styling": "string"
  },
  "dataModels": [
    {
      "name": "string",
      "fields": [
        {
          "name": "string",
          "type": "string",
          "required": boolean,
          "unique": boolean,
          "default": any
        }
      ],
      "relations": [
        {
          "type": "oneToMany" | "manyToOne" | "manyToMany",
          "model": "string",
          "field": "string"
        }
      ]
    }
  ],
  "screens": [
    {
      "name": "string",
      "route": "string",
      "description": "string",
      "components": ["string"]
    }
  ],
  "apiEndpoints": [
    {
      "method": "GET|POST|PUT|DELETE|PATCH",
      "path": "string",
      "description": "string",
      "auth": boolean
    }
  ]
}
\`\`\`

## Important Rules

1. Extract ALL features, even if priorities aren't explicit
2. Parse data models from TypeScript interfaces exactly as written
3. Infer tech stack from context if not explicitly stated
4. Include all API endpoints mentioned
5. Return ONLY valid JSON, no explanations
6. Use `null` for optional fields if not present
```

#### Step 2.3: Agent 구현

```typescript
// lib/agents/spec-parser/index.ts
import { BaseAgent, AgentContext } from '../base-agent';
import { SpecParserInput, ParsedSpec } from './types';
import fs from 'fs-extra';
import path from 'path';

export class SpecParserAgent extends BaseAgent<
  SpecParserInput,
  ParsedSpec
> {
  constructor(apiKey: string, context: AgentContext) {
    super(
      'spec-parser',
      path.join(__dirname),
      apiKey,
      context
    );
  }

  async execute(input: SpecParserInput): Promise<ParsedSpec> {
    this.log('Starting spec parsing...');

    // 1. Spec 파일 읽기
    const specContent = await fs.readFile(input.specFilePath, 'utf-8');
    this.log(`Read spec file: ${input.specFilePath}`);

    // 2. AGENT.md 로드
    const instructions = await this.loadInstructions();

    // 3. Prompt 구성
    const prompt = `${instructions}

---

SPECIFICATION TO PARSE:

${specContent}

---

Please parse the above specification and return structured JSON.`;

    // 4. Claude 호출
    const response = await this.callClaude(prompt, {
      temperature: 0.3,  // 낮은 temperature = 일관성
      systemPrompt: 'You are a precise specification parsing expert.'
    });

    // 5. JSON 추출
    const parsed = this.extractJSON<ParsedSpec>(response);

    this.log(`Parsed successfully: ${parsed.features.length} features, ${parsed.dataModels.length} models`);

    return parsed;
  }
}
```

---

### 3. Architecture Agent 구현

#### Step 3.1: 타입 정의

```typescript
// lib/agents/architecture/types.ts
import { ParsedSpec } from '../spec-parser/types';

export interface ArchitectureInput {
  parsedSpec: ParsedSpec;
}

export interface ArchitectureOutput {
  projectStructure: {
    [directory: string]: string[];  // 'app/' → ['page.tsx', 'layout.tsx']
  };
  dependencies: {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  components: Array<{
    name: string;
    path: string;
    props?: Record<string, string>;
    children?: string[];
  }>;
  apiRoutes: Array<{
    method: string;
    path: string;
    handler: string;
    middleware?: string[];
  }>;
  database: {
    schema: string;  // Prisma schema
    migrations?: string[];
  };
  config: {
    'next.config.js'?: string;
    'tailwind.config.js'?: string;
    'tsconfig.json'?: string;
    '.env.example'?: string;
  };
}
```

#### Step 3.2: Instructions 작성

```markdown
<!-- lib/agents/architecture/AGENT.md -->

# Architecture Agent

You are a senior software architect specializing in modern web applications. Design complete, production-ready architectures.

## Role

Design the entire technical architecture for a web application based on the parsed specification.

## Instructions

### 1. Project Structure

Design a **Next.js 14 App Router** structure:

\`\`\`
app/
├── page.tsx                    # Home page
├── layout.tsx                  # Root layout
├── (auth)/                     # Auth routes
│   ├── login/
│   └── signup/
├── (protected)/                # Protected routes
│   └── dashboard/
└── api/                        # API routes
    └── [endpoints]/
components/
├── ui/                         # Reusable UI
└── features/                   # Feature components
lib/
├── db.ts                       # Database client
├── api.ts                      # API utilities
└── auth.ts                     # Auth utilities
prisma/
└── schema.prisma               # Database schema
\`\`\`

### 2. Dependencies

Select appropriate packages:

**Frontend:**
- next@14
- react@18
- typescript@5
- tailwindcss@3

**Backend:**
- @prisma/client
- zod (validation)

**Auth:**
- @supabase/supabase-js (if Supabase)
- next-auth (if NextAuth)

### 3. Components

Design component hierarchy:
- Break down screens into components
- Identify reusable UI components
- Define props and relationships

### 4. API Routes

Design RESTful endpoints:
- Group by resource
- Include middleware (auth, validation)
- Follow REST conventions

### 5. Database Schema

Generate Prisma schema:
- Models from data models
- Relations
- Indexes
- Constraints

### 6. Configuration

Generate config files:
- next.config.js
- tailwind.config.js
- tsconfig.json
- .env.example

## Output Format

Return JSON:

\`\`\`json
{
  "projectStructure": {
    "app/": ["page.tsx", "layout.tsx"],
    "components/ui/": ["Button.tsx", "Input.tsx"],
    "lib/": ["db.ts", "api.ts"],
    "prisma/": ["schema.prisma"]
  },
  "dependencies": {
    "dependencies": {
      "next": "14.0.0",
      "react": "18.2.0"
    },
    "devDependencies": {
      "typescript": "5.3.0"
    }
  },
  "components": [
    {
      "name": "TodoList",
      "path": "components/TodoList.tsx",
      "props": { "todos": "Todo[]" },
      "children": ["TodoItem"]
    }
  ],
  "apiRoutes": [
    {
      "method": "GET",
      "path": "/api/todos",
      "handler": "app/api/todos/route.ts",
      "middleware": ["auth"]
    }
  ],
  "database": {
    "schema": "// Prisma schema content"
  },
  "config": {
    "next.config.js": "// config content",
    "tailwind.config.js": "// config content"
  }
}
\`\`\`

## Best Practices

1. **File Organization**: Group by feature, not by type
2. **Component Design**: Single responsibility, composable
3. **API Design**: RESTful, consistent naming
4. **Database**: Normalize data, use indexes
5. **TypeScript**: Strict types, no `any`
6. **Security**: Auth middleware, input validation
```

#### Step 3.3: Agent 구현

```typescript
// lib/agents/architecture/index.ts
import { BaseAgent, AgentContext } from '../base-agent';
import { ArchitectureInput, ArchitectureOutput } from './types';
import path from 'path';

export class ArchitectureAgent extends BaseAgent<
  ArchitectureInput,
  ArchitectureOutput
> {
  constructor(apiKey: string, context: AgentContext) {
    super(
      'architecture',
      path.join(__dirname),
      apiKey,
      context
    );
  }

  async execute(input: ArchitectureInput): Promise<ArchitectureOutput> {
    this.log('Designing architecture...');

    // 1. AGENT.md 로드
    const instructions = await this.loadInstructions();

    // 2. Prompt 구성
    const prompt = `${instructions}

---

PARSED SPECIFICATION:

${JSON.stringify(input.parsedSpec, null, 2)}

---

Design a complete architecture for this application.`;

    // 3. Claude 호출
    const response = await this.callClaude(prompt, {
      temperature: 0.5,
      maxTokens: 8000,  // Architecture는 긴 응답
      systemPrompt: 'You are a senior software architect with 10+ years of experience.'
    });

    // 4. JSON 추출
    const architecture = this.extractJSON<ArchitectureOutput>(response);

    this.log(`Architecture designed: ${Object.keys(architecture.projectStructure).length} directories`);

    return architecture;
  }
}
```

---

### 4. Code Generator Agent 구현

#### Step 4.1: 타입 정의

```typescript
// lib/agents/code-generator/types.ts
import { ArchitectureOutput } from '../architecture/types';

export interface CodeGeneratorInput {
  architecture: ArchitectureOutput;
  outputDirectory: string;
}

export interface CodeGeneratorOutput {
  files: Map<string, string>;  // filepath → content
  filesCreated: number;
  totalLines: number;
}
```

#### Step 4.2: Instructions 작성

```markdown
<!-- lib/agents/code-generator/AGENT.md -->

# Code Generator Agent

You are an expert TypeScript/React developer. Generate production-ready code.

## Role

Generate complete, working code files based on the architecture specification.

## Instructions

### 1. Code Quality Standards

- **TypeScript**: Strict mode, proper types, no `any`
- **React**: Functional components, hooks
- **Next.js 14**: App Router, Server Components
- **Tailwind CSS**: Utility classes, responsive design
- **Error Handling**: Try-catch, error boundaries
- **Accessibility**: ARIA labels, semantic HTML

### 2. File Generation

For each file in the architecture:

1. **Determine file type** (component, API route, utility, etc.)
2. **Generate complete code**
3. **Include imports**
4. **Add TypeScript types**
5. **Include error handling**
6. **Add comments** for complex logic

### 3. Next.js App Router Patterns

**Page Component:**
\`\`\`typescript
// app/page.tsx
export default function HomePage() {
  return <div>Content</div>;
}
\`\`\`

**Layout:**
\`\`\`typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body>{children}</body></html>;
}
\`\`\`

**API Route:**
\`\`\`typescript
// app/api/todos/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
\`\`\`

### 4. Component Patterns

**UI Component:**
\`\`\`typescript
// components/ui/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'}
    >
      {children}
    </button>
  );
}
\`\`\`

### 5. Prisma Schema

\`\`\`prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Todo {
  id        String   @id @default(uuid())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
\`\`\`

## Output Format

For each file, output in this format:

\`\`\`typescript // path/to/file.tsx
// File content here
\`\`\`

**Example:**

\`\`\`typescript // app/page.tsx
export default function HomePage() {
  return <div>Hello</div>;
}
\`\`\`

\`\`\`typescript // components/ui/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
}

export function Button({ children }: ButtonProps) {
  return <button>{children}</button>;
}
\`\`\`

## Important Rules

1. Generate COMPLETE, working code
2. Include ALL necessary imports
3. Use TypeScript strict types
4. Add proper error handling
5. Follow Next.js 14 patterns
6. Use Tailwind CSS classes
7. Make it production-ready
```

#### Step 4.3: Agent 구현

```typescript
// lib/agents/code-generator/index.ts
import { BaseAgent, AgentContext } from '../base-agent';
import { CodeGeneratorInput, CodeGeneratorOutput } from './types';
import fs from 'fs-extra';
import path from 'path';

export class CodeGeneratorAgent extends BaseAgent<
  CodeGeneratorInput,
  CodeGeneratorOutput
> {
  constructor(apiKey: string, context: AgentContext) {
    super(
      'code-generator',
      path.join(__dirname),
      apiKey,
      context
    );
  }

  async execute(input: CodeGeneratorInput): Promise<CodeGeneratorOutput> {
    this.log('Generating code...');

    // 1. AGENT.md 로드
    const instructions = await this.loadInstructions();

    // 2. 생성할 파일 목록 준비
    const filesToGenerate = this.prepareFileList(input.architecture);

    // 3. Prompt 구성
    const prompt = `${instructions}

---

ARCHITECTURE:

${JSON.stringify(input.architecture, null, 2)}

---

Generate complete code for ALL files in the architecture.
Include package.json, tsconfig.json, and all configuration files.`;

    // 4. Claude 호출 (긴 응답)
    const response = await this.callClaude(prompt, {
      temperature: 0.7,
      maxTokens: 16000,  // 코드 생성은 매우 긴 응답
      systemPrompt: 'You are a senior full-stack developer generating production code.'
    });

    // 5. 코드 블록 추출
    const codeBlocks = this.extractCodeBlocks(response);

    this.log(`Extracted ${codeBlocks.size} code files`);

    // 6. 파일 시스템에 쓰기
    await this.writeFiles(input.outputDirectory, codeBlocks);

    // 7. 통계
    const totalLines = Array.from(codeBlocks.values())
      .reduce((sum, code) => sum + code.split('\n').length, 0);

    this.log(`Generated ${codeBlocks.size} files, ${totalLines} lines of code`);

    return {
      files: codeBlocks,
      filesCreated: codeBlocks.size,
      totalLines
    };
  }

  private prepareFileList(architecture: any): string[] {
    const files: string[] = [];

    for (const [dir, fileList] of Object.entries(architecture.projectStructure)) {
      for (const file of fileList as string[]) {
        files.push(path.join(dir, file));
      }
    }

    return files;
  }

  private async writeFiles(
    outputDir: string,
    files: Map<string, string>
  ): Promise<void> {
    for (const [filepath, content] of files.entries()) {
      const fullPath = path.join(outputDir, filepath);

      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, 'utf-8');

      this.log(`Created: ${filepath}`);
    }
  }
}
```

---

## CLI 통합

### Orchestrator 구현

```typescript
// cli.ts
#!/usr/bin/env node

import { Command } from 'commander';
import { SpecParserAgent } from './lib/agents/spec-parser';
import { ArchitectureAgent } from './lib/agents/architecture';
import { CodeGeneratorAgent } from './lib/agents/code-generator';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
  .name('sdd')
  .description('Spec-Driven Development - Generate apps from specifications')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate a full-stack app from a spec file')
  .argument('<spec-file>', 'Path to specification markdown file')
  .option('-o, --output <dir>', 'Output directory', 'output')
  .option('-v, --verbose', 'Verbose logging', false)
  .action(async (specFile: string, options) => {
    try {
      console.log('🚀 SDD System - Generating application...\n');

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not set in .env');
      }

      const context = {
        workingDirectory: process.cwd(),
        verbose: options.verbose
      };

      // 출력 디렉토리 준비
      const outputDir = path.resolve(options.output);
      await fs.ensureDir(outputDir);

      console.log('📋 Step 1/3: Parsing specification...');
      const specParser = new SpecParserAgent(apiKey, context);
      const parsedSpec = await specParser.execute({
        specFilePath: path.resolve(specFile)
      });
      console.log(`✅ Parsed: ${parsedSpec.features.length} features\n`);

      console.log('🏗️  Step 2/3: Designing architecture...');
      const architect = new ArchitectureAgent(apiKey, context);
      const architecture = await architect.execute({ parsedSpec });
      console.log(`✅ Designed: ${Object.keys(architecture.projectStructure).length} directories\n`);

      console.log('⚙️  Step 3/3: Generating code...');
      const codeGen = new CodeGeneratorAgent(apiKey, context);
      const result = await codeGen.execute({
        architecture,
        outputDirectory: outputDir
      });
      console.log(`✅ Generated: ${result.filesCreated} files, ${result.totalLines} lines\n`);

      console.log('🎉 Success! Your app is ready.\n');
      console.log(`📁 Location: ${outputDir}`);
      console.log('\n📝 Next steps:');
      console.log(`  cd ${options.output}`);
      console.log('  npm install');
      console.log('  npm run dev');

    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
```

### package.json 스크립트

```json
{
  "name": "sdd-system",
  "version": "0.1.0",
  "bin": {
    "sdd": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch cli.ts",
    "generate": "tsx cli.ts generate"
  }
}
```

---

## 테스트

### 1. 간단한 Spec으로 테스트

```bash
# specs/simple-todo.md 생성
cat > specs/simple-todo.md << 'EOF'
# Simple Todo App

간단한 할일 관리 앱

## 기능
- Todo 추가
- Todo 완료 체크
- Todo 삭제

## 기술 스택
- Frontend: Next.js 14
- Database: PostgreSQL
- ORM: Prisma

## 데이터 모델
\`\`\`typescript
interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}
\`\`\`
EOF

# 생성
npm run generate specs/simple-todo.md

# 확인
cd output
npm install
npm run dev
```

### 2. Agent 단위 테스트

```typescript
// __tests__/spec-parser.test.ts
import { SpecParserAgent } from '../lib/agents/spec-parser';

describe('SpecParserAgent', () => {
  it('should parse simple todo spec', async () => {
    const agent = new SpecParserAgent(
      process.env.ANTHROPIC_API_KEY!,
      { workingDirectory: process.cwd() }
    );

    const result = await agent.execute({
      specFilePath: './specs/simple-todo.md'
    });

    expect(result.project.name).toBe('Simple Todo App');
    expect(result.features.length).toBeGreaterThan(0);
    expect(result.dataModels.length).toBeGreaterThan(0);
  });
});
```

---

## 실전: Voice Journal 웹 버전 생성

### Step 1: Spec 준비

```bash
# voice-journal 웹 버전 Spec 복사
cp /Users/jaykim/Documents/Projects/voice-journal/.claude/specs/voice-journal-spec.md \
   specs/voice-journal-web.md

# 웹 버전에 맞게 수정 (음성 녹음 기능 제외)
```

### Step 2: 생성

```bash
npm run generate specs/voice-journal-web.md -- -o output/voice-journal-web
```

### Step 3: 실행

```bash
cd output/voice-journal-web

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# Prisma 초기화
npx prisma generate
npx prisma db push

# 개발 서버 실행
npm run dev
```

### Step 4: 검증

```bash
# 브라우저에서 확인
open http://localhost:3000

# 테스트
npm run test

# 타입 체크
npm run type-check

# 빌드
npm run build
```

---

## 베스트 프랙티스

### 1. AGENT.md 작성

```markdown
✅ 명확한 역할 정의
✅ 구체적인 Instructions
✅ 출력 형식 명시 (JSON 스키마)
✅ 예시 포함
✅ 규칙 명시

❌ 모호한 지시
❌ 너무 긴 Instructions (3000자 이하 권장)
❌ 출력 형식 불명확
```

### 2. Agent 구현

```typescript
✅ BaseAgent 상속
✅ 타입 안전성 (TypeScript)
✅ 에러 처리
✅ 로깅
✅ 테스트 가능한 구조

❌ 하드코딩
❌ any 타입 사용
❌ 에러 무시
```

### 3. 프로젝트 구조

```
✅ agents/ 폴더에 모든 Agent
✅ 각 Agent는 독립적 폴더
✅ AGENT.md + index.ts + types.ts
✅ 테스트 포함

❌ 모든 코드를 한 파일에
❌ Agent 간 강한 결합
```

---

## 트러블슈팅

### 문제: JSON 파싱 실패

```typescript
// 해결: extractJSON 개선
protected extractJSON<T>(response: string): T {
  try {
    // 1. JSON 코드 블록 시도
    const blockMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (blockMatch) return JSON.parse(blockMatch[1]);

    // 2. 직접 JSON 찾기
    const directMatch = response.match(/\{[\s\S]*\}/);
    if (directMatch) return JSON.parse(directMatch[0]);

    // 3. 실패 시 명확한 에러
    throw new Error(`No valid JSON in response. Response:\n${response.substring(0, 500)}`);
  } catch (error) {
    console.error('JSON parsing failed:', error);
    console.error('Response:', response);
    throw error;
  }
}
```

### 문제: Claude API 토큰 제한

```typescript
// 해결: 응답 분할 요청
async execute(input) {
  // 큰 파일을 여러 번에 나눠서 생성
  const batches = this.splitIntoBatches(filesToGenerate);

  const allFiles = new Map();
  for (const batch of batches) {
    const files = await this.generateBatch(batch);
    files.forEach((content, path) => allFiles.set(path, content));
  }

  return allFiles;
}
```

### 문제: 생성된 코드 타입 에러

```typescript
// 해결: Validation Agent 추가 (Step 2)
// 타입 체크 → 에러 발견 → Fix Agent로 수정
```

---

## 다음 단계

### Step 2: Agent 전문화 (7 Agents)

1. Frontend Agent (UI 전문)
2. Backend Agent (API 전문)
3. Database Agent (Schema 전문)
4. Validation Agent (품질 검증)

### Step 3: 품질 보증 (10+ Agents)

5. Testing Agent
6. Fix Agent (자동 수정)
7. Documentation Agent
8. Deployment Agent

---

**Version**: 1.0.0
**Last Updated**: 2025-12-13
**Status**: Ready for Implementation

---

## 참고 자료

### 프로젝트 문서
- [README.md](../README.md) - 프로젝트 개요
- [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md) - 전체 아키텍처
- [IMPLEMENTATION_LOG.md](./IMPLEMENTATION_LOG.md) - 구현 기록

### 외부 문서
- [Claude API Docs](https://docs.anthropic.com/) - Claude API
- [Next.js 14 Docs](https://nextjs.org/docs) - Next.js
- [Prisma Docs](https://www.prisma.io/docs) - Prisma ORM

---

## v2.0: Skills 기반 사용 가이드 (2025-12-23)

### Skills 방식 vs API 방식

**언제 Skills를 사용할까?**

✅ **Skills 방식 (Claude Code)**:
- 개발 및 테스트 단계
- 빠른 피드백이 필요할 때
- 무료로 사용하고 싶을 때
- 대화형으로 수정하고 싶을 때

✅ **API 방식 (CLI)**:
- CI/CD 파이프라인에서
- 완전 자동화가 필요할 때
- 배치 처리가 필요할 때

---

### Skills 사용법

#### 1. 전체 앱 생성

```bash
# Claude Code에서 실행
generate specs/my-app.md
```

**내부 프로세스**:
1. `parse` - Spec 파싱
2. `architecture` - 구조 설계
3. `database` - Prisma 스키마
4. `frontend` - React 컴포넌트
5. `backend` - API 라우트
6. `config` - 설정 파일
7. `testing` - 테스트 파일
8. `deployment` - Docker 설정
9. `fix` - 에러 수정

#### 2. 개별 Skill 실행

**Spec 파싱만**:
```bash
parse specs/my-app.md
# Output: .temp/parsed-spec.json
```

**Architecture 설계만**:
```bash
architecture
# Input: .temp/parsed-spec.json
# Output: .temp/architecture.json
```

**Database만 생성**:
```bash
database
# Input: .temp/parsed-spec.json + architecture.json
# Output: output/{project}/prisma/
```

#### 3. 대화형 수정

Skills는 Claude Code에서 실행되므로 즉시 피드백 가능:

```
You: generate specs/blog.md

Claude: [파싱 완료, 아키텍처 설계 중...]

You: 대시보드에 차트 하나 더 추가해줘

Claude: [차트 추가하여 재생성...]

You: API 에러 처리 더 견고하게 해줘

Claude: [에러 처리 개선...]
```

---

### Skills 디렉토리 구조

```
.claude/skills/
├── generate.md         # 메인 오케스트레이터
│   └── 전체 파이프라인 실행
│
├── parse.md            # Phase 1
│   ├── Input: specs/*.md
│   └── Output: .temp/parsed-spec.json
│
├── architecture.md     # Phase 2
│   ├── Input: .temp/parsed-spec.json
│   └── Output: .temp/architecture.json
│
├── database.md         # Phase 3
│   ├── Input: parsed-spec + architecture
│   └── Output: output/{project}/prisma/
│
├── frontend.md         # Phase 4
│   ├── Input: parsed-spec + architecture
│   └── Output: output/{project}/src/components/
│
├── backend.md          # Phase 5
│   ├── Input: parsed-spec + architecture + schema
│   └── Output: output/{project}/src/app/api/
│
├── config.md           # Phase 6
│   ├── Input: parsed-spec + architecture
│   └── Output: package.json, tsconfig.json, etc.
│
├── testing.md          # Phase 7
│   ├── Input: generated files
│   └── Output: *.test.tsx, *.spec.ts
│
├── deployment.md       # Phase 8
│   ├── Input: parsed-spec + architecture
│   └── Output: Dockerfile, docker-compose.yml
│
└── fix.md              # Phase 9
    ├── Input: generated project
    └── Output: 수정된 파일들
```

---

### Skill 작성 가이드

Skills를 직접 추가하거나 수정하고 싶다면:

#### Skill 파일 구조

```markdown
# Skill Name - Brief Description

**Description**: What this skill does

**Usage**:
\```bash
skill-name <args>
\```

## Instructions

When this skill is invoked:

1. **Read Input**:
   - Input file paths
   - Expected format

2. **Process**:
   - Step-by-step logic
   - Key operations

3. **Generate Output**:
   - Output file paths
   - Format specifications

4. **Validation**:
   - Error checking
   - Success criteria

## Key Principles

- Best practice 1
- Best practice 2
- Error handling strategy

## Examples

### Example 1: Basic Usage
\```bash
skill-name input.md
\```

### Example 2: With Options
\```bash
skill-name input.md --output custom/path
\```

## Output Format

Describe expected output...
```

#### 새 Skill 추가하기

1. **파일 생성**:
```bash
touch .claude/skills/my-custom-skill.md
```

2. **Skill 정의 작성**:
   - Description: 무엇을 하는지
   - Instructions: 어떻게 하는지
   - Examples: 사용 예시

3. **오케스트레이터에 통합** (선택):
```markdown
# .claude/skills/generate.md

10. **Run Phase 10 - My Custom Skill**:
    - Use the `my-custom-skill` skill
    - Input: ...
    - Output: ...
```

---

### Skills 디버깅

#### 중간 파일 확인

```bash
# 파싱 결과 확인
cat .temp/parsed-spec.json | jq

# 아키텍처 확인
cat .temp/architecture.json | jq
```

#### 생성된 파일 검증

```bash
# 생성된 프로젝트로 이동
cd output/my-app

# 의존성 설치
npm install

# 타입 체크
npm run type-check

# 빌드
npm run build
```

#### 에러 발생 시

1. **중간 파일 확인**: `.temp/` 디렉토리의 JSON 파일 검증
2. **개별 Skill 재실행**: 문제가 있는 Phase만 다시 실행
3. **Claude에게 피드백**: "이 부분 수정해줘"

---

### 성능 최적화

#### 병렬 실행 (고급)

Phase 3-8은 독립적이므로 병렬 가능:

```bash
# 여러 Claude Code 세션에서 동시 실행
# Session 1: database
# Session 2: frontend  
# Session 3: backend
# Session 4: config
```

단, Frontend/Backend는 Database 스키마 참조하므로 주의.

#### 캐싱

중간 결과 재사용:
```bash
# 이미 파싱된 spec 재사용
# .temp/parsed-spec.json이 있으면 Phase 1 스킵

# 이미 설계된 architecture 재사용
# .temp/architecture.json이 있으면 Phase 2 스킵
```

---

### 문제 해결

#### 문제: Skill이 인식 안 됨

**원인**: Skills 파일이 잘못된 위치
```bash
# 올바른 위치 확인
ls -la .claude/skills/

# 없다면 생성
mkdir -p .claude/skills
```

#### 문제: 중간 파일이 없음

**원인**: 이전 Phase를 실행하지 않음
```bash
# Phase 순서대로 실행 필요
parse specs/my-app.md      # 먼저
architecture                 # 그 다음
database                     # 마지막
```

#### 문제: 생성된 파일이 비어있음

**원인**: Skill 프롬프트 개선 필요
- Skill 파일 (.claude/skills/*.md) 열기
- Instructions 섹션 확인 및 수정
- 더 구체적인 지시사항 추가

---

### 비교: CLI vs Skills

#### CLI 방식 (기존)

```bash
# 한 번에 실행
npm run generate specs/my-app.md

# 장점:
# - 완전 자동
# - CI/CD 통합 가능
# - 빠름 (4-5분)

# 단점:
# - API 크레딧 필요
# - 피드백 불가
# - 수정 어려움
```

#### Skills 방식 (신규)

```bash
# Claude Code에서 실행
generate specs/my-app.md

# 장점:
# - 무료 (Max 플랜)
# - 대화형 피드백
# - 즉시 수정 가능
# - Sonnet 4.5 사용

# 단점:
# - Claude Code 필요
# - 반자동
# - 약간 느림 (7-10분)
```

---

## v3.0: Command + Sub Agents + Skills 아키텍처 (2025-12-25)

### 개요

**v3.0**은 Claude Code의 **Command**, **Sub Agents**, **Skills** 세 가지를 조합하여 최적의 성능과 유연성을 제공합니다.

### 핵심 개념

```
Command (사용자 대면 + 오케스트레이션)
   ↓
Sub Agents (독립 실행 + 병렬 처리)
   ↓
Skills (재사용 로직 + 기존 자산 활용)
```

**각 레이어의 역할**:

| 레이어 | 역할 | 장점 |
|--------|------|------|
| **Command** | • 사용자 인터랙션<br>• 파이프라인 제어<br>• 체크포인트 관리 | • 명시적 호출 `/generate`<br>• Interactive 모드 가능<br>• 전체 흐름 제어 |
| **Sub Agent** | • 독립 실행 환경<br>• 병렬 처리<br>• 전문화 | • 컨텍스트 격리<br>• 병렬 실행<br>• Phase별 전문성 |
| **Skill** | • 실제 로직<br>• 재사용 모듈 | • 기존 Skills 활용<br>• 코드 재사용<br>• 독립 테스트 |

### 파일 구조

```
.claude/
├── commands/
│   └── generate.md           # Main orchestrator
│
├── agents/
│   ├── parse-agent.md
│   ├── architecture-agent.md
│   ├── database-agent.md
│   ├── frontend-agent.md
│   ├── backend-agent.md
│   ├── config-agent.md
│   ├── testing-agent.md
│   ├── deployment-agent.md
│   └── fix-agent.md
│
└── skills/
    ├── generate.md            # (Deprecated)
    ├── parse.md
    ├── architecture.md
    ├── database.md
    ├── frontend.md
    ├── backend.md
    ├── config.md
    ├── testing.md
    ├── deployment.md
    └── fix.md
```

### 실행 흐름

#### Sequential Mode (기본값, 권장)

```
User → /generate specs/my-money-plan.md
          ↓
     Command [메인 컨텍스트]
     - Interactive 모드
     - 체크포인트 관리
          ↓
     Phase 1: parse-agent
       → parse skill 실행
       → 결과 반환
          ↓
     Command: 사용자 확인 "Continue to Phase 2?"
          ↓
     Phase 2: architecture-agent
       → architecture skill 실행
       → 결과 반환
          ↓
     Command: 사용자 확인 "Continue to Phase 3?"
          ↓
     Phase 3-8: 순차 실행
       각 Agent → 해당 Skill → 결과 → 사용자 확인
          ↓
     Phase 9: fix-agent
       → fix skill 실행
          ↓
     🎉 완료!
```

#### Parallel Mode (고급, 성능 최적화)

```
Phase 1-2: 순차 실행 (의존성)
     ↓
Phase 3-8: 병렬 실행 ⚡
┌──────────┬──────────┬──────────┬────────┬─────────┬────────────┐
Database   Frontend   Backend    Config   Testing   Deployment
Agent      Agent      Agent      Agent    Agent     Agent
  ↓          ↓          ↓          ↓        ↓         ↓
db     fe     be     cfg  test  deploy
skill      skill      skill      skill    skill     skill
└──────────┴──────────┴──────────┴────────┴─────────┴────────────┘
     ↓
Command: 종합 결과 표시, 사용자 확인
     ↓
Phase 9: Fix
```

**병렬 실행 성능**:
```
Sequential: 350초 (5분 50초)
Parallel:   120초 (2분) - 가장 긴 작업 기준

⚡ 시간 절약: 230초 (3분 50초, 65% 단축!)
```

### 사용법

#### 1. Interactive + Sequential (기본값, 첫 테스트 권장)

```bash
/generate specs/my-money-plan.md
```

**특징**:
- ✅ 각 Phase 후 사용자 승인
- ✅ 순차 실행으로 안정성
- ✅ 디버깅 용이
- ✅ 수정/건너뛰기 가능

**출력 예시**:
```
🔹 Phase 2: Architecture Design
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Architecture designed successfully!

📊 Summary:
  - Directories: 12
  - Dependencies: 21 packages
  - Planned Files: 19

💾 Checkpoint: .temp/checkpoint.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Continue to Phase 3 (Database)? (yes/no/modify/skip)
```

#### 2. Interactive + Parallel

```bash
/generate specs/my-money-plan.md --parallel
```

**특징**:
- ✅ Phase 3-8 병렬 실행 (50% 빠름)
- ✅ 여전히 사용자 확인
- ⚠️ 안정화 후 사용 권장

#### 3. Auto + Sequential

```bash
/generate specs/my-money-plan.md --auto
```

**특징**:
- ✅ 사용자 확인 없이 연속 실행
- ✅ 안정적인 순차 실행
- ✅ 테스트된 spec에 적합

#### 4. Auto + Parallel (최고 속도)

```bash
/generate specs/my-money-plan.md --auto --parallel
```

**특징**:
- ⚡ 최대 성능 (4-5분)
- ✅ 완전 자동화
- ⚠️ 안정화 및 검증 후 사용

#### 5. Resume from Checkpoint

```bash
/generate specs/my-money-plan.md --resume
```

**특징**:
- ✅ 중단된 시점부터 재개
- ✅ 크래시 복구
- ✅ 실험 및 디버깅 용이

### 체크포인트 시스템

각 Phase 완료 후 `.temp/checkpoint.json`에 자동 저장:

```json
{
  "specFile": "specs/my-money-plan.md",
  "projectName": "my-money-plan",
  "outputDir": "output/my-money-plan",
  "mode": "interactive",
  "executionMode": "sequential",
  "lastPhase": 3,
  "completed": ["parse", "architecture", "database"],
  "timestamp": "2025-12-25T12:00:00Z",
  "stats": {
    "totalFiles": 45,
    "duration": 180
  }
}
```

**혜택**:
- ✅ 중단 후 재개 가능
- ✅ 크래시 자동 복구
- ✅ 실험적 실행 가능
- ✅ 디버깅 용이

### Agent 구조 예시

#### Command: generate.md

```markdown
---
description: Generate complete application with step-by-step approval
argument-hint: [spec-file] [--auto] [--parallel] [--resume]
---

# SDD Generate Pipeline

Orchestrates 9 specialized agents:

1. Phase 1: Use parse-agent
   - Show results
   - Ask user: "Continue to Phase 2?"

2. Phase 2: Use architecture-agent
   - Show results
   - Ask user: "Continue to Phase 3?"

3-8. [Sequential] Execute one by one
     [Parallel] Launch all simultaneously

9. Phase 9: Use fix-agent
```

#### Sub Agent: database-agent.md

```markdown
---
name: database-agent
description: Generate Prisma schema using database skill
tools: Read, Write, Glob
model: sonnet
---

You are a database schema expert.

1. Read .temp/parsed-spec.json and architecture.json
2. Use the `database` skill to generate schema
3. Validate output
4. Return summary:
   - Models count
   - Relations count
   - Generated files
```

#### Skill: database.md (기존 그대로)

```markdown
---
name: database
description: Generate Prisma database schema from spec
---

(기존 로직 그대로 유지)
```

### Interactive 모드 사용자 옵션

각 Phase 후 선택 가능:

- **yes**: 다음 Phase 진행
- **no**: 중단 (체크포인트 저장)
- **modify**: 결과 수정 후 Phase 재실행
- **skip**: 이 Phase 건너뛰고 다음으로

### 성능 비교

| 모드 | 시간 | 특징 | 사용 시점 |
|------|------|------|-----------|
| Interactive + Sequential | 8-10분 | 안정적, 디버깅 용이 | 첫 테스트, 학습 |
| Interactive + Parallel | 4-5분 | 빠름, 확인 가능 | 안정화 후 |
| Auto + Sequential | 8-10분 | 자동, 안정적 | CI/CD, 검증된 spec |
| Auto + Parallel | 4-5분 | 최고 속도 | 프로덕션, 대량 생성 |

### v2.0 vs v3.0 비교

| 특징 | v2.0 (Skills) | v3.0 (Command + Agents + Skills) |
|------|---------------|----------------------------------|
| **구조** | Skills 직접 호출 | Command → Agents → Skills |
| **병렬 실행** | ❌ 불가능 | ✅ 가능 (Phase 3-8) |
| **속도** | 8-10분 | 4-5분 (병렬 시) |
| **독립성** | 메인 컨텍스트 공유 | Agent별 독립 컨텍스트 |
| **재사용** | Skills | Skills + Agents |
| **명시성** | 자동 발견 | `/generate` 명령 |
| **Interactive** | ✅ 가능 | ✅ 가능 (더 구조화) |
| **체크포인트** | ✅ 가능 | ✅ 가능 (동일) |
| **복잡도** | ⭐⭐ 중간 | ⭐⭐⭐ 높음 |
| **성능** | ⭐⭐ 보통 | ⭐⭐⭐ 우수 |

### 언제 v3.0을 사용하나?

**v3.0 사용 (Command + Agents + Skills)**:
- ✅ 성능이 중요할 때 (병렬 실행)
- ✅ 대규모 프로젝트
- ✅ 각 Phase 독립성이 필요할 때
- ✅ 명시적 제어가 필요할 때

**v2.0 사용 (Skills)**:
- ✅ 간단한 프로젝트
- ✅ 빠른 프로토타이핑
- ✅ 학습 목적
- ✅ 순차 실행만 필요할 때

### 베스트 프랙티스

#### 1. 단계적 접근

```bash
# 1단계: Sequential로 안정화
/generate specs/my-app.md

# 2단계: Parallel 테스트
/generate specs/my-app.md --parallel

# 3단계: Auto 모드 전환
/generate specs/my-app.md --auto --parallel
```

#### 2. 체크포인트 활용

```bash
# Phase 5에서 중단된 경우
/generate specs/my-app.md --resume

# 특정 Phase부터 재시작하려면 checkpoint.json 수정
```

#### 3. 에러 처리

```
Agent 실패 시 옵션:
1. Retry - 재시도
2. Skip - 건너뛰기
3. Stop - 중단 후 나중에 재개
4. Abort - 전체 취소
```

### 트러블슈팅

#### Q: 병렬 실행 시 일부 Agent 실패

**A**: Sequential 모드로 전환하여 어느 Phase에서 실패하는지 확인

```bash
/generate specs/my-app.md --sequential
```

#### Q: 체크포인트에서 재개 시 에러

**A**: `.temp/checkpoint.json` 삭제 후 처음부터 재시작

```bash
rm .temp/checkpoint.json
/generate specs/my-app.md
```

#### Q: Parallel 모드가 Sequential보다 느림

**A**: 작은 프로젝트는 Agent 생성 오버헤드가 더 클 수 있음. Sequential 사용 권장.

---

## 버전 히스토리

**v1.0 (API 기반)**: TypeScript + Anthropic API
- 완전 자동화
- 빠름 (4-5분)
- API 크레딧 필요 ($0.38/app)

**v2.0 (Skills 기반)**: Claude Code Skills
- 비용 무료 (Max plan)
- Interactive 가능
- 순차 실행만 (8-10분)

**v3.0 (Command + Agents + Skills)**: 최적 조합
- 비용 무료
- Interactive 가능
- 병렬 실행 가능 (4-5분)
- 독립성 확보

---

**Version**: 3.0.0 (Command + Agents + Skills)
**Last Updated**: 2025-12-25
**Status**: 구현 완료, 테스트 대기


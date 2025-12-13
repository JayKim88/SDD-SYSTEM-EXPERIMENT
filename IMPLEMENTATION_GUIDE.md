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

- [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md) - 전체 아키텍처
- [Claude API Docs](https://docs.anthropic.com/) - Claude API
- [Next.js 14 Docs](https://nextjs.org/docs) - Next.js
- [Prisma Docs](https://www.prisma.io/docs) - Prisma ORM

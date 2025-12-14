import * as path from "path";
import * as fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { BaseAgent } from "../base-agent";
import {
  CodeGeneratorInput,
  CodeGeneratorOutput,
  GeneratedFile,
} from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Code Generator Agent
 *
 * Architecture 명세를 바탕으로 실제 코드 파일들을 생성합니다.
 */
export class CodeGeneratorAgent extends BaseAgent<
  CodeGeneratorInput,
  CodeGeneratorOutput
> {
  constructor(context = {}) {
    super("CodeGenerator", "1.0.0", context);
  }

  async execute(input: CodeGeneratorInput): Promise<CodeGeneratorOutput> {
    this.log(`Starting Code Generator Agent`);
    this.log(`Generating code for: ${input.architecture.projectName}`);

    try {
      // 1. 프로젝트 출력 디렉토리 설정
      const projectPath = path.join(
        this.context.outputDir!,
        input.architecture.projectName
      );

      // 2. 출력 디렉토리 생성 (기존 파일 삭제)
      await this.prepareOutputDirectory(projectPath);

      // 3. AGENT.md Instructions 로드
      const agentDir = __dirname;
      const instructions = await this.loadInstructions(agentDir);

      // 4. Claude에게 전달할 프롬프트 구성
      const prompt = this.buildPrompt(input);

      this.log(`Requesting code generation from Claude...`);
      this.log(`Files to generate: ${input.architecture.fileList.length}`);

      // 5. Claude API 호출 (높은 max_tokens 필요)
      const response = await this.callClaudeForCodeGeneration(
        prompt,
        instructions
      );

      // 6. 응답에서 코드 블록 추출
      const codeBlocks = this.extractCodeBlocks(response);
      this.log(`Extracted ${codeBlocks.size} code blocks from response`);

      // 7. 파일 생성
      const generatedFiles = await this.writeFiles(projectPath, codeBlocks);

      // 8. 프로젝트 구조 디렉토리 생성
      await this.createDirectoryStructure(projectPath, input.architecture);

      // 9. .gitignore 생성 (코드 블록에 없을 경우)
      await this.ensureGitignore(projectPath, codeBlocks);

      // 10. README.md 생성
      await this.generateReadme(projectPath, input);

      const output: CodeGeneratorOutput = {
        projectPath,
        filesGenerated: generatedFiles.length,
        files: generatedFiles,
      };

      this.log(`Code generation completed successfully`);
      this.log(`Generated ${output.filesGenerated} files`);
      this.log(`Project created at: ${projectPath}`);

      return output;
    } catch (error) {
      this.log(`Code generation failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * 출력 디렉토리 준비
   */
  private async prepareOutputDirectory(projectPath: string): Promise<void> {
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
      this.log(`Cleaned existing directory: ${projectPath}`);
    } catch (error) {
      // 디렉토리가 없으면 무시
    }

    await fs.mkdir(projectPath, { recursive: true });
    this.log(`Created output directory: ${projectPath}`);
  }

  /**
   * Claude에게 전달할 프롬프트 구성
   */
  private buildPrompt(input: CodeGeneratorInput): string {
    const configFilesList =
      input.architecture.configFiles
        ?.map((cf) => `- ${cf.filename}`)
        .join("\n") || "";

    const fileListSummary =
      input.architecture.fileList?.map((f) => `- ${f.path}`).join("\n") || "";

    return `
Please generate complete, production-ready code for this Next.js 14 application.

# Parsed Specification

${JSON.stringify(input.parsedSpec, null, 2)}

# Architecture

${JSON.stringify(input.architecture, null, 2)}

---

# CRITICAL INSTRUCTIONS

## Step 1: Generate Configuration Files FIRST (MANDATORY)

You MUST generate ALL of these configuration files before any application code:

${configFilesList}

**Required configuration files:**
1. package.json - Include ALL dependencies from architecture.dependencies
2. tsconfig.json - Next.js 14 compatible TypeScript config
3. next.config.js - Next.js configuration
4. tailwind.config.ts - Tailwind CSS configuration
5. postcss.config.js - PostCSS for Tailwind
6. .env.local - Environment variables with placeholder values (CRITICAL!)
7. .env.example - Environment variables template

## Step 2: Generate Application Code Files

Generate code for EVERY file in the fileList:

${fileListSummary}

## Requirements

Each file must be:
- Complete and ready to use (no placeholders or TODOs)
- Following Next.js 14 App Router conventions
- Type-safe with TypeScript
- Using Tailwind CSS for styling
- Production-quality with error handling

## CRITICAL RULES (MANDATORY - DO NOT IGNORE)

### 1. Server vs Client Components

**ALWAYS add 'use client' directive when ANY of these apply:**
- Event Handlers (onClick, onChange, onSubmit, etc.)
- React Hooks (useState, useEffect, useCallback, etc.)
- Custom Hooks (useAuth, useRouter, usePathname, etc.)
- Browser APIs (localStorage, window, document, etc.)
- Third-party Hooks (useQuery, useMutation, etc.)

**Examples:**
- components/ui/Button.tsx → 'use client' (has onClick)
- app/dashboard/page.tsx → 'use client' (uses useState)
- components/layout/Header.tsx → 'use client' (uses useAuth hook)

### 2. Provider Pattern (MANDATORY for Context/QueryClient)

**If project uses React Query or Context API:**

1. Create \`components/Providers.tsx\` with 'use client':
\`\`\`typescript:components/Providers.tsx
'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
\`\`\`

2. Use in app/layout.tsx (keep as Server Component):
\`\`\`typescript:app/layout.tsx
import { Providers } from '@/components/Providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
\`\`\`

### 3. Environment Variables (CRITICAL)

**ALWAYS generate BOTH files:**

1. \`.env.local\` (with placeholder values):
\`\`\`bash:.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
\`\`\`

2. \`.env.example\` (same structure as .env.local)

### 4. Supabase Client Pattern (CRITICAL)

\`\`\`typescript:lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Regular client (works everywhere)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: true }
})

// Admin client (server-only) - MUST use IIFE with null check
export const supabaseAdmin = (() => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    return null  // Returns null on client-side (prevents crash)
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
})()
\`\`\`

## Output Format

Return ALL code as code blocks with this exact format:

\`\`\`json:package.json
{
  "name": "${input.parsedSpec.projectName}",
  ...
}
\`\`\`

\`\`\`json:tsconfig.json
{
  ...
}
\`\`\`

\`\`\`typescript:app/page.tsx
...
\`\`\`

**CRITICAL REQUIREMENTS:**

1. **File Count Verification**:
   - Total files in fileList: ${input.architecture.fileList?.length || 0}
   - Configuration files: ${input.architecture.configFiles?.length || 0}
   - **You MUST generate exactly ${
     (input.architecture.fileList?.length || 0) +
     (input.architecture.configFiles?.length || 0)
   } code blocks**

2. **Generation Order**:
   - First: ALL configuration files
   - Second: ALL context providers (contexts/)
   - Third: ALL UI components (components/ui/)
   - Fourth: ALL other application files

3. **No Skipping**: DO NOT skip any files even if response is long. Generate EVERY file completely.

4. **File Path Format**: Each code block MUST use format: \`\`\`language:exact/path/to/file.ext

**Start generating ALL files now. Count as you go to ensure completeness.**
`.trim();
  }

  /**
   * Code generation을 위한 Claude API 호출 (높은 max_tokens)
   */
  private async callClaudeForCodeGeneration(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    this.log(`Calling Claude API for code generation...`);
    this.log(`Using max_tokens: 64000 (maximum allowed for claude-sonnet-4)`);

    try {
      const message = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 64000, // Maximum allowed output tokens for Sonnet 4
        temperature: 0.2, // Very low temperature for consistent, complete code
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude");
      }

      // Log token usage
      this.log(
        `Tokens used: ${message.usage.input_tokens} input, ${message.usage.output_tokens} output`
      );
      this.log(`Claude API call successful`);

      return content.text;
    } catch (error) {
      this.log(`Claude API call failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * 코드 블록을 파일로 쓰기
   */
  private async writeFiles(
    projectPath: string,
    codeBlocks: Map<string, string>
  ): Promise<GeneratedFile[]> {
    const generatedFiles: GeneratedFile[] = [];

    for (const [filename, code] of codeBlocks.entries()) {
      const filePath = path.join(projectPath, filename);
      const fileDir = path.dirname(filePath);

      // 디렉토리 생성
      await fs.mkdir(fileDir, { recursive: true });

      // 파일 쓰기
      await fs.writeFile(filePath, code, "utf-8");

      const stats = await fs.stat(filePath);
      generatedFiles.push({
        path: filename,
        size: stats.size,
        type: path.extname(filename),
      });

      this.log(`Generated: ${filename} (${stats.size} bytes)`);
    }

    return generatedFiles;
  }

  /**
   * 프로젝트 구조의 빈 디렉토리 생성
   */
  private async createDirectoryStructure(
    projectPath: string,
    architecture: any
  ): Promise<void> {
    if (!architecture.projectStructure?.directories) {
      return;
    }

    for (const dir of architecture.projectStructure.directories) {
      const dirPath = path.join(projectPath, dir.path);
      await fs.mkdir(dirPath, { recursive: true });
    }

    this.log(`Created directory structure`);
  }

  /**
   * .gitignore 파일 확인 및 생성
   */
  private async ensureGitignore(
    projectPath: string,
    codeBlocks: Map<string, string>
  ): Promise<void> {
    // .gitignore가 이미 생성되었는지 확인
    if (codeBlocks.has(".gitignore")) {
      return;
    }

    // 기본 .gitignore 생성
    const gitignoreContent = `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;

    const gitignorePath = path.join(projectPath, ".gitignore");
    await fs.writeFile(gitignorePath, gitignoreContent, "utf-8");
    this.log(`Generated default .gitignore`);
  }

  /**
   * README.md 생성
   */
  private async generateReadme(
    projectPath: string,
    input: CodeGeneratorInput
  ): Promise<void> {
    const { projectName, description } = input.parsedSpec;

    const readmeContent = `# ${projectName}

${description}

## Generated by SDD System

This project was automatically generated by the Spec-Driven Development (SDD) system.

## Features

${input.parsedSpec.features.map((f) => `- ${f}`).join("\n")}

## Tech Stack

- Frontend: ${input.parsedSpec.techStack.frontend}
- Styling: ${input.parsedSpec.techStack.styling}
${
  input.parsedSpec.techStack.database
    ? `- Database: ${input.parsedSpec.techStack.database}`
    : ""
}
${
  input.parsedSpec.techStack.authentication
    ? `- Authentication: ${input.parsedSpec.techStack.authentication}`
    : ""
}

## Getting Started

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

\`\`\`bash
npm run build
npm start
\`\`\`

## Project Structure

\`\`\`
${projectName}/
${input.architecture.projectStructure.directories
  .map((dir: any) => `├── ${dir.path}/     # ${dir.purpose}`)
  .join("\n")}
\`\`\`

## License

MIT
`;

    const readmePath = path.join(projectPath, "README.md");
    await fs.writeFile(readmePath, readmeContent, "utf-8");
    this.log(`Generated README.md`);
  }
}

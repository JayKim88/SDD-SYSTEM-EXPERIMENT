import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { BaseAgent } from '../base-agent';
import {
  BackendInput,
  BackendOutput,
  GeneratedAPIRoute,
  GeneratedServerAction,
  GeneratedMiddleware,
  GeneratedUtility,
  BackendPlan,
  FileSpec,
} from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Backend Agent
 *
 * API Routes, Server Actions, Database Layer 생성 전문 Agent
 */
export class BackendAgent extends BaseAgent<BackendInput, BackendOutput> {
  constructor(context = {}) {
    super('Backend', '1.0.0', context);
  }

  async execute(input: BackendInput): Promise<BackendOutput> {
    this.log(`Starting Backend Agent`);
    this.log(`Project: ${input.architecture.projectName}`);

    try {
      // 1. 프로젝트 경로 설정
      const projectPath = path.join(
        this.context.outputDir!,
        input.architecture.projectName
      );

      // 2. Backend 파일 필터링
      const backendFiles = this.filterBackendFiles(input.architecture.fileList);
      this.log(`Backend files to generate: ${backendFiles.length}`);

      // 3. Backend 파일 계획
      const backendPlan = this.planBackendFiles(backendFiles);
      this.log(`Backend plan:`);
      this.log(`  - API Routes: ${backendPlan.apiRoutes.length}`);
      this.log(`  - Server Actions: ${backendPlan.serverActions.length}`);
      this.log(`  - Middleware: ${backendPlan.middleware.length}`);
      this.log(`  - Utilities: ${backendPlan.utilities.length}`);
      this.log(`  - Database: ${backendPlan.database.length}`);

      // 4. AGENT.md Instructions 로드
      const agentDir = __dirname;
      const instructions = await this.loadInstructions(agentDir);

      // 5. Claude에게 전달할 프롬프트 구성
      const prompt = this.buildPrompt(input, backendFiles, backendPlan);

      this.log(`Requesting backend code generation from Claude...`);

      // 6. Claude API 호출
      const response = await this.callClaudeForBackend(prompt, instructions);

      // 7. 응답에서 코드 블록 추출
      const codeBlocks = this.extractCodeBlocks(response);
      this.log(`Extracted ${codeBlocks.size} code blocks from response`);

      // 8. 파일 생성
      const generatedFiles = await this.writeFiles(projectPath, codeBlocks);

      // 9. 결과 분류
      const apiRoutes = this.classifyAPIRoutes(generatedFiles);
      const serverActions = this.classifyServerActions(generatedFiles);
      const middleware = this.classifyMiddleware(generatedFiles);
      const utilities = this.classifyUtilities(generatedFiles);

      const output: BackendOutput = {
        projectPath,
        apiRoutes,
        serverActions,
        middleware,
        utilities,
        filesGenerated: generatedFiles.length,
      };

      this.log(`Backend generation completed successfully`);
      this.log(`Generated ${output.filesGenerated} files`);
      this.log(`  - API Routes: ${apiRoutes.length}`);
      this.log(`  - Server Actions: ${serverActions.length}`);
      this.log(`  - Middleware: ${middleware.length}`);
      this.log(`  - Utilities: ${utilities.length}`);

      return output;
    } catch (error) {
      this.log(`Backend generation failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * Backend 파일 필터링
   */
  private filterBackendFiles(fileList: FileSpec[]): FileSpec[] {
    return fileList.filter(file => {
      const filePath = file.path.toLowerCase();
      return (
        filePath.startsWith('app/api/') ||
        filePath.startsWith('lib/actions/') ||
        filePath.startsWith('lib/database/') ||
        filePath.startsWith('lib/auth/') ||
        filePath.startsWith('lib/validations/') ||
        filePath.startsWith('lib/utils/') ||
        filePath === 'middleware.ts' ||
        (filePath.endsWith('.ts') && !filePath.endsWith('.tsx'))
      );
    });
  }

  /**
   * Backend 파일 계획 수립
   */
  private planBackendFiles(files: FileSpec[]): BackendPlan {
    const plan: BackendPlan = {
      apiRoutes: [],
      serverActions: [],
      middleware: [],
      utilities: [],
      database: [],
    };

    for (const file of files) {
      const filePath = file.path.toLowerCase();

      if (filePath.startsWith('app/api/')) {
        plan.apiRoutes.push(file.path);
      } else if (filePath.startsWith('lib/actions/')) {
        plan.serverActions.push(file.path);
      } else if (filePath.includes('middleware')) {
        plan.middleware.push(file.path);
      } else if (filePath.startsWith('lib/database/')) {
        plan.database.push(file.path);
      } else if (
        filePath.startsWith('lib/utils/') ||
        filePath.startsWith('lib/validations/') ||
        filePath.startsWith('lib/auth/')
      ) {
        plan.utilities.push(file.path);
      }
    }

    return plan;
  }

  /**
   * Claude에게 전달할 프롬프트 구성
   */
  private buildPrompt(
    input: BackendInput,
    backendFiles: FileSpec[],
    backendPlan: BackendPlan
  ): string {
    const fileListSummary = backendFiles
      .map(f => `- ${f.path} (${f.purpose})`)
      .join('\n');

    return `
You are a Backend Agent specialized in generating Next.js 14 App Router backend code.

# Project Information

**Project Name**: ${input.parsedSpec.projectName}
**Description**: ${input.parsedSpec.description}

# Tech Stack

- Framework: ${input.parsedSpec.techStack.backend || 'Next.js 14 API Routes'}
- Database: ${input.parsedSpec.techStack.database || 'PostgreSQL'}
- ORM: ${input.parsedSpec.techStack.other?.orm || 'Prisma'}
- Validation: Zod
- Language: TypeScript

# Backend Plan

## API Routes - ${backendPlan.apiRoutes.length} files
${backendPlan.apiRoutes.map(p => `- ${p}`).join('\n') || 'None'}

## Server Actions - ${backendPlan.serverActions.length} files
${backendPlan.serverActions.map(p => `- ${p}`).join('\n') || 'None'}

## Middleware - ${backendPlan.middleware.length} files
${backendPlan.middleware.map(p => `- ${p}`).join('\n') || 'None'}

## Database Layer - ${backendPlan.database.length} files
${backendPlan.database.map(p => `- ${p}`).join('\n') || 'None'}

## Utilities - ${backendPlan.utilities.length} files
${backendPlan.utilities.map(p => `- ${p}`).join('\n') || 'None'}

# Files to Generate

${fileListSummary}

---

# CRITICAL REQUIREMENTS

1. **File Count**: You MUST generate exactly ${backendFiles.length} code blocks

2. **TypeScript**: All files must use TypeScript with strict typing (no \`any\`)

3. **Error Handling**:
   - All API routes MUST have try-catch blocks
   - Return proper HTTP status codes (200, 201, 400, 401, 404, 500)
   - Log errors with console.error

4. **Validation**:
   - Use Zod for all input validation
   - Validate request body, params, and query parameters
   - Return 400 status with error details for validation failures

5. **Authentication**:
   - Add auth checks on protected routes
   - Use getCurrentUser() or requireAuth() helpers
   - Return 401 status for unauthorized requests

6. **Database**:
   - Separate database logic into lib/database/ files
   - Use proper TypeScript types for inputs and outputs
   - Handle errors (not found, constraint violations)

7. **API Route Structure**:
   - Import NextRequest and NextResponse from 'next/server'
   - Export named functions (GET, POST, PUT, DELETE, PATCH)
   - Handle dynamic route params: ({ params }: { params: { id: string } })

8. **Response Format**:
   - Success: NextResponse.json(data, { status: 200 })
   - Error: NextResponse.json({ error: 'message' }, { status: code })

---

# Output Format

Generate ALL backend files as code blocks with exact file paths:

\`\`\`typescript:app/api/todos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const todoSchema = z.object({
  title: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    // ... implementation
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
\`\`\`

**Generate ALL ${backendFiles.length} files now. Do not skip any files.**
`.trim();
  }

  /**
   * Backend 전용 Claude API 호출
   */
  private async callClaudeForBackend(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    this.log(`Calling Claude API for backend generation...`);
    this.log(`Using max_tokens: 64000`);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 64000,
        temperature: 0.2,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      this.log(`Tokens used: ${message.usage.input_tokens} input, ${message.usage.output_tokens} output`);
      this.log(`Response length: ${content.text.length} characters`);
      this.log(`Response preview: ${content.text.substring(0, 200)}...`);
      this.log(`Claude API call successful`);

      return content.text;
    } catch (error) {
      this.log(`Claude API call failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * 파일 생성
   */
  private async writeFiles(
    projectPath: string,
    codeBlocks: Map<string, string>
  ): Promise<Array<{ path: string; size: number; content: string }>> {
    const generatedFiles: Array<{ path: string; size: number; content: string }> = [];

    for (const [filename, code] of codeBlocks.entries()) {
      const filePath = path.join(projectPath, filename);
      const fileDir = path.dirname(filePath);

      // 디렉토리 생성
      await fs.mkdir(fileDir, { recursive: true });

      // 파일 쓰기
      await fs.writeFile(filePath, code, 'utf-8');

      const stats = await fs.stat(filePath);
      generatedFiles.push({
        path: filename,
        size: stats.size,
        content: code,
      });

      this.log(`Generated: ${filename} (${stats.size} bytes)`);
    }

    return generatedFiles;
  }

  /**
   * API Routes 분류
   */
  private classifyAPIRoutes(
    files: Array<{ path: string; size: number; content: string }>
  ): GeneratedAPIRoute[] {
    return files
      .filter(f => f.path.startsWith('app/api/'))
      .map(file => {
        // Extract endpoint from path: app/api/todos/route.ts -> /api/todos
        const endpoint = '/' + file.path
          .replace('app/', '')
          .replace('/route.ts', '')
          .replace('/[', '/:')
          .replace(']', '');

        // Detect HTTP methods
        const methods: string[] = [];
        if (file.content.includes('export async function GET')) methods.push('GET');
        if (file.content.includes('export async function POST')) methods.push('POST');
        if (file.content.includes('export async function PUT')) methods.push('PUT');
        if (file.content.includes('export async function DELETE')) methods.push('DELETE');
        if (file.content.includes('export async function PATCH')) methods.push('PATCH');

        const hasValidation = file.content.includes('z.object') || file.content.includes('.parse(');
        const hasAuth = file.content.includes('getCurrentUser') || file.content.includes('requireAuth');

        return {
          path: file.path,
          endpoint,
          methods,
          hasValidation,
          hasAuth,
          size: file.size,
        };
      });
  }

  /**
   * Server Actions 분류
   */
  private classifyServerActions(
    files: Array<{ path: string; size: number; content: string }>
  ): GeneratedServerAction[] {
    return files
      .filter(f => f.path.startsWith('lib/actions/'))
      .map(file => {
        const name = path.basename(file.path, path.extname(file.path));
        const hasValidation = file.content.includes('z.object') || file.content.includes('.parse(');

        return {
          path: file.path,
          name,
          hasValidation,
          size: file.size,
        };
      });
  }

  /**
   * Middleware 분류
   */
  private classifyMiddleware(
    files: Array<{ path: string; size: number; content: string }>
  ): GeneratedMiddleware[] {
    return files
      .filter(f => f.path.toLowerCase().includes('middleware'))
      .map(file => {
        const name = path.basename(file.path, path.extname(file.path));

        let purpose = 'General';
        if (file.content.includes('auth') || file.content.includes('session')) {
          purpose = 'Authentication';
        } else if (file.content.includes('cors')) {
          purpose = 'CORS';
        } else if (file.content.includes('log')) {
          purpose = 'Logging';
        }

        return {
          path: file.path,
          name,
          purpose,
          size: file.size,
        };
      });
  }

  /**
   * Utilities 분류
   */
  private classifyUtilities(
    files: Array<{ path: string; size: number; content: string }>
  ): GeneratedUtility[] {
    return files
      .filter(f =>
        f.path.startsWith('lib/utils/') ||
        f.path.startsWith('lib/validations/') ||
        f.path.startsWith('lib/auth/') ||
        f.path.startsWith('lib/database/')
      )
      .map(file => {
        const name = path.basename(file.path, path.extname(file.path));

        // Extract function names (simple regex)
        const functionMatches = file.content.matchAll(/export (?:async )?function (\w+)/g);
        const functions = Array.from(functionMatches).map(m => m[1]);

        return {
          path: file.path,
          name,
          functions,
          size: file.size,
        };
      });
  }
}

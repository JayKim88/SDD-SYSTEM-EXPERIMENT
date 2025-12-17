import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { BaseAgent } from '../base-agent';
import {
  TestingInput,
  TestingOutput,
  GeneratedTest,
  GeneratedTestConfig,
  TestPlan,
  TestType,
  TestConfigType,
} from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Testing Agent
 *
 * 테스트 파일 생성 전문 Agent
 */
export class TestingAgent extends BaseAgent<TestingInput, TestingOutput> {
  constructor(context = {}) {
    super('Testing', '1.0.0', context);
  }

  async execute(input: TestingInput): Promise<TestingOutput> {
    this.log(`Starting Testing Agent`);
    this.log(`Project: ${input.architecture.projectName}`);

    try {
      // 1. 프로젝트 경로 설정
      const projectPath = path.join(
        this.context.outputDir!,
        input.architecture.projectName
      );

      // 2. 테스트 계획 수립
      const testPlan = this.planTests(input);
      this.log(`Test plan:`);
      this.log(`  - Component tests: ${testPlan.componentTests.length}`);
      this.log(`  - API tests: ${testPlan.apiTests.length}`);
      this.log(`  - E2E scenarios: ${testPlan.e2eScenarios.length}`);

      // 3. AGENT.md Instructions 로드
      const agentDir = __dirname;
      const instructions = await this.loadInstructions(agentDir);

      // 4. Claude에게 전달할 프롬프트 구성
      const prompt = this.buildPrompt(input, testPlan);

      this.log(`Requesting test generation from Claude...`);

      // 5. Claude API 호출
      const response = await this.callClaudeForTesting(prompt, instructions);

      // 6. 응답에서 코드 블록 추출
      const codeBlocks = this.extractCodeBlocks(response);
      this.log(`Extracted ${codeBlocks.size} code blocks from response`);

      // 7. 파일 생성
      const generatedFiles = await this.writeFiles(projectPath, codeBlocks);

      // 8. 결과 분류
      const componentTests = this.classifyTests(generatedFiles, 'component');
      const apiTests = this.classifyTests(generatedFiles, 'api');
      const e2eTests = this.classifyTests(generatedFiles, 'e2e');
      const configFiles = this.classifyConfigs(generatedFiles);

      const output: TestingOutput = {
        projectPath,
        componentTests,
        apiTests,
        e2eTests,
        configFiles,
        filesGenerated: generatedFiles.length,
      };

      this.log(`Testing generation completed successfully`);
      this.log(`Generated ${output.filesGenerated} files`);
      this.log(`  - Component tests: ${componentTests.length}`);
      this.log(`  - API tests: ${apiTests.length}`);
      this.log(`  - E2E tests: ${e2eTests.length}`);
      this.log(`  - Config files: ${configFiles.length}`);

      return output;
    } catch (error) {
      this.log(`Testing generation failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * 테스트 계획 수립
   */
  private planTests(input: TestingInput): TestPlan {
    const componentTests: string[] = [];
    const apiTests: string[] = [];
    const e2eScenarios: string[] = [];

    // Component tests (Frontend Agent가 생성한 컴포넌트들)
    for (const component of input.frontend.components) {
      componentTests.push(component.path);
    }

    // API tests (Backend Agent가 생성한 API routes)
    for (const apiRoute of input.backend.apiRoutes) {
      apiTests.push(apiRoute.path);
    }

    // E2E scenarios (주요 기능들)
    const features = input.parsedSpec.features || [];
    for (const feature of features) {
      const scenarioName = feature
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      e2eScenarios.push(scenarioName);
    }

    // 최소 1개의 E2E 시나리오는 생성
    if (e2eScenarios.length === 0) {
      e2eScenarios.push('user-flow');
    }

    return {
      framework: 'vitest',
      e2eFramework: 'playwright',
      componentTests,
      apiTests,
      e2eScenarios,
      needsSetup: true,
    };
  }

  /**
   * Claude에게 전달할 프롬프트 구성
   */
  private buildPrompt(
    input: TestingInput,
    testPlan: TestPlan
  ): string {
    const componentList = testPlan.componentTests
      .map(p => `- ${p}`)
      .join('\n');

    const apiList = testPlan.apiTests
      .map(p => `- ${p}`)
      .join('\n');

    const e2eList = testPlan.e2eScenarios
      .map(s => `- ${s}`)
      .join('\n');

    return `
You are a Testing Agent specialized in generating test suites for Next.js applications.

# Project Information

**Project Name**: ${input.parsedSpec.projectName}
**Description**: ${input.parsedSpec.description}

# Test Stack

- **Framework**: Vitest (Component & API tests)
- **E2E**: Playwright
- **Library**: React Testing Library
- **Assertions**: @testing-library/jest-dom

# Components to Test (${testPlan.componentTests.length} files)

${componentList || 'None'}

# API Routes to Test (${testPlan.apiTests.length} files)

${apiList || 'None'}

# E2E Scenarios (${testPlan.e2eScenarios.length} scenarios)

${e2eList}

---

# CRITICAL REQUIREMENTS

1. **File Count**: Generate exactly ${testPlan.componentTests.length + testPlan.apiTests.length + testPlan.e2eScenarios.length + 4} files
   - ${testPlan.componentTests.length} component test files
   - ${testPlan.apiTests.length} API test files
   - ${testPlan.e2eScenarios.length} E2E test files
   - 4 config files (vitest.config.ts, vitest.setup.ts, playwright.config.ts, tsconfig.test.json)

2. **Test Coverage**: Each test file should have 3-5 test cases minimum

3. **Accessibility-First**: Use accessible queries (getByRole, getByLabelText)

4. **TypeScript**: All tests must use TypeScript with proper types

5. **Realistic Data**: Use realistic mock data

6. **Mocking**: Mock database and external dependencies

7. **Component Test Pattern**:
   \`\`\`typescript
   import { render, screen } from '@testing-library/react'
   import { describe, it, expect, vi } from 'vitest'
   import userEvent from '@testing-library/user-event'
   import { ComponentName } from './ComponentName'

   describe('ComponentName', () => {
     it('renders correctly', () => {
       render(<ComponentName />)
       expect(screen.getByRole('...')).toBeInTheDocument()
     })

     it('handles user interactions', async () => {
       const handleClick = vi.fn()
       render(<ComponentName onClick={handleClick} />)

       await userEvent.click(screen.getByRole('button'))
       expect(handleClick).toHaveBeenCalled()
     })
   })
   \`\`\`

8. **API Test Pattern**:
   \`\`\`typescript
   import { describe, it, expect, vi } from 'vitest'
   import { GET, POST } from './route'
   import { prisma } from '@/lib/database'

   vi.mock('@/lib/database', () => ({
     prisma: {
       // Mock database methods
     },
   }))

   describe('GET /api/endpoint', () => {
     it('returns expected data', async () => {
       const request = new Request('http://localhost:3000/api/endpoint')
       const response = await GET(request)
       const data = await response.json()

       expect(response.status).toBe(200)
       expect(data.success).toBe(true)
     })
   })
   \`\`\`

9. **E2E Test Pattern**:
   \`\`\`typescript
   import { test, expect } from '@playwright/test'

   test.describe('Scenario Name', () => {
     test.beforeEach(async ({ page }) => {
       await page.goto('/')
     })

     test('user can complete action', async ({ page }) => {
       await page.getByRole('button', { name: /action/i }).click()
       await expect(page.getByText('Success')).toBeVisible()
     })
   })
   \`\`\`

---

# Output Format

Generate ALL test files as code blocks with exact file paths:

**Component Tests:**
\`\`\`typescript:components/ui/Button.test.tsx
// Test implementation
\`\`\`

**API Tests:**
\`\`\`typescript:app/api/todos/route.test.ts
// Test implementation
\`\`\`

**E2E Tests:**
\`\`\`typescript:e2e/user-flow.spec.ts
// Test implementation
\`\`\`

**Config Files:**
\`\`\`typescript:vitest.config.ts
// Vitest configuration
\`\`\`

\`\`\`typescript:vitest.setup.ts
// Test setup
\`\`\`

\`\`\`typescript:playwright.config.ts
// Playwright configuration
\`\`\`

\`\`\`json:tsconfig.test.json
// TypeScript config for tests
\`\`\`

**Generate ALL ${testPlan.componentTests.length + testPlan.apiTests.length + testPlan.e2eScenarios.length + 4} files now. Do not skip any files.**
`.trim();
  }

  /**
   * Testing 전용 Claude API 호출
   */
  private async callClaudeForTesting(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    this.log(`Calling Claude API for testing generation...`);
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
   * 테스트 파일 분류
   */
  private classifyTests(
    files: Array<{ path: string; size: number; content: string }>,
    testType: TestType
  ): GeneratedTest[] {
    let filter: (path: string) => boolean;

    if (testType === 'component') {
      filter = (p) => p.includes('components/') && p.endsWith('.test.tsx');
    } else if (testType === 'api') {
      filter = (p) => p.includes('app/api/') && p.endsWith('.test.ts');
    } else if (testType === 'e2e') {
      filter = (p) => p.includes('e2e/') && p.endsWith('.spec.ts');
    } else {
      filter = () => false;
    }

    return files
      .filter(f => filter(f.path))
      .map(file => {
        // Extract test count
        const testMatches = file.content.match(/\b(test|it)\s*\(/g);
        const testCount = testMatches ? testMatches.length : 0;

        // Extract target file
        const targetFile = file.path.replace(/\.test\.(tsx?|spec\.ts)$/, '.$1');

        // Extract coverage (describe blocks)
        const coverageMatches = file.content.matchAll(/describe\s*\(\s*['"`]([^'"`]+)['"`]/g);
        const coverage: string[] = [];
        for (const match of coverageMatches) {
          coverage.push(match[1]);
        }

        return {
          path: file.path,
          testType,
          targetFile,
          testCount,
          coverage,
          size: file.size,
        };
      });
  }

  /**
   * Config 파일 분류
   */
  private classifyConfigs(
    files: Array<{ path: string; size: number; content: string }>
  ): GeneratedTestConfig[] {
    const configPatterns: Array<{ pattern: RegExp; type: TestConfigType }> = [
      { pattern: /vitest\.config\.ts$/, type: 'vitest.config' },
      { pattern: /vitest\.setup\.ts$/, type: 'test-setup' },
      { pattern: /playwright\.config\.ts$/, type: 'playwright.config' },
      { pattern: /tsconfig\.test\.json$/, type: 'test-utils' },
    ];

    return files
      .filter(f => configPatterns.some(cp => cp.pattern.test(f.path)))
      .map(file => {
        const matchedPattern = configPatterns.find(cp => cp.pattern.test(file.path));

        return {
          path: file.path,
          configType: matchedPattern!.type,
          size: file.size,
        };
      });
  }
}

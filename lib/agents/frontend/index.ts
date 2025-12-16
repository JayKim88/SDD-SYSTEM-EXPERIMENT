import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { BaseAgent } from '../base-agent';
import {
  FrontendInput,
  FrontendOutput,
  GeneratedComponent,
  GeneratedPage,
  GeneratedProvider,
  ComponentPlan,
  FileSpec,
} from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Frontend Agent
 *
 * React/Next.js 컴포넌트 생성 전문 Agent
 */
export class FrontendAgent extends BaseAgent<FrontendInput, FrontendOutput> {
  constructor(context = {}) {
    super('Frontend', '1.0.0', context);
  }

  async execute(input: FrontendInput): Promise<FrontendOutput> {
    this.log(`Starting Frontend Agent`);
    this.log(`Project: ${input.architecture.projectName}`);

    try {
      // 1. 프로젝트 경로 설정
      const projectPath = path.join(
        this.context.outputDir!,
        input.architecture.projectName
      );

      // 2. Frontend 파일 필터링
      const frontendFiles = this.filterFrontendFiles(input.architecture.fileList);
      this.log(`Frontend files to generate: ${frontendFiles.length}`);

      // 3. 컴포넌트 생성 계획
      const componentPlan = this.planComponents(frontendFiles);
      this.log(`Component plan:`);
      this.log(`  - Atoms: ${componentPlan.atoms.length}`);
      this.log(`  - Molecules: ${componentPlan.molecules.length}`);
      this.log(`  - Organisms: ${componentPlan.organisms.length}`);
      this.log(`  - Pages: ${componentPlan.pages.length}`);
      this.log(`  - Providers: ${componentPlan.providers.length}`);

      // 4. AGENT.md Instructions 로드
      const agentDir = __dirname;
      const instructions = await this.loadInstructions(agentDir);

      // 5. Claude에게 전달할 프롬프트 구성
      const prompt = this.buildPrompt(input, frontendFiles, componentPlan);

      this.log(`Requesting component generation from Claude...`);

      // 6. Claude API 호출
      const response = await this.callClaudeForFrontend(prompt, instructions);

      // 7. 응답에서 코드 블록 추출
      const codeBlocks = this.extractCodeBlocks(response);
      this.log(`Extracted ${codeBlocks.size} code blocks from response`);

      // 8. 파일 생성
      const generatedFiles = await this.writeFiles(projectPath, codeBlocks);

      // 9. 결과 분류
      const components = this.classifyComponents(generatedFiles);
      const pages = this.classifyPages(generatedFiles);
      const providers = this.classifyProviders(generatedFiles);

      const output: FrontendOutput = {
        projectPath,
        components,
        pages,
        providers,
        filesGenerated: generatedFiles.length,
      };

      this.log(`Frontend generation completed successfully`);
      this.log(`Generated ${output.filesGenerated} files`);
      this.log(`  - Components: ${components.length}`);
      this.log(`  - Pages: ${pages.length}`);
      this.log(`  - Providers: ${providers.length}`);

      return output;
    } catch (error) {
      this.log(`Frontend generation failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * Frontend 파일 필터링
   */
  private filterFrontendFiles(fileList: FileSpec[]): FileSpec[] {
    return fileList.filter(file => {
      const filePath = file.path.toLowerCase();
      return (
        // app/ 폴더이지만 api/ 제외 (Backend Agent 담당)
        (filePath.startsWith('app/') && !filePath.startsWith('app/api/')) ||
        filePath.startsWith('components/') ||
        filePath.startsWith('contexts/') ||
        // .tsx/.jsx 파일이지만 app/api/ 제외
        ((filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) && !filePath.startsWith('app/api/'))
      );
    });
  }

  /**
   * 컴포넌트 생성 계획 수립
   */
  private planComponents(files: FileSpec[]): ComponentPlan {
    const plan: ComponentPlan = {
      atoms: [],
      molecules: [],
      organisms: [],
      pages: [],
      providers: [],
    };

    for (const file of files) {
      const path = file.path.toLowerCase();

      if (path.includes('components/ui/')) {
        plan.atoms.push(file.path);
      } else if (path.includes('components/forms/')) {
        plan.molecules.push(file.path);
      } else if (path.includes('components/layout/') || path.includes('components/')) {
        plan.organisms.push(file.path);
      } else if (path.includes('/page.tsx')) {
        plan.pages.push(file.path);
      } else if (path.includes('contexts/') || path.includes('providers')) {
        plan.providers.push(file.path);
      }
    }

    return plan;
  }

  /**
   * Claude에게 전달할 프롬프트 구성
   */
  private buildPrompt(
    input: FrontendInput,
    frontendFiles: FileSpec[],
    componentPlan: ComponentPlan
  ): string {
    const fileListSummary = frontendFiles
      .map(f => `- ${f.path} (${f.purpose})`)
      .join('\n');

    return `
You are a Frontend Agent specialized in generating React/Next.js components.

# Project Information

**Project Name**: ${input.parsedSpec.projectName}
**Description**: ${input.parsedSpec.description}

# Tech Stack

- Framework: ${input.parsedSpec.techStack.frontend || 'Next.js 14'}
- Styling: ${input.parsedSpec.techStack.styling || 'Tailwind CSS'}
- Language: TypeScript

# Component Plan

## UI Components (Atoms) - ${componentPlan.atoms.length} files
${componentPlan.atoms.map(p => `- ${p}`).join('\n') || 'None'}

## Feature Components (Molecules) - ${componentPlan.molecules.length} files
${componentPlan.molecules.map(p => `- ${p}`).join('\n') || 'None'}

## Layout Components (Organisms) - ${componentPlan.organisms.length} files
${componentPlan.organisms.map(p => `- ${p}`).join('\n') || 'None'}

## Pages - ${componentPlan.pages.length} files
${componentPlan.pages.map(p => `- ${p}`).join('\n') || 'None'}

## Providers - ${componentPlan.providers.length} files
${componentPlan.providers.map(p => `- ${p}`).join('\n') || 'None'}

# Files to Generate

${fileListSummary}

---

# CRITICAL REQUIREMENTS

1. **File Count**: You MUST generate exactly ${frontendFiles.length} code blocks

2. **TypeScript**: All components must use TypeScript with proper types

3. **'use client' Directive**:
   - Add 'use client' to components with:
     - Event handlers (onClick, onChange, etc.)
     - React hooks (useState, useEffect, etc.)
     - Browser APIs (localStorage, window, etc.)
   - Do NOT add to static Server Components

4. **Accessibility**:
   - Include ARIA attributes for all interactive elements
   - Support keyboard navigation
   - Ensure color contrast ≥ 4.5:1
   - Add alt text to all images

5. **Tailwind CSS**: Use Tailwind for all styling (no inline styles or CSS modules)

6. **Responsive Design**: Mobile-first approach with responsive breakpoints

7. **Provider Pattern**:
   - If using Context or QueryClient, create contexts/Providers.tsx
   - Keep app/layout.tsx as Server Component

8. **Performance**:
   - Use dynamic imports for heavy components
   - Apply React.memo where appropriate
   - Use Next.js Image component for images

---

# Output Format

Generate ALL components as code blocks with exact file paths:

\`\`\`typescript:components/ui/Button.tsx
'use client'

import { ButtonHTMLAttributes } from 'react'

export function Button({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props}>{children}</button>
}
\`\`\`

**Generate ALL ${frontendFiles.length} files now. Do not skip any files.**
`.trim();
  }

  /**
   * Frontend 전용 Claude API 호출
   */
  private async callClaudeForFrontend(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    this.log(`Calling Claude API for frontend generation...`);
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
   * 컴포넌트 분류
   */
  private classifyComponents(
    files: Array<{ path: string; size: number; content: string }>
  ): GeneratedComponent[] {
    return files
      .filter(f => f.path.includes('components/'))
      .map(file => {
        const name = path.basename(file.path, path.extname(file.path));
        const isClient = file.content.includes("'use client'") || file.content.includes('"use client"');
        const hasAccessibility = /aria-|role=|alt=/.test(file.content);

        let type: 'atom' | 'molecule' | 'organism' = 'organism';
        if (file.path.includes('components/ui/')) {
          type = 'atom';
        } else if (file.path.includes('components/forms/')) {
          type = 'molecule';
        }

        return {
          path: file.path,
          name,
          type,
          isClient,
          hasAccessibility,
          size: file.size,
        };
      });
  }

  /**
   * 페이지 분류
   */
  private classifyPages(
    files: Array<{ path: string; size: number; content: string }>
  ): GeneratedPage[] {
    return files
      .filter(f => f.path.includes('/page.tsx'))
      .map(file => {
        const route = file.path
          .replace('app', '')
          .replace('/page.tsx', '')
          .replace(/\(.*?\)/g, '') // Remove route groups
          || '/';

        const isClient = file.content.includes("'use client'") || file.content.includes('"use client"');

        const layoutMatch = file.path.match(/(.*)\/page\.tsx$/);
        const layout = layoutMatch ? `${layoutMatch[1]}/layout.tsx` : undefined;

        return {
          path: file.path,
          route,
          isClient,
          layout,
          size: file.size,
        };
      });
  }

  /**
   * Provider 분류
   */
  private classifyProviders(
    files: Array<{ path: string; size: number; content: string }>
  ): GeneratedProvider[] {
    return files
      .filter(f =>
        f.path.includes('contexts/') ||
        f.path.toLowerCase().includes('provider')
      )
      .map(file => {
        const name = path.basename(file.path, path.extname(file.path));

        // Extract provided features from content
        const provides: string[] = [];
        if (file.content.includes('QueryClient')) provides.push('QueryClient');
        if (file.content.includes('AuthContext')) provides.push('AuthContext');
        if (file.content.includes('ThemeContext')) provides.push('ThemeContext');
        if (file.content.includes('Toaster')) provides.push('Toaster');

        return {
          path: file.path,
          name,
          provides,
          size: file.size,
        };
      });
  }
}

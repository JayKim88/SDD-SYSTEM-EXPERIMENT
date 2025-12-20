import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { BaseAgent } from '../base-agent';
import {
  SpecWriterInput,
  SpecWriterOutput,
  ReviewResults,
} from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Spec Writer Agent
 *
 * 사용자와 대화하면서 애플리케이션 사양을 작성하고 개선합니다.
 */
export class SpecWriterAgent extends BaseAgent<SpecWriterInput, SpecWriterOutput> {
  constructor(context = {}) {
    super('SpecWriter', '1.0.0', context);
  }

  async execute(input: SpecWriterInput): Promise<SpecWriterOutput> {
    this.log(`Starting Spec Writer Agent in ${input.mode.toUpperCase()} mode`);

    try {
      // AGENT.md Instructions 로드
      const agentDir = __dirname;
      const instructions = await this.loadInstructions(agentDir);

      let output: SpecWriterOutput;

      switch (input.mode) {
        case 'new':
          output = await this.executeNewMode(input, instructions);
          break;
        case 'refine':
          output = await this.executeRefineMode(input, instructions);
          break;
        case 'review':
          output = await this.executeReviewMode(input, instructions);
          break;
        default:
          throw new Error(`Unknown mode: ${input.mode}`);
      }

      this.log(`Spec Writer Agent completed successfully`);
      this.log(`Spec file: ${output.specPath}`);
      this.log(`Overall score: ${output.reviewResults.overall}/100`);

      return output;
    } catch (error) {
      this.log(`Spec Writer Agent failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * NEW 모드: 새로운 spec 작성
   */
  private async executeNewMode(
    input: SpecWriterInput,
    instructions: string
  ): Promise<SpecWriterOutput> {
    this.log('Creating new specification from scratch...');

    // 1. 템플릿 로드 (있으면)
    let templateContent = '';
    if (input.templateType) {
      templateContent = await this.loadTemplate(input.templateType);
    }

    // 2. Claude에게 전달할 프롬프트 구성
    const prompt = this.buildNewModePrompt(input, templateContent);

    // 3. Claude API 호출
    this.log('Calling Claude to generate specification...');
    const response = await this.callClaude(prompt, instructions);

    // 4. 응답에서 spec 추출
    const specContent = this.extractMarkdown(response);

    // 5. spec 파일 저장
    const specPath = await this.saveSpec(specContent, input);

    // 6. 생성된 spec 검토
    const reviewResults = await this.reviewSpec(specPath, instructions);

    // 7. 통계 계산
    const stats = this.calculateStats(specContent);

    // 8. 섹션 확인
    const sections = this.checkSections(specContent);

    return {
      specPath,
      mode: 'new',
      sections,
      reviewResults,
      stats,
    };
  }

  /**
   * REFINE 모드: 기존 spec 개선
   */
  private async executeRefineMode(
    input: SpecWriterInput,
    instructions: string
  ): Promise<SpecWriterOutput> {
    this.log('Refining existing specification...');

    if (!input.existingSpecPath) {
      throw new Error('existingSpecPath is required for refine mode');
    }

    // 1. 기존 spec 읽기
    const existingContent = await fs.readFile(input.existingSpecPath, 'utf-8');

    // 2. Claude에게 전달할 프롬프트 구성
    const prompt = this.buildRefineModePrompt(existingContent);

    // 3. Claude API 호출
    this.log('Calling Claude to refine specification...');
    const response = await this.callClaude(prompt, instructions);

    // 4. 응답에서 개선된 spec 추출
    const refinedContent = this.extractMarkdown(response);

    // 5. spec 파일 저장
    const specPath = await this.saveSpec(refinedContent, input);

    // 6. 개선된 spec 검토
    const reviewResults = await this.reviewSpec(specPath, instructions);

    // 7. 통계 계산
    const stats = this.calculateStats(refinedContent);

    // 8. 섹션 확인
    const sections = this.checkSections(refinedContent);

    return {
      specPath,
      mode: 'refine',
      sections,
      reviewResults,
      stats,
    };
  }

  /**
   * REVIEW 모드: spec 검토
   */
  private async executeReviewMode(
    input: SpecWriterInput,
    instructions: string
  ): Promise<SpecWriterOutput> {
    this.log('Reviewing specification...');

    if (!input.existingSpecPath) {
      throw new Error('existingSpecPath is required for review mode');
    }

    // 1. 기존 spec 읽기
    const existingContent = await fs.readFile(input.existingSpecPath, 'utf-8');

    // 2. 검토 수행
    const reviewResults = await this.reviewSpec(input.existingSpecPath, instructions);

    // 3. 통계 계산
    const stats = this.calculateStats(existingContent);

    // 4. 섹션 확인
    const sections = this.checkSections(existingContent);

    // 5. 자동 수정 (옵션)
    let specPath = input.existingSpecPath;
    if (input.autoFix && reviewResults.issues.some((i) => i.severity === 'critical')) {
      this.log('Auto-fixing critical issues...');
      const fixedContent = await this.autoFix(existingContent, reviewResults, instructions);
      specPath = await this.saveSpec(fixedContent, input);
    }

    return {
      specPath,
      mode: 'review',
      sections,
      reviewResults,
      stats,
    };
  }

  /**
   * Spec 검토 수행
   */
  private async reviewSpec(specPath: string, instructions: string): Promise<ReviewResults> {
    this.log('Reviewing specification for quality and consistency...');

    const specContent = await fs.readFile(specPath, 'utf-8');

    const prompt = `
Please review the following specification and provide a detailed analysis.

# Specification

${specContent}

---

Perform a comprehensive review and return a JSON object with:
1. Scores (0-100) for consistency, completeness, feasibility, and overall
2. List of issues (critical, warning, info) with detailed descriptions
3. List of suggestions for improvement

Return ONLY the JSON object, no other text.
`.trim();

    const response = await this.callClaude(prompt, instructions);
    const reviewResults = this.extractJSON<ReviewResults>(response);

    this.log(`Review completed - Overall score: ${reviewResults.overall}/100`);
    this.log(`Found ${reviewResults.issues.length} issues`);

    return reviewResults;
  }

  /**
   * Critical 이슈 자동 수정
   */
  private async autoFix(
    specContent: string,
    reviewResults: ReviewResults,
    instructions: string
  ): Promise<string> {
    const criticalIssues = reviewResults.issues.filter((i) => i.severity === 'critical');

    const prompt = `
Please fix the following critical issues in this specification:

# Specification

${specContent}

---

# Critical Issues to Fix

${criticalIssues.map((issue, i) => `${i + 1}. ${issue.message}\n   Suggestion: ${issue.suggestion || 'N/A'}`).join('\n\n')}

---

Return the fixed specification in Markdown format. Fix ONLY the critical issues listed above.
`.trim();

    const response = await this.callClaude(prompt, instructions);
    return this.extractMarkdown(response);
  }

  /**
   * NEW 모드 프롬프트 구성
   */
  private buildNewModePrompt(input: SpecWriterInput, templateContent: string): string {
    let prompt = `
Please create a complete application specification based on the following idea:

**User Idea**: ${input.idea || input.initialPrompt || 'No specific idea provided'}
`.trim();

    if (templateContent) {
      prompt += `\n\n**Template to follow**:\n\n${templateContent}`;
    }

    prompt += `\n\nPlease create a comprehensive specification document in Markdown format.`;

    return prompt;
  }

  /**
   * REFINE 모드 프롬프트 구성
   */
  private buildRefineModePrompt(existingContent: string): string {
    return `
Please refine and improve the following specification:

# Current Specification

${existingContent}

---

Analyze the specification and:
1. Fill in any missing sections
2. Fix inconsistencies
3. Add missing data models, API endpoints, or pages
4. Improve descriptions
5. Ensure all best practices are followed

Return the improved specification in Markdown format.
`.trim();
  }

  /**
   * 템플릿 로드
   */
  private async loadTemplate(templateType: string): Promise<string> {
    const templatePath = path.join(__dirname, 'templates', `${templateType}.md`);
    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      this.log(`Template not found: ${templateType}, using basic template`, true);
      return '';
    }
  }

  /**
   * Spec 파일 저장
   */
  private async saveSpec(content: string, input: SpecWriterInput): Promise<string> {
    let specPath = input.outputPath;

    if (!specPath) {
      // 프로젝트 이름 추출
      const projectNameMatch = content.match(/^#\s+(.+)$/m);
      const projectName = projectNameMatch
        ? projectNameMatch[1].toLowerCase().replace(/\s+/g, '-')
        : 'new-project';

      const specsDir = path.join(process.cwd(), 'specs');
      await fs.mkdir(specsDir, { recursive: true });
      specPath = path.join(specsDir, `${projectName}.md`);
    }

    await fs.writeFile(specPath, content, 'utf-8');
    this.log(`Spec saved to: ${specPath}`);

    return specPath;
  }

  /**
   * 섹션 확인
   */
  private checkSections(content: string): {
    projectInfo: boolean;
    features: boolean;
    dataModels: boolean;
    apiEndpoints: boolean;
    pages: boolean;
    techStack: boolean;
    seedData: boolean;
  } {
    return {
      projectInfo: /## 프로젝트 정보/i.test(content) || /## Project Info/i.test(content),
      features: /## 핵심 기능/i.test(content) || /## Features/i.test(content),
      dataModels: /## 데이터 모델/i.test(content) || /## Data Model/i.test(content),
      apiEndpoints: /## API 엔드포인트/i.test(content) || /## API Endpoint/i.test(content),
      pages: /## 페이지 구성/i.test(content) || /## Pages/i.test(content),
      techStack: /## 기술 스택/i.test(content) || /## Tech Stack/i.test(content),
      seedData:
        /## 초기 데이터/i.test(content) ||
        /## Seed Data/i.test(content) ||
        /## Initial Data/i.test(content),
    };
  }

  /**
   * 통계 계산
   */
  private calculateStats(content: string): {
    totalLines: number;
    dataModelsCount: number;
    apiEndpointsCount: number;
    pagesCount: number;
  } {
    const lines = content.split('\n');
    const dataModelsCount = (content.match(/^###\s+\w+\s*\(/gm) || []).length;
    const apiEndpointsCount = (content.match(/^-\s+`(GET|POST|PUT|PATCH|DELETE)/gm) || []).length;
    const pagesCount = (content.match(/^###\s+\d+\.\s+.+\s+\(`\//gm) || []).length;

    return {
      totalLines: lines.length,
      dataModelsCount,
      apiEndpointsCount,
      pagesCount,
    };
  }

  /**
   * Markdown 추출 (코드 블록에서)
   */
  private extractMarkdown(response: string): string {
    // ```markdown ... ``` 블록 찾기
    const markdownMatch = response.match(/```markdown\n([\s\S]+?)\n```/);
    if (markdownMatch) {
      return markdownMatch[1].trim();
    }

    // ```md ... ``` 블록 찾기
    const mdMatch = response.match(/```md\n([\s\S]+?)\n```/);
    if (mdMatch) {
      return mdMatch[1].trim();
    }

    // 코드 블록이 없으면 전체 응답 사용
    return response.trim();
  }
}

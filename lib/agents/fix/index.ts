import * as path from 'path';
import * as fs from 'fs/promises';
import { execSync } from 'child_process';
import { BaseAgent } from '../base-agent';
import {
  FixInput,
  FixOutput,
  ErrorInfo,
  ErrorType,
  FixAttempt,
  ErrorGroup,
} from './types';

/**
 * Fix Agent
 *
 * TypeScript/ESLint 에러 자동 수정 Agent
 */
export class FixAgent extends BaseAgent<FixInput, FixOutput> {
  constructor(context = {}) {
    super('Fix', '1.0.0', context);
  }

  async execute(input: FixInput): Promise<FixOutput> {
    this.log(`Starting Fix Agent`);
    this.log(`Project: ${input.projectPath}`);

    const maxAttempts = input.maxAttempts ?? 3;
    const checkTypes = input.checkTypes ?? true;
    const checkLint = input.checkLint ?? true;

    const fixResults: FixAttempt[] = [];
    const allFixedErrors: ErrorInfo[] = [];
    const allModifiedFiles = new Set<string>();

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        this.log(`\n=== Fix Attempt ${attempt}/${maxAttempts} ===`);
        const startTime = Date.now();

        // 1. 에러 검사
        const errors = await this.checkErrors(input.projectPath, checkTypes, checkLint);

        if (errors.length === 0) {
          this.log(`✅ No errors found!`);
          fixResults.push({
            attemptNumber: attempt,
            errorsFound: 0,
            errorsFixed: 0,
            filesModified: [],
            success: true,
            duration: Date.now() - startTime,
          });
          break;
        }

        this.log(`Found ${errors.length} errors across ${this.countUniqueFiles(errors)} files`);

        // 2. 에러를 파일별로 그룹화
        const errorGroups = this.groupErrorsByFile(errors);

        // 3. 각 파일의 에러 수정
        const filesModified: string[] = [];
        let errorsFixed = 0;

        for (const group of errorGroups) {
          try {
            const fixed = await this.fixFileErrors(input.projectPath, group);
            if (fixed) {
              filesModified.push(group.file);
              errorsFixed += group.errors.length;
              allFixedErrors.push(...group.errors);
              allModifiedFiles.add(group.file);
            }
          } catch (error) {
            this.log(`Failed to fix ${group.file}: ${error}`, true);
          }
        }

        const duration = Date.now() - startTime;
        const attemptSuccess = errorsFixed > 0;

        fixResults.push({
          attemptNumber: attempt,
          errorsFound: errors.length,
          errorsFixed,
          filesModified,
          success: attemptSuccess,
          duration,
        });

        this.log(`Attempt ${attempt} completed:`);
        this.log(`  - Errors found: ${errors.length}`);
        this.log(`  - Errors fixed: ${errorsFixed}`);
        this.log(`  - Files modified: ${filesModified.length}`);
        this.log(`  - Duration: ${(duration / 1000).toFixed(1)}s`);

        // 수정된 에러가 없으면 중단
        if (errorsFixed === 0) {
          this.log(`No errors fixed in this attempt, stopping...`);
          break;
        }
      }

      // 4. 최종 에러 체크
      const remainingErrors = await this.checkErrors(input.projectPath, checkTypes, checkLint);

      const output: FixOutput = {
        projectPath: input.projectPath,
        success: remainingErrors.length === 0,
        attempts: fixResults.length,
        fixedErrors: allFixedErrors,
        remainingErrors,
        filesModified: Array.from(allModifiedFiles),
        fixResults,
      };

      this.log(`\n=== Fix Agent Summary ===`);
      this.log(`Total attempts: ${output.attempts}`);
      this.log(`Errors fixed: ${output.fixedErrors.length}`);
      this.log(`Remaining errors: ${output.remainingErrors.length}`);
      this.log(`Files modified: ${output.filesModified.length}`);
      this.log(`Success: ${output.success ? '✅' : '❌'}`);

      return output;
    } catch (error) {
      this.log(`Fix Agent failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * 에러 검사 (TypeScript + ESLint)
   */
  private async checkErrors(
    projectPath: string,
    checkTypes: boolean,
    checkLint: boolean
  ): Promise<ErrorInfo[]> {
    const errors: ErrorInfo[] = [];

    // TypeScript 에러 체크
    if (checkTypes) {
      const tsErrors = await this.checkTypeScriptErrors(projectPath);
      errors.push(...tsErrors);
    }

    // ESLint 에러 체크
    if (checkLint) {
      const lintErrors = await this.checkESLintErrors(projectPath);
      errors.push(...lintErrors);
    }

    return errors;
  }

  /**
   * TypeScript 에러 체크
   */
  private async checkTypeScriptErrors(projectPath: string): Promise<ErrorInfo[]> {
    this.log('Checking TypeScript errors...');

    try {
      execSync('npx tsc --noEmit --pretty false', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      this.log('No TypeScript errors found');
      return [];
    } catch (error: any) {
      const output = error.stdout || error.stderr || '';
      return this.parseTypeScriptErrors(output);
    }
  }

  /**
   * TypeScript 에러 파싱
   */
  private parseTypeScriptErrors(output: string): ErrorInfo[] {
    const errors: ErrorInfo[] = [];
    const lines = output.split('\n');

    // TypeScript 에러 형식: file.ts(line,column): error TS2304: message
    const tsErrorRegex = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/;

    for (const line of lines) {
      const match = line.match(tsErrorRegex);
      if (match) {
        const [, file, lineStr, columnStr, severity, code, message] = match;
        errors.push({
          file: file.trim(),
          line: parseInt(lineStr, 10),
          column: parseInt(columnStr, 10),
          message: message.trim(),
          code: `TS${code}`,
          type: 'typescript',
          severity: severity as 'error' | 'warning',
        });
      }
    }

    this.log(`Found ${errors.length} TypeScript errors`);
    return errors;
  }

  /**
   * ESLint 에러 체크
   */
  private async checkESLintErrors(projectPath: string): Promise<ErrorInfo[]> {
    this.log('Checking ESLint errors...');

    try {
      execSync('npx eslint . --format json --ext .ts,.tsx,.js,.jsx', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      this.log('No ESLint errors found');
      return [];
    } catch (error: any) {
      const output = error.stdout || '';
      if (!output) {
        return [];
      }
      return this.parseESLintErrors(output);
    }
  }

  /**
   * ESLint 에러 파싱
   */
  private parseESLintErrors(output: string): ErrorInfo[] {
    const errors: ErrorInfo[] = [];

    try {
      const results = JSON.parse(output);

      for (const result of results) {
        if (!result.messages || result.messages.length === 0) {
          continue;
        }

        for (const msg of result.messages) {
          // severity 2 = error, 1 = warning
          if (msg.severity === 2) {
            errors.push({
              file: result.filePath,
              line: msg.line || 0,
              column: msg.column,
              message: msg.message,
              code: msg.ruleId || undefined,
              type: 'eslint',
              severity: 'error',
            });
          }
        }
      }
    } catch (parseError) {
      this.log(`Failed to parse ESLint output: ${parseError}`, true);
    }

    this.log(`Found ${errors.length} ESLint errors`);
    return errors;
  }

  /**
   * 에러를 파일별로 그룹화
   */
  private groupErrorsByFile(errors: ErrorInfo[]): ErrorGroup[] {
    const groups = new Map<string, ErrorInfo[]>();

    for (const error of errors) {
      if (!groups.has(error.file)) {
        groups.set(error.file, []);
      }
      groups.get(error.file)!.push(error);
    }

    return Array.from(groups.entries()).map(([file, errors]) => ({
      file,
      errors,
    }));
  }

  /**
   * 파일의 에러 수정
   */
  private async fixFileErrors(
    projectPath: string,
    group: ErrorGroup
  ): Promise<boolean> {
    this.log(`Fixing errors in ${group.file}...`);

    const filePath = path.isAbsolute(group.file)
      ? group.file
      : path.join(projectPath, group.file);

    // 파일 읽기
    let fileContent: string;
    try {
      fileContent = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      this.log(`Failed to read file ${filePath}: ${error}`, true);
      return false;
    }

    // Claude에게 수정 요청
    const fixedContent = await this.requestFix(group, fileContent);

    if (!fixedContent || fixedContent === fileContent) {
      this.log(`No changes made to ${group.file}`);
      return false;
    }

    // 파일 업데이트
    try {
      await fs.writeFile(filePath, fixedContent, 'utf-8');
      this.log(`✅ Fixed ${group.file} (${group.errors.length} errors)`);
      return true;
    } catch (error) {
      this.log(`Failed to write file ${filePath}: ${error}`, true);
      return false;
    }
  }

  /**
   * Claude에게 에러 수정 요청
   */
  private async requestFix(
    group: ErrorGroup,
    fileContent: string
  ): Promise<string | null> {
    const errorList = group.errors
      .map(
        (err, idx) =>
          `${idx + 1}. Line ${err.line}${err.column ? `:${err.column}` : ''} - ${err.type.toUpperCase()} ${err.code || ''}: ${err.message}`
      )
      .join('\n');

    const prompt = `You are a code fixing expert. Fix the following errors in this TypeScript/JavaScript file.

# File: ${group.file}

# Errors (${group.errors.length} total):
${errorList}

# Current Code:
\`\`\`typescript
${fileContent}
\`\`\`

# Instructions:
1. Fix ALL errors listed above
2. Preserve all existing functionality
3. Maintain code style and formatting
4. Do NOT add comments explaining the fixes
5. Do NOT add new features
6. Return ONLY the fixed code, no explanations

# Output Format:
Return the complete fixed code in a single code block:

\`\`\`typescript
// Fixed code here
\`\`\``;

    try {
      this.log(`Requesting fix from Claude for ${group.file}...`);

      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        temperature: 0,
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

      // Extract code from response
      const fixedCode = this.extractCodeBlock(content.text);

      if (!fixedCode) {
        this.log(`Failed to extract fixed code from Claude response`, true);
        return null;
      }

      return fixedCode;
    } catch (error) {
      this.log(`Claude API call failed: ${error}`, true);
      return null;
    }
  }

  /**
   * 코드 블록 추출
   */
  private extractCodeBlock(text: string): string | null {
    // Try to extract code from markdown code blocks
    const codeBlockRegex = /```(?:typescript|tsx|javascript|jsx|ts|js)?\n([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);

    if (match && match[1]) {
      return match[1].trim();
    }

    // If no code block found, return the whole text (fallback)
    return text.trim();
  }

  /**
   * 고유 파일 수 계산
   */
  private countUniqueFiles(errors: ErrorInfo[]): number {
    const files = new Set(errors.map(e => e.file));
    return files.size;
  }
}

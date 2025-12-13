import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Agent 실행 컨텍스트
 */
export interface AgentContext {
  verbose?: boolean;
  tempDir?: string;
  outputDir?: string;
}

/**
 * Base Agent 추상 클래스
 *
 * 모든 Agent의 부모 클래스로, 공통 기능을 제공합니다.
 * 각 Agent는 이 클래스를 상속받아 execute() 메서드를 구현해야 합니다.
 */
export abstract class BaseAgent<TInput, TOutput> {
  protected anthropic: Anthropic;
  protected context: AgentContext;

  public readonly name: string;
  public readonly version: string;

  constructor(name: string, version: string = '1.0.0', context: AgentContext = {}) {
    this.name = name;
    this.version = version;
    this.context = {
      verbose: context.verbose ?? false,
      tempDir: context.tempDir ?? '.temp',
      outputDir: context.outputDir ?? 'output',
    };

    // Anthropic API 클라이언트 초기화
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.anthropic = new Anthropic({
      apiKey,
    });
  }

  /**
   * Agent의 핵심 로직을 구현하는 메서드
   * 각 Agent는 반드시 이 메서드를 구현해야 합니다.
   */
  abstract execute(input: TInput): Promise<TOutput>;

  /**
   * Claude API 호출
   *
   * @param prompt - Claude에게 전달할 프롬프트
   * @param systemPrompt - 시스템 프롬프트 (선택)
   * @returns Claude의 응답 텍스트
   */
  protected async callClaude(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    this.log(`Calling Claude API...`);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        temperature: 0.7,
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

      this.log(`Claude API call successful`);
      return content.text;
    } catch (error) {
      this.log(`Claude API call failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * AGENT.md 파일 로드
   *
   * Agent 폴더 내의 AGENT.md 파일을 읽어서 Instructions를 반환합니다.
   *
   * @param agentDir - Agent 디렉토리 경로
   * @returns AGENT.md 파일 내용
   */
  protected async loadInstructions(agentDir: string): Promise<string> {
    const instructionsPath = path.join(agentDir, 'AGENT.md');

    try {
      const instructions = await fs.readFile(instructionsPath, 'utf-8');
      this.log(`Loaded instructions from ${instructionsPath}`);
      return instructions;
    } catch (error) {
      throw new Error(`Failed to load instructions from ${instructionsPath}: ${error}`);
    }
  }

  /**
   * Claude 응답에서 JSON 추출
   *
   * Claude의 응답에서 JSON 코드 블록을 찾아서 파싱합니다.
   *
   * @param response - Claude의 응답 텍스트
   * @returns 파싱된 JSON 객체
   */
  protected extractJSON<T>(response: string): T {
    // ```json ... ``` 형식의 코드 블록 찾기
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);

    if (!jsonMatch) {
      // 코드 블록이 없으면 전체 응답을 JSON으로 파싱 시도
      try {
        return JSON.parse(response) as T;
      } catch (error) {
        throw new Error('Failed to extract JSON from response: No JSON code block found and response is not valid JSON');
      }
    }

    try {
      return JSON.parse(jsonMatch[1]) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON from code block: ${error}`);
    }
  }

  /**
   * Claude 응답에서 코드 블록 추출
   *
   * Claude의 응답에서 모든 코드 블록을 추출하여 Map으로 반환합니다.
   *
   * @param response - Claude의 응답 텍스트
   * @returns 파일명 → 코드 내용 매핑
   */
  protected extractCodeBlocks(response: string): Map<string, string> {
    const codeBlocks = new Map<string, string>();

    // ```언어:파일명 ... ``` 형식의 코드 블록 찾기
    const blockRegex = /```(\w+):([^\n]+)\n([\s\S]*?)```/g;
    let match;

    while ((match = blockRegex.exec(response)) !== null) {
      const language = match[1];
      const filename = match[2].trim();
      const code = match[3];

      codeBlocks.set(filename, code);
      this.log(`Extracted code block: ${filename} (${language})`);
    }

    // ```언어 ... ``` 형식도 지원 (파일명 없음)
    const simpleBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
    let blockIndex = 0;

    while ((match = simpleBlockRegex.exec(response)) !== null) {
      const language = match[1];
      const code = match[2];

      // 이미 추출된 블록은 스킵
      if (!Array.from(codeBlocks.values()).includes(code)) {
        const filename = `code-block-${blockIndex}.${language}`;
        codeBlocks.set(filename, code);
        this.log(`Extracted anonymous code block: ${filename}`);
        blockIndex++;
      }
    }

    return codeBlocks;
  }

  /**
   * 로깅
   *
   * @param message - 로그 메시지
   * @param isError - 에러 로그 여부
   */
  protected log(message: string, isError: boolean = false): void {
    if (this.context.verbose || isError) {
      const prefix = `[${this.name}]`;
      const timestamp = new Date().toISOString();

      if (isError) {
        console.error(`${timestamp} ${prefix} ❌ ${message}`);
      } else {
        console.log(`${timestamp} ${prefix} ℹ️  ${message}`);
      }
    }
  }

  /**
   * 파일 저장 헬퍼
   *
   * @param filePath - 파일 경로
   * @param content - 파일 내용
   */
  protected async saveFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);

    // 디렉토리 생성 (존재하지 않으면)
    await fs.mkdir(dir, { recursive: true });

    // 파일 저장
    await fs.writeFile(filePath, content, 'utf-8');
    this.log(`Saved file: ${filePath}`);
  }

  /**
   * 파일 읽기 헬퍼
   *
   * @param filePath - 파일 경로
   * @returns 파일 내용
   */
  protected async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      this.log(`Read file: ${filePath}`);
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * JSON 파일 저장 헬퍼
   *
   * @param filePath - 파일 경로
   * @param data - JSON 데이터
   */
  protected async saveJSON(filePath: string, data: any): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await this.saveFile(filePath, content);
  }

  /**
   * JSON 파일 읽기 헬퍼
   *
   * @param filePath - 파일 경로
   * @returns 파싱된 JSON 데이터
   */
  protected async readJSON<T>(filePath: string): Promise<T> {
    const content = await this.readFile(filePath);
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON from ${filePath}: ${error}`);
    }
  }
}

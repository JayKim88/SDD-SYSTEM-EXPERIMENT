import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { BaseAgent } from '../base-agent';
import { SpecParserInput, SpecParserOutput } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Spec Parser Agent
 *
 * Markdown 형식의 Spec 파일을 읽어서 구조화된 JSON으로 변환합니다.
 */
export class SpecParserAgent extends BaseAgent<SpecParserInput, SpecParserOutput> {
  constructor(context = {}) {
    super('SpecParser', '1.0.0', context);
  }

  async execute(input: SpecParserInput): Promise<SpecParserOutput> {
    this.log(`Starting Spec Parser Agent`);
    this.log(`Reading spec file: ${input.specPath}`);

    try {
      // 1. Spec 파일 읽기
      const specContent = await this.readFile(input.specPath);
      this.log(`Spec file loaded (${specContent.length} characters)`);

      // 2. AGENT.md Instructions 로드
      const agentDir = __dirname; // 현재 디렉토리 (spec-parser)
      const instructions = await this.loadInstructions(agentDir);

      // 3. Claude에게 전달할 프롬프트 구성
      const prompt = this.buildPrompt(specContent);

      // 4. Claude API 호출
      const response = await this.callClaude(prompt, instructions);

      // 5. 응답에서 JSON 추출
      const parsedSpec = this.extractJSON<SpecParserOutput>(response);

      // 6. 결과 저장 (.temp/parsed-spec.json)
      const outputPath = path.join(this.context.tempDir!, 'parsed-spec.json');
      await this.saveJSON(outputPath, parsedSpec);

      this.log(`Spec parsing completed successfully`);
      this.log(`Output saved to: ${outputPath}`);

      return parsedSpec;
    } catch (error) {
      this.log(`Spec parsing failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * Claude에게 전달할 프롬프트 구성
   */
  private buildPrompt(specContent: string): string {
    return `
Please parse the following application specification and extract all relevant information.

# Specification Document

${specContent}

---

Please analyze the specification above and return a structured JSON object following the schema defined in your instructions.
`.trim();
  }
}

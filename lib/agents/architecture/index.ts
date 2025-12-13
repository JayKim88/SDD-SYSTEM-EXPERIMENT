import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { BaseAgent } from '../base-agent';
import { ArchitectureInput, ArchitectureOutput } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Architecture Agent
 *
 * 파싱된 Spec을 바탕으로 프로젝트 아키텍처를 설계합니다.
 */
export class ArchitectureAgent extends BaseAgent<ArchitectureInput, ArchitectureOutput> {
  constructor(context = {}) {
    super('Architecture', '1.0.0', context);
  }

  async execute(input: ArchitectureInput): Promise<ArchitectureOutput> {
    this.log(`Starting Architecture Agent`);
    this.log(`Designing architecture for: ${input.parsedSpec.projectName}`);

    try {
      // 1. AGENT.md Instructions 로드
      const agentDir = __dirname; // 현재 디렉토리 (architecture)
      const instructions = await this.loadInstructions(agentDir);

      // 2. Claude에게 전달할 프롬프트 구성
      const prompt = this.buildPrompt(input.parsedSpec);

      // 3. Claude API 호출
      const response = await this.callClaude(prompt, instructions);

      // 4. 응답에서 JSON 추출
      const architecture = this.extractJSON<ArchitectureOutput>(response);

      // 5. 결과 저장 (.temp/architecture.json)
      const outputPath = path.join(this.context.tempDir!, 'architecture.json');
      await this.saveJSON(outputPath, architecture);

      this.log(`Architecture design completed successfully`);
      this.log(`Output saved to: ${outputPath}`);
      this.log(`Total files planned: ${architecture.fileList.length}`);

      return architecture;
    } catch (error) {
      this.log(`Architecture design failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * Claude에게 전달할 프롬프트 구성
   */
  private buildPrompt(parsedSpec: any): string {
    return `
Please design a complete Next.js 14 project architecture for the following application.

# Parsed Specification

${JSON.stringify(parsedSpec, null, 2)}

---

Based on the specification above, design a comprehensive project architecture including:
1. Complete folder structure
2. All necessary files with their purposes
3. Dependencies and devDependencies
4. Configuration files
5. File-level specifications

Please return the architecture as a JSON object following the schema in your instructions.
`.trim();
  }
}

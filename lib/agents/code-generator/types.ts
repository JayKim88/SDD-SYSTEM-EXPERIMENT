import { ArchitectureOutput } from '../architecture/types';
import { SpecParserOutput } from '../spec-parser/types';

/**
 * Code Generator Agent Input
 */
export interface CodeGeneratorInput {
  parsedSpec: SpecParserOutput;
  architecture: ArchitectureOutput;
}

/**
 * Code Generator Agent Output
 */
export interface CodeGeneratorOutput {
  projectPath: string;
  filesGenerated: number;
  files: GeneratedFile[];
}

/**
 * 생성된 파일 정보
 */
export interface GeneratedFile {
  path: string;
  size: number;
  type: string;
}

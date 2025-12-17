import { SpecParserOutput } from '../spec-parser/types';
import { ArchitectureOutput } from '../architecture/types';
import { DatabaseOutput } from '../database/types';

/**
 * Config Agent Input
 */
export interface ConfigInput {
  parsedSpec: SpecParserOutput;      // Spec Parser 결과
  architecture: ArchitectureOutput;  // Architecture 결과
  database?: DatabaseOutput;         // Database 결과 (optional)
}

/**
 * Config Agent Output
 */
export interface ConfigOutput {
  projectPath: string;                // 프로젝트 경로
  configFiles: GeneratedConfigFile[]; // 생성된 Config 파일들
  filesGenerated: number;             // 생성된 파일 수
}

/**
 * 생성된 Config 파일
 */
export interface GeneratedConfigFile {
  path: string;                       // 파일 경로 (package.json, tsconfig.json 등)
  type: ConfigFileType;               // 파일 타입
  size: number;                       // 파일 크기 (bytes)
}

/**
 * Config 파일 타입
 */
export type ConfigFileType =
  | 'package.json'
  | 'tsconfig.json'
  | 'tailwind.config.ts'
  | 'next.config.js'
  | 'postcss.config.js'
  | '.gitignore'
  | '.env.example'
  | 'README.md'
  | '.eslintrc.json'
  | 'other';

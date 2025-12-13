import { SpecParserOutput } from '../spec-parser/types';

/**
 * Architecture Agent Input
 */
export interface ArchitectureInput {
  parsedSpec: SpecParserOutput;
}

/**
 * Architecture Agent Output
 */
export interface ArchitectureOutput {
  projectName: string;
  projectStructure: ProjectStructure;
  dependencies: Dependencies;
  configFiles: ConfigFile[];
  fileList: FileSpec[];
}

/**
 * 프로젝트 구조 정의
 */
export interface ProjectStructure {
  rootDir: string;
  directories: DirectorySpec[];
}

/**
 * 디렉토리 명세
 */
export interface DirectorySpec {
  path: string;
  purpose: string;
  files?: string[]; // 포함될 파일 목록
}

/**
 * 의존성 정의
 */
export interface Dependencies {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

/**
 * 설정 파일 정의
 */
export interface ConfigFile {
  filename: string;
  purpose: string;
  content?: string; // 파일 내용 템플릿
}

/**
 * 파일 명세
 */
export interface FileSpec {
  path: string;
  type: 'page' | 'component' | 'api' | 'lib' | 'config' | 'style' | 'type' | 'test';
  purpose: string;
  dependencies?: string[]; // 이 파일이 의존하는 다른 파일들
  exports?: string[]; // 이 파일에서 export하는 것들
}

import { SpecParserOutput } from '../spec-parser/types';
import { ArchitectureOutput } from '../architecture/types';
import { FrontendOutput } from '../frontend/types';
import { BackendOutput } from '../backend/types';

/**
 * Testing Agent Input
 */
export interface TestingInput {
  parsedSpec: SpecParserOutput;
  architecture: ArchitectureOutput;
  frontend: FrontendOutput;
  backend: BackendOutput;
}

/**
 * Testing Agent Output
 */
export interface TestingOutput {
  projectPath: string;
  componentTests: GeneratedTest[];
  apiTests: GeneratedTest[];
  e2eTests: GeneratedTest[];
  configFiles: GeneratedTestConfig[];
  filesGenerated: number;
}

/**
 * Generated Test File
 */
export interface GeneratedTest {
  path: string;              // e.g., "components/ui/Button.test.tsx"
  testType: TestType;        // component, api, e2e
  targetFile: string;        // 테스트 대상 파일
  testCount: number;         // 테스트 케이스 수
  coverage: string[];        // 커버하는 기능들
  size: number;
}

/**
 * Test Type
 */
export type TestType = 'component' | 'api' | 'e2e' | 'integration';

/**
 * Generated Test Config
 */
export interface GeneratedTestConfig {
  path: string;              // e.g., "vitest.config.ts"
  configType: TestConfigType;
  size: number;
}

/**
 * Test Config Type
 */
export type TestConfigType =
  | 'vitest.config'
  | 'playwright.config'
  | 'test-setup'
  | 'test-utils';

/**
 * Test Plan
 */
export interface TestPlan {
  framework: 'vitest';
  e2eFramework: 'playwright';
  componentTests: string[];   // 컴포넌트 파일 목록
  apiTests: string[];         // API route 파일 목록
  e2eScenarios: string[];     // E2E 시나리오 목록
  needsSetup: boolean;
}

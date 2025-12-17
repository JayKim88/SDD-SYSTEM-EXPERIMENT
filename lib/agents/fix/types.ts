import { SpecParserOutput } from '../spec-parser/types';

/**
 * Fix Agent Input
 */
export interface FixInput {
  projectPath: string;           // 생성된 프로젝트 경로
  parsedSpec?: SpecParserOutput; // 선택적: 컨텍스트용
  maxAttempts?: number;          // 최대 수정 시도 횟수 (기본: 3)
  checkTypes?: boolean;          // TypeScript 체크 (기본: true)
  checkLint?: boolean;           // ESLint 체크 (기본: true)
}

/**
 * Fix Agent Output
 */
export interface FixOutput {
  projectPath: string;
  success: boolean;              // 모든 에러 수정 성공 여부
  attempts: number;              // 실제 시도 횟수
  fixedErrors: ErrorInfo[];      // 수정된 에러 목록
  remainingErrors: ErrorInfo[];  // 남은 에러 목록
  filesModified: string[];       // 수정된 파일 목록
  fixResults: FixAttempt[];      // 각 시도별 결과
}

/**
 * Error Information
 */
export interface ErrorInfo {
  file: string;                  // 파일 경로
  line: number;                  // 라인 번호
  column?: number;               // 컬럼 번호
  message: string;               // 에러 메시지
  code?: string;                 // 에러 코드 (예: TS2304)
  type: ErrorType;               // 에러 타입
  severity: 'error' | 'warning'; // 심각도
}

/**
 * Error Type
 */
export type ErrorType = 'typescript' | 'eslint' | 'build' | 'unknown';

/**
 * Fix Attempt
 */
export interface FixAttempt {
  attemptNumber: number;
  errorsFound: number;
  errorsFixed: number;
  filesModified: string[];
  success: boolean;
  duration: number;              // 소요 시간 (ms)
}

/**
 * Parsed Error Group
 */
export interface ErrorGroup {
  file: string;
  errors: ErrorInfo[];
}

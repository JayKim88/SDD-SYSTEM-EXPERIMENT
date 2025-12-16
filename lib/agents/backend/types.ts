import { SpecParserOutput } from '../spec-parser/types';
import { ArchitectureOutput, FileSpec } from '../architecture/types';

/**
 * Backend Agent Input
 */
export interface BackendInput {
  parsedSpec: SpecParserOutput;      // Spec Parser 결과
  architecture: ArchitectureOutput;  // Architecture 결과
}

// Re-export FileSpec from Architecture
export type { FileSpec } from '../architecture/types';

/**
 * Backend Agent Output
 */
export interface BackendOutput {
  projectPath: string;                // 프로젝트 경로
  apiRoutes: GeneratedAPIRoute[];     // 생성된 API Routes
  serverActions: GeneratedServerAction[]; // 생성된 Server Actions
  middleware: GeneratedMiddleware[];  // 생성된 Middleware
  utilities: GeneratedUtility[];      // 생성된 Utility 함수
  filesGenerated: number;             // 생성된 파일 수
}

/**
 * 생성된 API Route
 */
export interface GeneratedAPIRoute {
  path: string;                       // 파일 경로 (app/api/todos/route.ts)
  endpoint: string;                   // API 엔드포인트 (/api/todos)
  methods: string[];                  // HTTP 메서드 (GET, POST, PUT, DELETE)
  hasValidation: boolean;             // Validation 포함 여부
  hasAuth: boolean;                   // 인증 체크 포함 여부
  size: number;                       // 파일 크기 (bytes)
}

/**
 * 생성된 Server Action
 */
export interface GeneratedServerAction {
  path: string;                       // 파일 경로 (lib/actions/todo-actions.ts)
  name: string;                       // Action 이름 (createTodo)
  hasValidation: boolean;             // Validation 포함 여부
  size: number;                       // 파일 크기 (bytes)
}

/**
 * 생성된 Middleware
 */
export interface GeneratedMiddleware {
  path: string;                       // 파일 경로 (middleware.ts, lib/auth/middleware.ts)
  name: string;                       // Middleware 이름
  purpose: string;                    // 목적 (Authentication, CORS, etc.)
  size: number;                       // 파일 크기 (bytes)
}

/**
 * 생성된 Utility
 */
export interface GeneratedUtility {
  path: string;                       // 파일 경로 (lib/utils.ts)
  name: string;                       // Utility 이름
  functions: string[];                // 포함된 함수들
  size: number;                       // 파일 크기 (bytes)
}

/**
 * Backend 파일 계획
 */
export interface BackendPlan {
  apiRoutes: string[];                // API Route 파일들
  serverActions: string[];            // Server Action 파일들
  middleware: string[];               // Middleware 파일들
  utilities: string[];                // Utility 파일들
  database: string[];                 // Database 관련 파일들
}

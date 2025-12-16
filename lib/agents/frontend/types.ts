import { SpecParserOutput } from '../spec-parser/types';
import { ArchitectureOutput, FileSpec } from '../architecture/types';

/**
 * Frontend Agent Input
 */
export interface FrontendInput {
  parsedSpec: SpecParserOutput;      // Spec Parser 결과
  architecture: ArchitectureOutput;  // Architecture 결과
}

// Re-export FileSpec from Architecture
export type { FileSpec } from '../architecture/types';

/**
 * Frontend Agent Output
 */
export interface FrontendOutput {
  projectPath: string;              // 프로젝트 경로
  components: GeneratedComponent[]; // 생성된 컴포넌트
  pages: GeneratedPage[];           // 생성된 페이지
  providers: GeneratedProvider[];   // 생성된 Providers
  filesGenerated: number;           // 생성된 파일 수
}

/**
 * 생성된 컴포넌트
 */
export interface GeneratedComponent {
  path: string;                     // 파일 경로 (components/ui/Button.tsx)
  name: string;                     // 컴포넌트 이름 (Button)
  type: 'atom' | 'molecule' | 'organism'; // Atomic Design 분류
  isClient: boolean;                // 'use client' 필요 여부
  hasAccessibility: boolean;        // 접근성 속성 포함 여부
  size: number;                     // 파일 크기 (bytes)
}

/**
 * 생성된 페이지
 */
export interface GeneratedPage {
  path: string;                     // 파일 경로 (app/dashboard/page.tsx)
  route: string;                    // 라우트 (/dashboard)
  isClient: boolean;                // 'use client' 필요 여부
  layout?: string;                  // 레이아웃 경로
  size: number;                     // 파일 크기 (bytes)
}

/**
 * 생성된 Provider
 */
export interface GeneratedProvider {
  path: string;                     // 파일 경로 (contexts/QueryProvider.tsx)
  name: string;                     // Provider 이름 (QueryProvider)
  provides: string[];               // 제공하는 기능 (QueryClient, AuthContext 등)
  size: number;                     // 파일 크기 (bytes)
}

/**
 * 컴포넌트 계획
 */
export interface ComponentPlan {
  atoms: string[];                  // 기본 UI 컴포넌트 (Button, Input 등)
  molecules: string[];              // 조합 컴포넌트 (SearchBar, LoginForm 등)
  organisms: string[];              // 복합 컴포넌트 (Header, Sidebar 등)
  pages: string[];                  // 페이지 컴포넌트
  providers: string[];              // Context Providers
}

// FileSpec is re-exported from Architecture types above

import { SpecParserOutput } from '../spec-parser/types';

/**
 * Spec Writer Agent Mode
 */
export type SpecWriterMode = 'new' | 'refine' | 'review';

/**
 * Template Type
 */
export type TemplateType = 'basic' | 'dashboard' | 'ecommerce' | 'financial' | 'social';

/**
 * Spec Writer Agent Input
 */
export interface SpecWriterInput {
  mode: SpecWriterMode;

  // 새 spec 작성 시
  idea?: string; // 사용자 아이디어 (예: "자산 관리 앱을 만들고 싶어요")
  initialPrompt?: string; // 초기 프롬프트
  templateType?: TemplateType; // 템플릿 타입

  // 기존 spec 개선/검토 시
  existingSpecPath?: string; // 기존 spec 파일 경로

  // 옵션
  interactive?: boolean; // 대화형 모드 (기본: true)
  outputPath?: string; // 출력 파일 경로 (기본: specs/{projectName}.md)
  autoFix?: boolean; // 자동 수정 (검토 모드에서, 기본: false)
}

/**
 * Spec Writer Agent Output
 */
export interface SpecWriterOutput {
  specPath: string; // 생성된 spec 파일 경로
  mode: SpecWriterMode; // 실행된 모드
  parsedSpec?: SpecParserOutput; // 파싱된 spec (검증용)

  // 생성된 섹션들
  sections: {
    projectInfo: boolean;
    features: boolean;
    dataModels: boolean;
    apiEndpoints: boolean;
    pages: boolean;
    techStack: boolean;
    seedData: boolean;
  };

  // 검토 결과
  reviewResults: ReviewResults;

  // 통계
  stats: {
    totalLines: number;
    dataModelsCount: number;
    apiEndpointsCount: number;
    pagesCount: number;
  };
}

/**
 * 검토 결과
 */
export interface ReviewResults {
  consistency: number; // 일관성 점수 (0-100)
  completeness: number; // 완전성 점수 (0-100)
  feasibility: number; // 실현 가능성 점수 (0-100)
  overall: number; // 종합 점수 (0-100)

  issues: Issue[]; // 발견된 이슈들
  suggestions: Suggestion[]; // 개선 제안
}

/**
 * 이슈
 */
export interface Issue {
  type: IssueType;
  severity: 'critical' | 'warning' | 'info';
  section: string; // 섹션 이름 (예: "데이터 모델", "API 엔드포인트")
  message: string; // 이슈 설명
  line?: number; // 라인 번호 (선택)
  suggestion?: string; // 수정 제안
}

/**
 * 이슈 타입
 */
export type IssueType =
  | 'missing_field' // 필수 필드 누락
  | 'inconsistency' // 불일치
  | 'duplicate' // 중복
  | 'invalid_format' // 잘못된 형식
  | 'missing_api' // API 누락
  | 'missing_page' // 페이지 누락
  | 'security' // 보안 이슈
  | 'performance' // 성능 이슈
  | 'best_practice'; // 모범 사례 위반

/**
 * 개선 제안
 */
export interface Suggestion {
  category: SuggestionCategory;
  title: string; // 제목
  description: string; // 설명
  priority: 'high' | 'medium' | 'low'; // 우선순위
  implementation?: string; // 구현 방법 (선택)
}

/**
 * 제안 카테고리
 */
export type SuggestionCategory =
  | 'feature' // 기능 추가
  | 'optimization' // 최적화
  | 'security' // 보안 강화
  | 'ux' // UX 개선
  | 'techstack'; // 기술 스택 변경

/**
 * Spec 섹션
 */
export interface SpecSection {
  title: string;
  content: string;
  order: number; // 섹션 순서
}

/**
 * 대화형 질문
 */
export interface ConversationStep {
  question: string;
  options?: string[]; // 선택지 (없으면 자유 입력)
  multiSelect?: boolean; // 다중 선택 가능 여부
  validation?: (answer: string | string[]) => boolean; // 검증 함수
}

/**
 * 사용자 응답
 */
export interface UserResponse {
  step: number; // 몇 번째 질문인지
  question: string;
  answer: string | string[]; // 응답
}

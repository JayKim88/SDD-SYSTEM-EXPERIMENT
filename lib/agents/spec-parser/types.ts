/**
 * Spec Parser Agent Input
 */
export interface SpecParserInput {
  specPath: string; // Spec 파일 경로
}

/**
 * Spec Parser Agent Output
 */
export interface SpecParserOutput {
  projectName: string;
  description: string;
  features: string[];
  techStack: TechStack;
  dataModels: DataModel[];
  apiEndpoints?: ApiEndpoint[];
  uiComponents?: UIComponent[];
  requirements?: Requirements;
}

/**
 * 기술 스택 정의
 */
export interface TechStack {
  frontend: string;
  backend?: string;
  database?: string;
  styling: string;
  authentication?: string;
  deployment?: string;
  other?: Record<string, string>;
}

/**
 * 데이터 모델 정의
 */
export interface DataModel {
  name: string;
  description?: string;
  fields: Field[];
  relations?: Relation[];
}

/**
 * 필드 정의
 */
export interface Field {
  name: string;
  type: string;
  required?: boolean;
  default?: any;
  description?: string;
}

/**
 * 관계 정의
 */
export interface Relation {
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  model: string;
  field?: string;
}

/**
 * API 엔드포인트 정의
 */
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description?: string;
  request?: any;
  response?: any;
}

/**
 * UI 컴포넌트 정의
 */
export interface UIComponent {
  name: string;
  type: 'page' | 'component' | 'layout';
  description?: string;
  props?: Record<string, string>;
}

/**
 * 요구사항 정의
 */
export interface Requirements {
  functional?: string[];
  nonFunctional?: string[];
  constraints?: string[];
}

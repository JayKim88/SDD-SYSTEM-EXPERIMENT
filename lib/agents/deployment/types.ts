import { SpecParserOutput } from '../spec-parser/types';
import { ArchitectureOutput } from '../architecture/types';
import { DatabaseOutput } from '../database/types';

/**
 * Deployment Agent Input
 */
export interface DeploymentInput {
  parsedSpec: SpecParserOutput;
  architecture: ArchitectureOutput;
  database?: DatabaseOutput;
}

/**
 * Deployment Agent Output
 */
export interface DeploymentOutput {
  projectPath: string;
  deploymentFiles: GeneratedDeploymentFile[];
  filesGenerated: number;
}

/**
 * Generated Deployment File
 */
export interface GeneratedDeploymentFile {
  path: string;                    // e.g., "Dockerfile"
  type: DeploymentFileType;
  size: number;
}

/**
 * Deployment File Type
 */
export type DeploymentFileType =
  | 'Dockerfile'
  | 'docker-compose.yml'
  | '.dockerignore'
  | 'ci-cd'
  | 'deployment-guide';

import { SpecParserOutput } from '../spec-parser/types';
import { ArchitectureOutput } from '../architecture/types';

/**
 * Database Agent Input
 */
export interface DatabaseInput {
  parsedSpec: SpecParserOutput;
  architecture: ArchitectureOutput;
}

/**
 * Database Agent Output
 */
export interface DatabaseOutput {
  projectPath: string;
  schemaFiles: GeneratedSchemaFile[];
  migrationFiles: GeneratedMigrationFile[];
  seedFiles: GeneratedSeedFile[];
  clientFiles: GeneratedClientFile[];
  filesGenerated: number;
}

/**
 * Generated Schema File
 */
export interface GeneratedSchemaFile {
  path: string; // e.g., "prisma/schema.prisma" or "lib/database/schema.ts"
  orm: 'prisma' | 'drizzle';
  models: string[]; // List of model names
  size: number;
}

/**
 * Generated Migration File
 */
export interface GeneratedMigrationFile {
  path: string;
  name: string;
  timestamp: string;
  size: number;
}

/**
 * Generated Seed File
 */
export interface GeneratedSeedFile {
  path: string; // e.g., "prisma/seed.ts"
  models: string[]; // Models being seeded
  size: number;
}

/**
 * Generated Client File
 */
export interface GeneratedClientFile {
  path: string; // e.g., "lib/database/client.ts" or "lib/database/index.ts"
  type: 'client' | 'helper' | 'types';
  size: number;
}

/**
 * Database Plan
 */
export interface DatabasePlan {
  orm: 'prisma' | 'drizzle';
  database: string; // postgres, mysql, sqlite, etc.
  models: string[];
  needsMigrations: boolean;
  needsSeed: boolean;
}

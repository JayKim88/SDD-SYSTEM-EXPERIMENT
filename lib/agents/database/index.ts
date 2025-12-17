import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { BaseAgent } from '../base-agent';
import {
  DatabaseInput,
  DatabaseOutput,
  GeneratedSchemaFile,
  GeneratedMigrationFile,
  GeneratedSeedFile,
  GeneratedClientFile,
  DatabasePlan,
} from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Database Agent
 *
 * 데이터베이스 스키마 및 ORM 설정 전문 Agent
 */
export class DatabaseAgent extends BaseAgent<DatabaseInput, DatabaseOutput> {
  constructor(context = {}) {
    super('Database', '1.0.0', context);
  }

  async execute(input: DatabaseInput): Promise<DatabaseOutput> {
    this.log(`Starting Database Agent`);
    this.log(`Project: ${input.architecture.projectName}`);

    try {
      // 1. 프로젝트 경로 설정
      const projectPath = path.join(
        this.context.outputDir!,
        input.architecture.projectName
      );

      // 2. Database 설정 확인
      if (!input.parsedSpec.dataModels || input.parsedSpec.dataModels.length === 0) {
        this.log(`No data models found. Skipping database generation.`);
        return {
          projectPath,
          schemaFiles: [],
          migrationFiles: [],
          seedFiles: [],
          clientFiles: [],
          filesGenerated: 0,
        };
      }

      // 3. Database 계획 수립
      const dbPlan = this.planDatabase(input);
      this.log(`Database plan:`);
      this.log(`  - ORM: ${dbPlan.orm}`);
      this.log(`  - Database: ${dbPlan.database}`);
      this.log(`  - Models: ${dbPlan.models.length}`);

      // 4. AGENT.md Instructions 로드
      const agentDir = __dirname;
      const instructions = await this.loadInstructions(agentDir);

      // 5. Claude에게 전달할 프롬프트 구성
      const prompt = this.buildPrompt(input, dbPlan);

      this.log(`Requesting database code generation from Claude...`);

      // 6. Claude API 호출
      const response = await this.callClaudeForDatabase(prompt, instructions);

      // 7. 응답에서 코드 블록 추출
      const codeBlocks = this.extractCodeBlocks(response);
      this.log(`Extracted ${codeBlocks.size} code blocks from response`);

      // 8. 파일 생성
      const generatedFiles = await this.writeFiles(projectPath, codeBlocks);

      // 9. 결과 분류
      const schemaFiles = this.classifySchemaFiles(generatedFiles, dbPlan.orm);
      const migrationFiles = this.classifyMigrationFiles(generatedFiles);
      const seedFiles = this.classifySeedFiles(generatedFiles);
      const clientFiles = this.classifyClientFiles(generatedFiles);

      const output: DatabaseOutput = {
        projectPath,
        schemaFiles,
        migrationFiles,
        seedFiles,
        clientFiles,
        filesGenerated: generatedFiles.length,
      };

      this.log(`Database generation completed successfully`);
      this.log(`Generated ${output.filesGenerated} files`);
      this.log(`  - Schema: ${schemaFiles.length}`);
      this.log(`  - Migrations: ${migrationFiles.length}`);
      this.log(`  - Seeds: ${seedFiles.length}`);
      this.log(`  - Clients: ${clientFiles.length}`);

      return output;
    } catch (error) {
      this.log(`Database generation failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * Database 계획 수립
   */
  private planDatabase(input: DatabaseInput): DatabasePlan {
    const techStack = input.parsedSpec.techStack;
    const database = techStack.database?.toLowerCase() || 'postgresql';

    // ORM 결정 (기본값: Prisma)
    let orm: 'prisma' | 'drizzle' = 'prisma';

    // techStack.other.orm이 있으면 사용
    const ormPreference = techStack.other?.orm?.toLowerCase();
    if (ormPreference === 'drizzle') {
      orm = 'drizzle';
    }

    const models = input.parsedSpec.dataModels.map(m => m.name);

    return {
      orm,
      database,
      models,
      needsMigrations: true,
      needsSeed: true,
    };
  }

  /**
   * Claude에게 전달할 프롬프트 구성
   */
  private buildPrompt(
    input: DatabaseInput,
    dbPlan: DatabasePlan
  ): string {
    const dataModelsJson = JSON.stringify(input.parsedSpec.dataModels, null, 2);

    return `
You are a Database Agent specialized in generating database schemas and ORM code.

# Project Information

**Project Name**: ${input.parsedSpec.projectName}
**Description**: ${input.parsedSpec.description}

# Database Configuration

**ORM**: ${dbPlan.orm === 'prisma' ? 'Prisma' : 'Drizzle ORM'}
**Database**: ${dbPlan.database}
**Models**: ${dbPlan.models.join(', ')}

# Data Models

${dataModelsJson}

---

# CRITICAL REQUIREMENTS

1. **ORM**: Use ${dbPlan.orm === 'prisma' ? 'Prisma' : 'Drizzle ORM'} (NOT the other one)

2. **File Count**: Generate ALL necessary files:
   ${dbPlan.orm === 'prisma' ? `
   - prisma/schema.prisma (Schema definition)
   - lib/database/client.ts (Prisma client singleton)
   - lib/database/index.ts (Re-exports)
   - prisma/seed.ts (Seed data)
   ` : `
   - lib/database/schema.ts (Schema definition)
   - lib/database/client.ts (Drizzle client)
   - lib/database/index.ts (Re-exports)
   - lib/database/seed.ts (Seed data)
   `}

3. **ID Generation**: Use cuid() or uuid() (NOT autoincrement)
   ${dbPlan.orm === 'prisma' ? `
   \`\`\`prisma
   id String @id @default(cuid())
   \`\`\`
   ` : `
   \`\`\`typescript
   id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID())
   \`\`\`
   `}

4. **Timestamps**: Include createdAt and updatedAt on ALL models

5. **Relations**: Map ALL relations from the data models with proper cascading deletes

6. **Indexes**: Add indexes on:
   - All foreign keys
   - Unique fields (email, username, etc.)

7. **Client Pattern**: Use singleton pattern to prevent connection leaks
   ${dbPlan.orm === 'prisma' ? `
   \`\`\`typescript
   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
   export const prisma = globalForPrisma.prisma ?? new PrismaClient()
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
   \`\`\`
   ` : `
   \`\`\`typescript
   const client = postgres(process.env.DATABASE_URL!, { prepare: false })
   export const db = drizzle(client, { schema })
   \`\`\`
   `}

8. **Seed Data**: Include realistic seed data for ALL models

9. **Type Safety**: Export TypeScript types from schema/client

10. **Table Naming**: Use snake_case for table names (@@map("users"))

---

# Output Format

Generate ALL database files as code blocks with exact file paths.

${dbPlan.orm === 'prisma' ? `
Example for Prisma:

\`\`\`prisma:prisma/schema.prisma
datasource db {
  provider = "${dbPlan.database === 'postgresql' ? 'postgresql' : dbPlan.database === 'mysql' ? 'mysql' : 'sqlite'}"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
\`\`\`

\`\`\`typescript:lib/database/client.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
\`\`\`

\`\`\`typescript:lib/database/index.ts
export { prisma } from './client'
export * from '@prisma/client'
\`\`\`

\`\`\`typescript:prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Add seed logic here

  console.log('✅ Seed completed')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
\`\`\`
` : `
Example for Drizzle:

\`\`\`typescript:lib/database/schema.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
\`\`\`

\`\`\`typescript:lib/database/client.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!, { prepare: false })
export const db = drizzle(client, { schema })
\`\`\`

\`\`\`typescript:lib/database/index.ts
export { db } from './client'
export * from './schema'
\`\`\`

\`\`\`typescript:lib/database/seed.ts
import { db } from './client'
import { users } from './schema'

async function main() {
  console.log('🌱 Seeding database...')

  // Add seed logic here

  console.log('✅ Seed completed')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
\`\`\`
`}

**Generate ALL database files now. Do not skip any files.**
`.trim();
  }

  /**
   * Database 전용 Claude API 호출
   */
  private async callClaudeForDatabase(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    this.log(`Calling Claude API for database generation...`);
    this.log(`Using max_tokens: 32000`);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 32000,
        temperature: 0.2,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      this.log(`Tokens used: ${message.usage.input_tokens} input, ${message.usage.output_tokens} output`);
      this.log(`Response length: ${content.text.length} characters`);
      this.log(`Claude API call successful`);

      return content.text;
    } catch (error) {
      this.log(`Claude API call failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * 파일 생성
   */
  private async writeFiles(
    projectPath: string,
    codeBlocks: Map<string, string>
  ): Promise<Array<{ path: string; size: number; content: string }>> {
    const generatedFiles: Array<{ path: string; size: number; content: string }> = [];

    for (const [filename, code] of codeBlocks.entries()) {
      const filePath = path.join(projectPath, filename);
      const fileDir = path.dirname(filePath);

      // 디렉토리 생성
      await fs.mkdir(fileDir, { recursive: true });

      // 파일 쓰기
      await fs.writeFile(filePath, code, 'utf-8');

      const stats = await fs.stat(filePath);
      generatedFiles.push({
        path: filename,
        size: stats.size,
        content: code,
      });

      this.log(`Generated: ${filename} (${stats.size} bytes)`);
    }

    return generatedFiles;
  }

  /**
   * Schema 파일 분류
   */
  private classifySchemaFiles(
    files: Array<{ path: string; size: number; content: string }>,
    orm: 'prisma' | 'drizzle'
  ): GeneratedSchemaFile[] {
    return files
      .filter(f => {
        if (orm === 'prisma') {
          return f.path.endsWith('schema.prisma');
        } else {
          return f.path.includes('lib/database/schema.ts');
        }
      })
      .map(file => {
        // Extract model names from content
        const models: string[] = [];
        if (orm === 'prisma') {
          const modelMatches = file.content.matchAll(/model\s+(\w+)\s*{/g);
          for (const match of modelMatches) {
            models.push(match[1]);
          }
        } else {
          const tableMatches = file.content.matchAll(/export const (\w+) = .*Table/g);
          for (const match of tableMatches) {
            models.push(match[1]);
          }
        }

        return {
          path: file.path,
          orm,
          models,
          size: file.size,
        };
      });
  }

  /**
   * Migration 파일 분류
   */
  private classifyMigrationFiles(
    files: Array<{ path: string; size: number; content: string }>,
  ): GeneratedMigrationFile[] {
    return files
      .filter(f => f.path.includes('migrations/'))
      .map(file => {
        const name = path.basename(file.path);
        const timestamp = new Date().toISOString();

        return {
          path: file.path,
          name,
          timestamp,
          size: file.size,
        };
      });
  }

  /**
   * Seed 파일 분류
   */
  private classifySeedFiles(
    files: Array<{ path: string; size: number; content: string }>,
  ): GeneratedSeedFile[] {
    return files
      .filter(f => f.path.includes('seed.ts'))
      .map(file => {
        // Extract seeded models from content
        const models: string[] = [];
        const createMatches = file.content.matchAll(/prisma\.(\w+)\.create|db\.insert\((\w+)\)/g);
        for (const match of createMatches) {
          const model = match[1] || match[2];
          if (model && !models.includes(model)) {
            models.push(model);
          }
        }

        return {
          path: file.path,
          models,
          size: file.size,
        };
      });
  }

  /**
   * Client 파일 분류
   */
  private classifyClientFiles(
    files: Array<{ path: string; size: number; content: string }>,
  ): GeneratedClientFile[] {
    return files
      .filter(f => f.path.includes('lib/database/') && !f.path.includes('schema.ts') && !f.path.includes('seed.ts'))
      .map(file => {
        let type: 'client' | 'helper' | 'types' = 'client';

        if (file.path.includes('client.ts')) {
          type = 'client';
        } else if (file.path.includes('index.ts')) {
          type = 'helper';
        } else if (file.path.includes('types.ts')) {
          type = 'types';
        }

        return {
          path: file.path,
          type,
          size: file.size,
        };
      });
  }
}

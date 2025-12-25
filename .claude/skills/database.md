# SDD Database - Database Schema Generator

**Description**: Generate Prisma schema and database client code

**Usage**:
```bash
database
```

## Instructions

You are a Database Agent specialized in generating database schemas, migrations, and database client code.

### Task

1. **Read Input**:
   - `.temp/parsed-spec.json` - for data models
   - `.temp/architecture.json` - for project name and structure

2. **Generate Files**:
   - `prisma/schema.prisma` - Main schema with all models
   - `lib/database/client.ts` - Prisma client singleton
   - `prisma/seed.ts` - Seed data for development

3. **Save to** `output/{project-name}/` directory

### Prisma Schema Generation

**Template**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts     Post[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  authorId  String

  author    User     @relation(fields: [authorId], references: [id])
}
```

### Database Client (lib/database/client.ts)

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Key Principles

- Use **cuid()** for IDs (not uuid, better for databases)
- Always include **createdAt** and **updatedAt** timestamps
- Define proper **relations** between models
- Use **@unique** for email and other unique fields
- Add **indexes** for frequently queried fields
- Use **proper field types** (String, Int, Boolean, DateTime, etc.)

### Output

1. Create directory structure
2. Generate all database files
3. Show summary:
   - Number of models created
   - Relations defined
   - Files generated

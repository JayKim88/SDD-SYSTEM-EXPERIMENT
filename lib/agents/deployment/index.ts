import * as path from 'path';
import * as fs from 'fs/promises';
import { BaseAgent } from '../base-agent';
import {
  DeploymentInput,
  DeploymentOutput,
  GeneratedDeploymentFile,
  DeploymentFileType,
} from './types';

/**
 * Deployment Agent
 *
 * Docker 및 CI/CD 설정 파일 생성 전문 Agent (템플릿 기반, API 호출 없음)
 */
export class DeploymentAgent extends BaseAgent<DeploymentInput, DeploymentOutput> {
  constructor(context = {}) {
    super('Deployment', '1.0.0', context);
  }

  async execute(input: DeploymentInput): Promise<DeploymentOutput> {
    this.log(`Starting Deployment Agent`);
    this.log(`Project: ${input.architecture.projectName}`);

    try {
      // 1. 프로젝트 경로 설정
      const projectPath = path.join(
        this.context.outputDir!,
        input.architecture.projectName
      );

      const deploymentFiles: GeneratedDeploymentFile[] = [];

      // 2. Dockerfile 생성
      this.log('Generating Dockerfile...');
      deploymentFiles.push(await this.generateDockerfile(projectPath, input));

      // 3. docker-compose.yml 생성
      this.log('Generating docker-compose.yml...');
      deploymentFiles.push(await this.generateDockerCompose(projectPath, input));

      // 4. .dockerignore 생성
      this.log('Generating .dockerignore...');
      deploymentFiles.push(await this.generateDockerignore(projectPath, input));

      // 5. GitHub Actions CI/CD 생성
      this.log('Generating .github/workflows/ci.yml...');
      deploymentFiles.push(await this.generateGitHubActions(projectPath, input));

      // 6. DEPLOYMENT.md 생성
      this.log('Generating DEPLOYMENT.md...');
      deploymentFiles.push(await this.generateDeploymentGuide(projectPath, input));

      const output: DeploymentOutput = {
        projectPath,
        deploymentFiles,
        filesGenerated: deploymentFiles.length,
      };

      this.log(`Deployment files generation completed successfully`);
      this.log(`Generated ${output.filesGenerated} deployment files`);

      return output;
    } catch (error) {
      this.log(`Deployment files generation failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * Dockerfile 생성 (Multi-stage build for Next.js)
   */
  private async generateDockerfile(
    projectPath: string,
    input: DeploymentInput
  ): Promise<GeneratedDeploymentFile> {
    // Detect ORM for build steps
    let hasDatabase = false;
    let detectedOrm: 'prisma' | 'drizzle' | null = null;

    if (input.database && input.database.schemaFiles.length > 0) {
      hasDatabase = true;
      detectedOrm = input.database.schemaFiles[0].orm;
    }

    const content = `# Dockerfile for Next.js App
# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build environment
ENV NEXT_TELEMETRY_DISABLED 1
${hasDatabase && detectedOrm === 'prisma' ? 'ENV DATABASE_URL="postgresql://placeholder"\n' : ''}
${hasDatabase && detectedOrm === 'prisma' ? '# Generate Prisma Client\nRUN npx prisma generate\n' : ''}
# Build Next.js app
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
${hasDatabase && detectedOrm === 'prisma' ? 'COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma\nCOPY --from=builder /app/prisma ./prisma\n' : ''}
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
`;

    const filePath = path.join(projectPath, 'Dockerfile');
    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: Dockerfile (${stats.size} bytes)`);

    return {
      path: 'Dockerfile',
      type: 'Dockerfile',
      size: stats.size,
    };
  }

  /**
   * docker-compose.yml 생성
   */
  private async generateDockerCompose(
    projectPath: string,
    input: DeploymentInput
  ): Promise<GeneratedDeploymentFile> {
    const { projectName } = input.parsedSpec;
    const serviceName = projectName.toLowerCase().replace(/\s+/g, '-');

    // Detect database for services
    let hasDatabase = false;
    let detectedOrm: 'prisma' | 'drizzle' | null = null;

    if (input.database && input.database.schemaFiles.length > 0) {
      hasDatabase = true;
      detectedOrm = input.database.schemaFiles[0].orm;
    }

    const content = `version: '3.8'

services:
  # Next.js App
  ${serviceName}:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      ${hasDatabase ? '- DATABASE_URL=postgresql://postgres:password@postgres:5432/appdb' : ''}
    ${hasDatabase ? 'depends_on:\n      - postgres' : ''}
    restart: unless-stopped

${hasDatabase ? `  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: appdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
` : ''}
${hasDatabase ? 'volumes:\n  postgres_data:\n' : ''}`;

    const filePath = path.join(projectPath, 'docker-compose.yml');
    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: docker-compose.yml (${stats.size} bytes)`);

    return {
      path: 'docker-compose.yml',
      type: 'docker-compose.yml',
      size: stats.size,
    };
  }

  /**
   * .dockerignore 생성
   */
  private async generateDockerignore(
    projectPath: string,
    input: DeploymentInput
  ): Promise<GeneratedDeploymentFile> {
    const content = `# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Testing
coverage
.nyc_output
test-results/
playwright-report/
playwright/.cache/

# Next.js
.next/
out/
build
dist

# Production
.vercel
.netlify

# Env
.env
.env*.local
.env.production

# IDE
.vscode
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# TypeScript
*.tsbuildinfo

# Git
.git
.gitignore

# Documentation
README.md
DEPLOYMENT.md

# Prisma
prisma/migrations
`;

    const filePath = path.join(projectPath, '.dockerignore');
    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: .dockerignore (${stats.size} bytes)`);

    return {
      path: '.dockerignore',
      type: '.dockerignore',
      size: stats.size,
    };
  }

  /**
   * GitHub Actions CI/CD 생성
   */
  private async generateGitHubActions(
    projectPath: string,
    input: DeploymentInput
  ): Promise<GeneratedDeploymentFile> {
    const { projectName } = input.parsedSpec;

    // Detect ORM for CI steps
    let hasDatabase = false;
    let detectedOrm: 'prisma' | 'drizzle' | null = null;

    if (input.database && input.database.schemaFiles.length > 0) {
      hasDatabase = true;
      detectedOrm = input.database.schemaFiles[0].orm;
    }

    const content = `name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      ${hasDatabase && detectedOrm === 'prisma' ? '- name: Generate Prisma Client\n        run: npx prisma generate\n\n      ' : ''}- name: Run ESLint
        run: npm run lint

      - name: Run TypeScript type check
        run: npx tsc --noEmit

  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      ${hasDatabase && detectedOrm === 'prisma' ? '- name: Generate Prisma Client\n        run: npx prisma generate\n\n      ' : ''}- name: Run unit tests
        run: npm run test

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      ${hasDatabase && detectedOrm === 'prisma' ? '- name: Generate Prisma Client\n        run: npx prisma generate\n\n      ' : ''}- name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      ${hasDatabase && detectedOrm === 'prisma' ? '- name: Generate Prisma Client\n        run: npx prisma generate\n\n      ' : ''}- name: Build application
        run: npm run build
        env:
          NODE_ENV: production

  docker:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest
    needs: [build, e2e]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKER_USERNAME }}
          password: \${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            \${{ secrets.DOCKER_USERNAME }}/${projectName.toLowerCase().replace(/\s+/g, '-')}:latest
            \${{ secrets.DOCKER_USERNAME }}/${projectName.toLowerCase().replace(/\s+/g, '-')}:\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
`;

    const workflowDir = path.join(projectPath, '.github', 'workflows');
    await fs.mkdir(workflowDir, { recursive: true });

    const filePath = path.join(workflowDir, 'ci.yml');
    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: .github/workflows/ci.yml (${stats.size} bytes)`);

    return {
      path: '.github/workflows/ci.yml',
      type: 'ci-cd',
      size: stats.size,
    };
  }

  /**
   * DEPLOYMENT.md 가이드 생성
   */
  private async generateDeploymentGuide(
    projectPath: string,
    input: DeploymentInput
  ): Promise<GeneratedDeploymentFile> {
    const { projectName } = input.parsedSpec;

    // Detect database
    let hasDatabase = false;
    let detectedOrm: 'prisma' | 'drizzle' | null = null;

    if (input.database && input.database.schemaFiles.length > 0) {
      hasDatabase = true;
      detectedOrm = input.database.schemaFiles[0].orm;
    }

    const content = `# Deployment Guide - ${projectName}

This guide covers deployment options for your Next.js application.

## Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ (for local development)
${hasDatabase ? '- PostgreSQL database (production)' : ''}

---

## Option 1: Docker Compose (Recommended for Development)

### 1. Build and Run

\`\`\`bash
# Build the Docker image
docker-compose build

# Start all services
docker-compose up -d
\`\`\`

${hasDatabase && detectedOrm === 'prisma' ? `### 2. Run Database Migrations

\`\`\`bash
# Generate Prisma Client (if needed)
docker-compose exec ${projectName.toLowerCase().replace(/\s+/g, '-')} npx prisma generate

# Push schema to database
docker-compose exec ${projectName.toLowerCase().replace(/\s+/g, '-')} npx prisma db push

# Seed database (optional)
docker-compose exec ${projectName.toLowerCase().replace(/\s+/g, '-')} npx prisma db seed
\`\`\`
` : ''}
### ${hasDatabase ? '3' : '2'}. Access the Application

- App: http://localhost:3000
${hasDatabase ? '- Database: localhost:5432' : ''}

### ${hasDatabase ? '4' : '3'}. Stop Services

\`\`\`bash
docker-compose down

# To remove volumes
docker-compose down -v
\`\`\`

---

## Option 2: Docker (Production)

### 1. Build Production Image

\`\`\`bash
docker build -t ${projectName.toLowerCase().replace(/\s+/g, '-')}:latest .
\`\`\`

### 2. Run Container

\`\`\`bash
docker run -p 3000:3000 \\
  ${hasDatabase ? '-e DATABASE_URL="postgresql://user:password@host:5432/db" \\\n  ' : ''}-e NODE_ENV=production \\
  ${projectName.toLowerCase().replace(/\s+/g, '-')}:latest
\`\`\`

---

## Option 3: Vercel (Easiest)

### 1. Install Vercel CLI

\`\`\`bash
npm i -g vercel
\`\`\`

### 2. Deploy

\`\`\`bash
vercel --prod
\`\`\`

${hasDatabase ? `### 3. Set Environment Variables

In Vercel Dashboard, add:
- \`DATABASE_URL\`: Your PostgreSQL connection string
` : ''}
---

## Option 4: AWS / DigitalOcean / Other

### Using Docker Image

1. Push to Docker Hub:
   \`\`\`bash
   docker tag ${projectName.toLowerCase().replace(/\s+/g, '-')}:latest your-username/${projectName.toLowerCase().replace(/\s+/g, '-')}:latest
   docker push your-username/${projectName.toLowerCase().replace(/\s+/g, '-')}:latest
   \`\`\`

2. Deploy to your platform using the Docker image

---

## CI/CD (GitHub Actions)

The project includes a GitHub Actions workflow (\`.github/workflows/ci.yml\`) that:

1. **Lint & Type Check** - Ensures code quality
2. **Unit Tests** - Runs Vitest tests
3. **E2E Tests** - Runs Playwright tests
4. **Build** - Verifies production build
5. **Docker** - Builds and pushes Docker image (on main branch)

### Setup Secrets

Add these secrets in GitHub Settings → Secrets:

- \`DOCKER_USERNAME\`: Your Docker Hub username
- \`DOCKER_PASSWORD\`: Your Docker Hub password/token

---

## Environment Variables

### Required

\`\`\`env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
${hasDatabase ? 'DATABASE_URL=postgresql://user:password@host:5432/db' : ''}
\`\`\`

### Optional

See \`.env.example\` for additional configuration options.

---

## Performance Optimization

### Next.js Configuration

The build is optimized with:
- Standalone output mode (smaller Docker images)
- Static optimization
- Image optimization
- Code splitting

### Docker Image

- Multi-stage build reduces final image size
- Only production dependencies included
- Non-root user for security

---

## Monitoring & Logging

Consider adding:

- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Vercel Analytics**: Performance monitoring
- **PostgreSQL logs**: Database monitoring

---

## Scaling

### Horizontal Scaling

The Docker image is stateless and can be scaled horizontally:

\`\`\`bash
docker-compose up --scale ${projectName.toLowerCase().replace(/\s+/g, '-')}=3
\`\`\`

${hasDatabase ? `### Database

Consider:
- Connection pooling (PgBouncer)
- Read replicas for high traffic
- Managed database (Supabase, RDS, etc.)
` : ''}
---

## Troubleshooting

### Docker build fails

- Check Node.js version in Dockerfile
- Ensure all dependencies are in package.json
- Verify DATABASE_URL is set during build

### Database connection errors

- Check DATABASE_URL format
- Ensure database is accessible from container
- Verify database credentials

---

## Support

For issues, check:
- GitHub Issues
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com)

---

**Generated by [SDD System](https://github.com/your-username/sdd-system)**
`;

    const filePath = path.join(projectPath, 'DEPLOYMENT.md');
    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: DEPLOYMENT.md (${stats.size} bytes)`);

    return {
      path: 'DEPLOYMENT.md',
      type: 'deployment-guide',
      size: stats.size,
    };
  }
}

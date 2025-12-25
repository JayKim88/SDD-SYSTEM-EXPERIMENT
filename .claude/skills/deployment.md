# SDD Deployment - Deployment Configuration Generator

**Description**: Generate Docker and CI/CD configuration files

**Usage**:
```bash
deployment
```

## Instructions

Generate deployment-ready configuration files for containerization and CI/CD.

### Task

1. **Read Input**:
   - `.temp/parsed-spec.json` - for project info
   - `.temp/architecture.json` - for project structure

2. **Generate Files** in `output/{project-name}/`:
   - `Dockerfile` - Multi-stage Docker build
   - `docker-compose.yml` - Local development with database
   - `.dockerignore` - Files to exclude from Docker build
   - `.github/workflows/ci.yml` - GitHub Actions CI/CD pipeline

### Dockerfile (Multi-stage)

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    ports:
      - '5432:5432'
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=app
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### .dockerignore

```
node_modules
.next
.git
.env*.local
.DS_Store
*.log
npm-debug.log*
```

### GitHub Actions CI/CD

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm test

  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
```

### Output

1. Generate all deployment files
2. Show summary:
   - Docker configuration created
   - CI/CD pipeline configured
   - Ready for deployment

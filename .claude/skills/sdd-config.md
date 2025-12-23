# SDD Config - Configuration Files Generator

**Description**: Generate all project configuration files (package.json, tsconfig.json, etc.)

**Usage**:
```bash
sdd-config
```

## Instructions

Generate all necessary configuration files for a Next.js 14 TypeScript project.

### Task

1. **Read Input**:
   - `.temp/parsed-spec.json` - for project info
   - `.temp/architecture.json` - for dependencies and structure

2. **Generate Files** in `output/{project-name}/`:
   - `package.json` - Project metadata and dependencies
   - `tsconfig.json` - TypeScript configuration
   - `next.config.js` - Next.js configuration
   - `tailwind.config.ts` - Tailwind CSS configuration (if using Tailwind)
   - `postcss.config.js` - PostCSS configuration
   - `.eslintrc.json` - ESLint configuration
   - `.gitignore` - Git ignore patterns
   - `.env.example` - Environment variables template
   - `README.md` - Project documentation

### Configuration Templates

**package.json**:
```json
{
  "name": "{project-name}",
  "version": "0.1.0",
  "private": true,
  "description": "{description}",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**next.config.js**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
```

**.env.example**:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**.gitignore**:
```
# dependencies
/node_modules

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

### Output

1. Generate all configuration files
2. Show summary:
   - Total config files created
   - Key settings applied

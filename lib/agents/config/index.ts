import * as path from 'path';
import * as fs from 'fs/promises';
import { BaseAgent } from '../base-agent';
import {
  ConfigInput,
  ConfigOutput,
  GeneratedConfigFile,
  ConfigFileType,
} from './types';

/**
 * Config Agent
 *
 * 프로젝트 설정 파일 생성 전문 Agent (템플릿 기반, API 호출 없음)
 */
export class ConfigAgent extends BaseAgent<ConfigInput, ConfigOutput> {
  constructor(context = {}) {
    super('Config', '1.0.0', context);
  }

  async execute(input: ConfigInput): Promise<ConfigOutput> {
    this.log(`Starting Config Agent`);
    this.log(`Project: ${input.architecture.projectName}`);

    try {
      // 1. 프로젝트 경로 설정
      const projectPath = path.join(
        this.context.outputDir!,
        input.architecture.projectName
      );

      const configFiles: GeneratedConfigFile[] = [];

      // 2. package.json 생성
      this.log('Generating package.json...');
      configFiles.push(await this.generatePackageJson(projectPath, input));

      // 3. tsconfig.json 생성
      this.log('Generating tsconfig.json...');
      configFiles.push(await this.generateTsConfig(projectPath, input));

      // 4. next.config.js 생성
      this.log('Generating next.config.js...');
      configFiles.push(await this.generateNextConfig(projectPath, input));

      // 5. tailwind.config.ts 생성
      this.log('Generating tailwind.config.ts...');
      configFiles.push(await this.generateTailwindConfig(projectPath, input));

      // 6. postcss.config.js 생성
      this.log('Generating postcss.config.js...');
      configFiles.push(await this.generatePostCssConfig(projectPath, input));

      // 7. .gitignore 생성
      this.log('Generating .gitignore...');
      configFiles.push(await this.generateGitignore(projectPath, input));

      // 8. .env.example 생성
      this.log('Generating .env.example...');
      configFiles.push(await this.generateEnvExample(projectPath, input));

      // 9. README.md 생성
      this.log('Generating README.md...');
      configFiles.push(await this.generateReadme(projectPath, input));

      // 10. .eslintrc.json 생성
      this.log('Generating .eslintrc.json...');
      configFiles.push(await this.generateEslintConfig(projectPath, input));

      const output: ConfigOutput = {
        projectPath,
        configFiles,
        filesGenerated: configFiles.length,
      };

      this.log(`Config generation completed successfully`);
      this.log(`Generated ${output.filesGenerated} config files`);

      return output;
    } catch (error) {
      this.log(`Config generation failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * package.json 생성
   */
  private async generatePackageJson(
    projectPath: string,
    input: ConfigInput
  ): Promise<GeneratedConfigFile> {
    const { projectName, description } = input.parsedSpec;
    const { techStack } = input.parsedSpec;

    // Base dependencies
    const dependencies: Record<string, string> = {
      'next': '^14.0.0',
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
    };

    // Styling
    if (techStack.styling?.toLowerCase().includes('tailwind')) {
      dependencies['tailwindcss'] = '^3.4.0';
      dependencies['autoprefixer'] = '^10.4.0';
      dependencies['postcss'] = '^8.4.0';
    }

    // Database - Check what Database Agent actually generated
    let detectedOrm: 'prisma' | 'drizzle' | null = null;

    if (input.database && input.database.schemaFiles.length > 0) {
      // Use the ORM that Database Agent actually used
      detectedOrm = input.database.schemaFiles[0].orm;
      this.log(`Detected ORM from Database Agent: ${detectedOrm}`);

      if (detectedOrm === 'prisma') {
        dependencies['@prisma/client'] = '^5.0.0';
      } else if (detectedOrm === 'drizzle') {
        dependencies['drizzle-orm'] = '^0.29.0';
        dependencies['postgres'] = '^3.4.0';
      }
    } else if (techStack.database?.toLowerCase().includes('supabase')) {
      // Fallback to tech stack detection if no Database Agent output
      dependencies['@supabase/supabase-js'] = '^2.0.0';
      dependencies['@supabase/ssr'] = '^0.0.10';
    }

    // Validation
    dependencies['zod'] = '^3.22.0';

    // UI (optional)
    dependencies['lucide-react'] = '^0.294.0';
    dependencies['clsx'] = '^2.0.0';

    const devDependencies: Record<string, string> = {
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
      'eslint': '^8.0.0',
      'eslint-config-next': '^14.0.0',
    };

    // Add ORM dev dependencies
    if (detectedOrm === 'prisma') {
      devDependencies['prisma'] = '^5.0.0';
      devDependencies['tsx'] = '^4.7.0'; // For running seed script
    } else if (detectedOrm === 'drizzle') {
      devDependencies['drizzle-kit'] = '^0.20.0';
      devDependencies['tsx'] = '^4.7.0'; // For running seed script
    }

    // Build scripts object with database scripts if applicable
    const scripts: Record<string, string> = {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    };

    // Add database scripts based on detected ORM
    if (detectedOrm === 'prisma') {
      scripts['db:generate'] = 'prisma generate';
      scripts['db:push'] = 'prisma db push';
      scripts['db:migrate'] = 'prisma migrate dev';
      scripts['db:seed'] = 'tsx prisma/seed.ts';
      scripts['db:studio'] = 'prisma studio';
    } else if (detectedOrm === 'drizzle') {
      scripts['db:generate'] = 'drizzle-kit generate:pg';
      scripts['db:push'] = 'drizzle-kit push:pg';
      scripts['db:migrate'] = 'tsx lib/database/migrate.ts';
      scripts['db:seed'] = 'tsx lib/database/seed.ts';
      scripts['db:studio'] = 'drizzle-kit studio';
    }

    const packageJson = {
      name: projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0',
      private: true,
      description: description || `${projectName} - Generated by SDD System`,
      scripts,
      dependencies,
      devDependencies,
    };

    const content = JSON.stringify(packageJson, null, 2);
    const filePath = path.join(projectPath, 'package.json');

    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: package.json (${stats.size} bytes)`);

    return {
      path: 'package.json',
      type: 'package.json',
      size: stats.size,
    };
  }

  /**
   * tsconfig.json 생성
   */
  private async generateTsConfig(
    projectPath: string,
    input: ConfigInput
  ): Promise<GeneratedConfigFile> {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [
          {
            name: 'next',
          },
        ],
        paths: {
          '@/*': ['./*'],
        },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    };

    const content = JSON.stringify(tsconfig, null, 2);
    const filePath = path.join(projectPath, 'tsconfig.json');

    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: tsconfig.json (${stats.size} bytes)`);

    return {
      path: 'tsconfig.json',
      type: 'tsconfig.json',
      size: stats.size,
    };
  }

  /**
   * next.config.js 생성
   */
  private async generateNextConfig(
    projectPath: string,
    input: ConfigInput
  ): Promise<GeneratedConfigFile> {
    const content = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
`;

    const filePath = path.join(projectPath, 'next.config.js');

    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: next.config.js (${stats.size} bytes)`);

    return {
      path: 'next.config.js',
      type: 'next.config.js',
      size: stats.size,
    };
  }

  /**
   * tailwind.config.ts 생성
   */
  private async generateTailwindConfig(
    projectPath: string,
    input: ConfigInput
  ): Promise<GeneratedConfigFile> {
    const content = `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [],
};

export default config;
`;

    const filePath = path.join(projectPath, 'tailwind.config.ts');

    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: tailwind.config.ts (${stats.size} bytes)`);

    return {
      path: 'tailwind.config.ts',
      type: 'tailwind.config.ts',
      size: stats.size,
    };
  }

  /**
   * postcss.config.js 생성
   */
  private async generatePostCssConfig(
    projectPath: string,
    input: ConfigInput
  ): Promise<GeneratedConfigFile> {
    const content = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

    const filePath = path.join(projectPath, 'postcss.config.js');

    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: postcss.config.js (${stats.size} bytes)`);

    return {
      path: 'postcss.config.js',
      type: 'postcss.config.js',
      size: stats.size,
    };
  }

  /**
   * .gitignore 생성
   */
  private async generateGitignore(
    projectPath: string,
    input: ConfigInput
  ): Promise<GeneratedConfigFile> {
    const content = `# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Next.js
.next/
out/
build
dist

# Production
.vercel
.netlify

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

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
next-env.d.ts

# Prisma
prisma/migrations
`;

    const filePath = path.join(projectPath, '.gitignore');

    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: .gitignore (${stats.size} bytes)`);

    return {
      path: '.gitignore',
      type: '.gitignore',
      size: stats.size,
    };
  }

  /**
   * .env.example 생성
   */
  private async generateEnvExample(
    projectPath: string,
    input: ConfigInput
  ): Promise<GeneratedConfigFile> {
    const { techStack } = input.parsedSpec;
    const lines: string[] = [
      '# App',
      'NEXT_PUBLIC_APP_URL=http://localhost:3000',
      '',
    ];

    // Database
    if (techStack.database?.toLowerCase().includes('supabase')) {
      lines.push('# Supabase');
      lines.push('NEXT_PUBLIC_SUPABASE_URL=your-project-url');
      lines.push('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
      lines.push('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
      lines.push('');
    } else if (techStack.database?.toLowerCase().includes('postgres')) {
      lines.push('# Database');
      lines.push('DATABASE_URL=postgresql://user:password@localhost:5432/dbname');
      lines.push('');
    }

    // Authentication
    if (techStack.authentication?.toLowerCase().includes('nextauth')) {
      lines.push('# NextAuth');
      lines.push('NEXTAUTH_URL=http://localhost:3000');
      lines.push('NEXTAUTH_SECRET=your-secret-key');
      lines.push('');
    }

    const content = lines.join('\n');
    const filePath = path.join(projectPath, '.env.example');

    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: .env.example (${stats.size} bytes)`);

    return {
      path: '.env.example',
      type: '.env.example',
      size: stats.size,
    };
  }

  /**
   * README.md 생성
   */
  private async generateReadme(
    projectPath: string,
    input: ConfigInput
  ): Promise<GeneratedConfigFile> {
    const { projectName, description, techStack } = input.parsedSpec;

    const content = `# ${projectName}

${description || 'Generated by SDD System'}

## Tech Stack

- **Framework**: ${techStack.frontend || 'Next.js 14'}
- **Styling**: ${techStack.styling || 'Tailwind CSS'}
- **Database**: ${techStack.database || 'N/A'}
- **Language**: TypeScript

## Getting Started

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Setup Environment Variables

Copy \`.env.example\` to \`.env.local\`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Then update the values in \`.env.local\`.

### 3. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
${projectName}/
├── app/                 # Next.js 14 App Router
│   ├── api/            # API Routes
│   └── */page.tsx      # Pages
├── components/          # React Components
│   ├── ui/             # UI Components
│   └── ...
├── lib/                 # Utilities & Logic
│   ├── actions/        # Server Actions
│   ├── database/       # Database Layer
│   └── utils/          # Utilities
└── ...
\`\`\`

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint

## Generated by

[SDD System](https://github.com/your-username/sdd-system) - Spec-Driven Development
`;

    const filePath = path.join(projectPath, 'README.md');

    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: README.md (${stats.size} bytes)`);

    return {
      path: 'README.md',
      type: 'README.md',
      size: stats.size,
    };
  }

  /**
   * .eslintrc.json 생성
   */
  private async generateEslintConfig(
    projectPath: string,
    input: ConfigInput
  ): Promise<GeneratedConfigFile> {
    const eslintConfig = {
      extends: 'next/core-web-vitals',
    };

    const content = JSON.stringify(eslintConfig, null, 2);
    const filePath = path.join(projectPath, '.eslintrc.json');

    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    this.log(`Generated: .eslintrc.json (${stats.size} bytes)`);

    return {
      path: '.eslintrc.json',
      type: '.eslintrc.json',
      size: stats.size,
    };
  }
}

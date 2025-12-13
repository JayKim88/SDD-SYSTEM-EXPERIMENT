#!/usr/bin/env node

import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { SpecParserAgent } from './lib/agents/spec-parser';
import { ArchitectureAgent } from './lib/agents/architecture';
import { CodeGeneratorAgent } from './lib/agents/code-generator';

/**
 * SDD System CLI
 *
 * Spec 파일을 받아서 완전한 Next.js 앱을 생성합니다.
 */

interface CLIOptions {
  specPath: string;
  verbose?: boolean;
  clean?: boolean;
  outputDir?: string;
}

async function main() {
  console.log('🚀 SDD System - Starting...\n');

  // 1. CLI 인자 파싱
  const options = parseArguments();

  // 2. Spec 파일 존재 확인
  await validateSpecFile(options.specPath);

  // 3. Agent context 설정
  const context = {
    verbose: options.verbose ?? false,
    tempDir: '.temp',
    outputDir: options.outputDir ?? 'output',
  };

  // 4. .temp 디렉토리 생성
  await fs.mkdir(context.tempDir, { recursive: true });

  try {
    // Phase 0: Spec Parser Agent
    console.log('📝 Phase 0: Spec Parser Agent');
    console.log(`   Reading: ${options.specPath}`);
    const specParser = new SpecParserAgent(context);
    const parsedSpec = await specParser.execute({
      specPath: options.specPath,
    });
    console.log(`   ✅ Generated: ${context.tempDir}/parsed-spec.json\n`);

    // Phase 1: Architecture Agent
    console.log('🏗️  Phase 1: Architecture Agent');
    console.log('   Designing project structure...');
    const architecture = new ArchitectureAgent(context);
    const architectureOutput = await architecture.execute({
      parsedSpec,
    });
    console.log(`   ✅ Generated: ${context.tempDir}/architecture.json\n`);

    // Phase 2: Code Generator Agent
    console.log('💻 Phase 2: Code Generator Agent');
    console.log('   Generating code files...');
    const codeGenerator = new CodeGeneratorAgent(context);
    const codeOutput = await codeGenerator.execute({
      parsedSpec,
      architecture: architectureOutput,
    });

    console.log(`   ✅ Generated: ${codeOutput.projectPath}\n`);

    // 성공 메시지
    console.log('🎉 Success! Your app is ready.\n');
    console.log(`📦 Project: ${codeOutput.projectPath}`);
    console.log(`📄 Files: ${codeOutput.filesGenerated}`);
    console.log('\n📖 Next steps:');
    console.log(`   cd ${codeOutput.projectPath}`);
    console.log('   npm install');
    console.log('   npm run dev\n');

    // clean 옵션이 있으면 .temp 폴더 삭제
    if (options.clean) {
      await fs.rm(context.tempDir, { recursive: true, force: true });
      console.log('🧹 Cleaned temporary files');
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

/**
 * CLI 인자 파싱
 */
function parseArguments(): CLIOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const specPath = args.find(arg => !arg.startsWith('--'));

  if (!specPath) {
    console.error('❌ Error: Spec file path is required');
    printHelp();
    process.exit(1);
  }

  return {
    specPath,
    verbose: args.includes('--verbose') || args.includes('-v'),
    clean: args.includes('--clean') || args.includes('-c'),
    outputDir: getArgValue(args, '--output') || 'output',
  };
}

/**
 * 인자 값 추출
 */
function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : undefined;
}

/**
 * Spec 파일 검증
 */
async function validateSpecFile(specPath: string): Promise<void> {
  try {
    await fs.access(specPath);
  } catch (error) {
    console.error(`❌ Error: Spec file not found: ${specPath}`);
    process.exit(1);
  }
}

/**
 * 도움말 출력
 */
function printHelp() {
  console.log(`
🚀 SDD System - Spec-Driven Development

USAGE:
  sdd-generate <spec-file> [options]

ARGUMENTS:
  <spec-file>    Path to the specification file (.md)

OPTIONS:
  -v, --verbose  Enable verbose logging
  -c, --clean    Clean temporary files after generation
  --output <dir> Output directory (default: output)
  -h, --help     Show this help message

EXAMPLES:
  # Generate app from spec
  npm run generate specs/my-app.md

  # With verbose logging
  npm run generate specs/my-app.md --verbose

  # Custom output directory
  npm run generate specs/my-app.md --output ~/projects

  # Clean temp files after generation
  npm run generate specs/my-app.md --clean

For more information, visit: https://github.com/your-username/sdd-system
`);
}

// CLI 실행
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

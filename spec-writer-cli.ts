#!/usr/bin/env node

import 'dotenv/config';
import { SpecWriterAgent } from './lib/agents/spec-writer';
import { SpecWriterInput } from './lib/agents/spec-writer/types';

/**
 * Spec Writer CLI
 *
 * 애플리케이션 스펙 작성, 개선, 검토를 위한 CLI
 */

async function main() {
  console.log('📝 Spec Writer - Starting...\n');

  // CLI 인자 파싱
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '-h' || command === '--help') {
    printHelp();
    process.exit(0);
  }

  const context = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    tempDir: '.temp',
  };

  try {

    const agent = new SpecWriterAgent(context);
    let input: SpecWriterInput;

    switch (command) {
      case 'new':
      case 'create':
        input = await buildNewInput(args);
        break;

      case 'refine':
      case 'improve':
        input = await buildRefineInput(args);
        break;

      case 'review':
      case 'check':
        input = await buildReviewInput(args);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('\nRun "npm run spec:help" for usage information.');
        process.exit(1);
    }

    const result = await agent.execute(input);

    console.log('\n✅ Spec Writer completed successfully!');
    console.log(`\nSpec file: ${result.specPath}`);
    console.log(`\n📊 Review Results:`);
    console.log(`  - Consistency: ${result.reviewResults.consistency}/100`);
    console.log(`  - Completeness: ${result.reviewResults.completeness}/100`);
    console.log(`  - Feasibility: ${result.reviewResults.feasibility}/100`);
    console.log(`  - Overall: ${result.reviewResults.overall}/100`);

    if (result.reviewResults.issues.length > 0) {
      console.log(`\n⚠️  Found ${result.reviewResults.issues.length} issues:`);
      result.reviewResults.issues.slice(0, 5).forEach((issue, i) => {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`  ${icon} ${issue.message}`);
      });
      if (result.reviewResults.issues.length > 5) {
        console.log(`  ... and ${result.reviewResults.issues.length - 5} more`);
      }
    }

    if (result.reviewResults.suggestions.length > 0) {
      console.log(`\n💡 ${result.reviewResults.suggestions.length} suggestions available`);
    }

    console.log(`\n📈 Stats:`);
    console.log(`  - Total lines: ${result.stats.totalLines}`);
    console.log(`  - Data models: ${result.stats.dataModelsCount}`);
    console.log(`  - API endpoints: ${result.stats.apiEndpointsCount}`);
    console.log(`  - Pages: ${result.stats.pagesCount}`);
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}`);
    if (context.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

async function buildNewInput(args: string[]): Promise<SpecWriterInput> {
  const ideaIndex = args.indexOf('--idea');
  const templateIndex = args.indexOf('--template');
  const outputIndex = args.indexOf('--output');

  let idea = 'A new web application';
  if (ideaIndex !== -1 && args[ideaIndex + 1]) {
    idea = args[ideaIndex + 1];
  }

  let templateType: 'basic' | 'dashboard' | 'ecommerce' | 'financial' | 'social' | undefined;
  if (templateIndex !== -1 && args[templateIndex + 1]) {
    templateType = args[templateIndex + 1] as any;
  }

  let outputPath: string | undefined;
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    outputPath = args[outputIndex + 1];
  }

  return {
    mode: 'new',
    idea,
    templateType,
    outputPath,
    interactive: true,
  };
}

async function buildRefineInput(args: string[]): Promise<SpecWriterInput> {
  const specPath = args.find((arg) => arg.endsWith('.md') && !arg.startsWith('-'));

  if (!specPath) {
    throw new Error('Please provide a spec file path');
  }

  const outputIndex = args.indexOf('--output');
  let outputPath: string | undefined;
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    outputPath = args[outputIndex + 1];
  }

  return {
    mode: 'refine',
    existingSpecPath: specPath,
    outputPath,
    interactive: true,
  };
}

async function buildReviewInput(args: string[]): Promise<SpecWriterInput> {
  const specPath = args.find((arg) => arg.endsWith('.md') && !arg.startsWith('-'));

  if (!specPath) {
    throw new Error('Please provide a spec file path');
  }

  const autoFix = args.includes('--fix');

  return {
    mode: 'review',
    existingSpecPath: specPath,
    autoFix,
  };
}

function printHelp() {
  console.log(`
📝 Spec Writer - Application Specification Assistant

USAGE:
  npm run spec:<command> [options]

COMMANDS:
  new, create              Create a new specification from scratch
  refine, improve <file>   Refine an existing specification
  review, check <file>     Review and validate a specification

OPTIONS:
  --idea <text>           Initial idea for the app (for 'new' command)
  --template <type>       Use a template (basic, financial, ecommerce, social)
  --output <path>         Output file path
  --fix                   Auto-fix critical issues (for 'review' command)
  --verbose, -v           Verbose output
  --help, -h              Show this help message

EXAMPLES:
  # Create a new financial app spec
  npm run spec:new -- --idea "Personal finance tracker" --template financial

  # Review an existing spec
  npm run spec:review specs/my-app.md

  # Review and auto-fix critical issues
  npm run spec:review specs/my-app.md --fix

  # Refine an existing spec
  npm run spec:refine specs/my-app.md --output specs/my-app-v2.md

For more information, visit: https://github.com/your-repo/sdd-system
  `.trim());
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

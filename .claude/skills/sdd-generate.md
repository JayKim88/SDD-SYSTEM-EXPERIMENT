# SDD Generate - Full Application Generator

**Description**: Complete application generation from specification to deployment-ready code

**Usage**:
```bash
# Generate a full application from spec
sdd-generate <spec-file-path>

# Example:
sdd-generate specs/my-money-plan.md
sdd-generate specs/my-app.md --output custom-output
```

## What This Skill Does

Runs the complete SDD (Spec-Driven Development) pipeline:

1. **Spec Parser** - Parse markdown spec into structured JSON
2. **Architecture** - Design project structure and tech stack
3. **Database** - Generate Prisma schema and migrations
4. **Frontend** - Generate React/Next.js components and pages
5. **Backend** - Generate API routes and business logic
6. **Config** - Generate configuration files (tsconfig, eslint, etc)
7. **Testing** - Generate test files (component, API, E2E)
8. **Deployment** - Generate Docker and CI/CD configs
9. **Fix** - Run build, fix TypeScript errors if any

## Instructions

When this skill is invoked:

1. **Extract arguments**:
   - First argument: spec file path (required)
   - `--output`: Custom output directory (optional, default: `output`)
   - `--skip-fix`: Skip the fix phase (optional)
   - `--verbose`: Show detailed logs (optional)

2. **Read the spec file** and validate it exists

3. **Run Phase 1 - Spec Parser**:
   - Use the `sdd-parse` skill to parse the spec
   - Store result in `.temp/parsed-spec.json`

4. **Run Phase 2 - Architecture**:
   - Use the `sdd-architecture` skill
   - Input: parsed spec from Phase 1
   - Store result in `.temp/architecture.json`

5. **Run Phase 3 - Database**:
   - Use the `sdd-database` skill
   - Input: parsed spec + architecture
   - Generate files in `output/{project-name}/prisma/`

6. **Run Phase 4 - Frontend**:
   - Use the `sdd-frontend` skill
   - Input: parsed spec + architecture
   - Generate files in `output/{project-name}/src/`

7. **Run Phase 5 - Backend**:
   - Use the `sdd-backend` skill
   - Input: parsed spec + architecture + database schema
   - Generate files in `output/{project-name}/src/app/api/`

8. **Run Phase 6 - Config**:
   - Use the `sdd-config` skill
   - Generate config files (package.json, tsconfig.json, etc)

9. **Run Phase 7 - Testing**:
   - Use the `sdd-testing` skill
   - Generate test files for components and APIs

10. **Run Phase 8 - Deployment**:
    - Use the `sdd-deployment` skill
    - Generate Docker and GitHub Actions configs

11. **Run Phase 9 - Fix** (unless --skip-fix):
    - Use the `sdd-fix` skill
    - Run build, fix TypeScript/lint errors

12. **Report Results**:
    - Show summary of generated files
    - Show project location
    - Show next steps (npm install, npm run dev)

## Output Format

```
🚀 SDD System - Generation Complete!

📊 Summary:
  - Project: {project-name}
  - Location: output/{project-name}/
  - Total files: {count}
  - Phases completed: 9/9

📁 Generated:
  - Database: {count} files
  - Frontend: {count} files
  - Backend: {count} files
  - Tests: {count} files
  - Config: {count} files

🎯 Next Steps:
  cd output/{project-name}
  npm install
  npm run dev
```

## Error Handling

- If spec file not found: Show error and list available specs in `specs/`
- If any phase fails: Show error, save partial progress, allow resume
- If build fails in Fix phase: Show errors, provide fix suggestions

## Context Requirements

- Must have access to `.temp/` directory for intermediate files
- Must have write access to `output/` directory
- Spec file must be valid markdown with required sections

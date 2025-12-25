# SDD Generate - Full Application Generator

**Description**: Complete application generation from specification to deployment-ready code with interactive step-by-step approval

**Usage**:
```bash
# Interactive mode (default) - approve each phase
generate <spec-file-path>

# Auto mode - run all phases without confirmation
generate <spec-file-path> --auto

# Resume from checkpoint
generate <spec-file-path> --resume

# Examples:
generate specs/my-money-plan.md
generate specs/my-app.md --output custom-output
generate specs/my-app.md --auto --skip-fix
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

###  Initial Setup

1. **Extract arguments**:
   - First argument: spec file path (required)
   - `--auto`: Auto mode (skip confirmations, run all phases)
   - `--resume`: Resume from last checkpoint
   - `--output`: Custom output directory (optional, default: `output`)
   - `--skip-fix`: Skip the fix phase (optional)
   - `--verbose`: Show detailed logs (optional)

2. **Determine execution mode**:
   - If `--auto` flag: **Auto Mode** (no confirmations)
   - Else: **Interactive Mode** (default, ask for approval after each phase)

3. **Check for checkpoint**:
   - If `--resume`: Load `.temp/checkpoint.json`
   - Resume from last completed phase
   - Else: Start from Phase 1

4. **Read the spec file** and validate it exists

### 📋 Phase Execution Pattern (for each phase)

**For Interactive Mode**:
```
1. Show phase banner (e.g., "Phase 1: Spec Parser")
2. Execute the phase
3. Save checkpoint to `.temp/checkpoint.json`
4. Show results summary
5. Ask user: "[OK] Phase N complete. Continue to Phase N+1? (yes/no/modify/skip)"
   - yes: Proceed to next phase
   - no: Stop execution, save checkpoint
   - modify: Allow user to edit output, then re-run phase
   - skip: Skip this phase, proceed to next
```

**For Auto Mode**:
```
1. Show phase banner
2. Execute the phase
3. Save checkpoint
4. Immediately proceed to next phase
```

### 🔄 Phase-by-Phase Execution

#### **Phase 1 - Spec Parser**
- Execute: `parse` skill
- Output: `.temp/parsed-spec.json`
- Checkpoint: `{ "lastPhase": 1, "completed": ["parse"], "outputs": {...} }`
- **[Interactive]** Show: Project name, features count, models count, endpoints count
- **[Interactive]** Ask: "Continue to Phase 2 (Architecture)?"

#### **Phase 2 - Architecture**
- Execute: `architecture` skill
- Input: `.temp/parsed-spec.json`
- Output: `.temp/architecture.json`
- Checkpoint: `{ "lastPhase": 2, "completed": ["parse", "architecture"], ... }`
- **[Interactive]** Show: Directory structure, dependencies list, file count
- **[Interactive]** Ask: "Continue to Phase 3 (Database)?"

#### **Phase 3 - Database**
- Execute: `database` skill
- Input: `.temp/parsed-spec.json` + `.temp/architecture.json`
- Output: `output/{project-name}/prisma/schema.prisma`
- Checkpoint: `{ "lastPhase": 3, "completed": [..., "database"], ... }`
- **[Interactive]** Show: Models count, relations, generated files
- **[Interactive]** Ask: "Continue to Phase 4 (Frontend)?"

#### **Phase 4 - Frontend**
- Execute: `frontend` skill
- Input: All previous outputs
- Output: `output/{project-name}/src/app/`, `src/components/`
- Checkpoint: `{ "lastPhase": 4, "completed": [..., "frontend"], ... }`
- **[Interactive]** Show: Pages count, components count, generated files
- **[Interactive]** Ask: "Continue to Phase 5 (Backend)?"

#### **Phase 5 - Backend**
- Execute: `backend` skill
- Input: All previous outputs
- Output: `output/{project-name}/src/app/api/`
- Checkpoint: `{ "lastPhase": 5, "completed": [..., "backend"], ... }`
- **[Interactive]** Show: API routes count, generated files
- **[Interactive]** Ask: "Continue to Phase 6 (Config)?"

#### **Phase 6 - Config**
- Execute: `config` skill
- Input: `.temp/architecture.json`
- Output: `package.json`, `tsconfig.json`, etc.
- Checkpoint: `{ "lastPhase": 6, "completed": [..., "config"], ... }`
- **[Interactive]** Show: Config files list
- **[Interactive]** Ask: "Continue to Phase 7 (Testing)?"

#### **Phase 7 - Testing**
- Execute: `testing` skill
- Input: All previous outputs
- Output: Test files in `__tests__/` directories
- Checkpoint: `{ "lastPhase": 7, "completed": [..., "testing"], ... }`
- **[Interactive]** Show: Test files count
- **[Interactive]** Ask: "Continue to Phase 8 (Deployment)?"

#### **Phase 8 - Deployment**
- Execute: `deployment` skill
- Input: `.temp/architecture.json`
- Output: `Dockerfile`, `.github/workflows/`, etc.
- Checkpoint: `{ "lastPhase": 8, "completed": [..., "deployment"], ... }`
- **[Interactive]** Show: Deployment files list
- **[Interactive]** Ask: "Continue to Phase 9 (Fix)?" or "Skip fix phase?"

#### **Phase 9 - Fix** (unless --skip-fix)
- Execute: `fix` skill
- Input: Generated project
- Output: Fixed TypeScript/lint errors
- Checkpoint: `{ "lastPhase": 9, "completed": [..., "fix"], "status": "complete" }`
- **[Interactive]** Show: Errors found, errors fixed
- **[Interactive]** Final confirmation

### Summary: Final Report

After all phases complete (or when user stops):
- Show comprehensive summary
- Show project location
- Show next steps
- Clean up checkpoint (or keep if incomplete)

## Output Format

### Interactive Mode - Phase Completion

```
Phase 2: Architecture Design
--------------------------------

[OK] Architecture designed successfully!

Summary:
  - Directories: 12
  - Dependencies: 21 packages
  - DevDependencies: 10 packages
  - Planned files: 19

Key Structure:
  ├── prisma/
  ├── src/app/
  ├── src/components/
  ├── src/lib/
  └── public/

Checkpoint saved: .temp/checkpoint.json

--------------------------------
Continue to Phase 3 (Database)? (yes/no/modify/skip)
```

### Auto Mode - Progress Indicator

```
 SDD System - Auto Mode

[OK] Phase 1: Spec Parser .............. Complete
[OK] Phase 2: Architecture ............. Complete
Phase 3: Database ................ Running...
```

### Final Report

```
--------------------------------------------
Complete! SDD System - Generation Complete!
--------------------------------------------

Summary:
  - Project: my-money-plan
  - Location: output/my-money-plan/
  - Total files: 87
  - Phases completed: 9/9
  - Duration: 12m 34s

Generated:
  [OK] Database:    3 files (schema, seed, migrations)
  [OK] Frontend:    34 files (pages, components, charts)
  [OK] Backend:     26 files (API routes, middleware)
  [OK] Tests:       18 files (unit, integration, e2e)
  [OK] Config:      6 files (tsconfig, eslint, etc)

 Next Steps:
  1. cd output/my-money-plan
  2. npm install
  3. cp .env.example .env
  4. npx prisma migrate dev
  5. npm run dev

 Your app will be running at: http://localhost:3000

--------------------------------------------
```

### Checkpoint Format

`.temp/checkpoint.json`:
```json
{
  "specFile": "specs/my-money-plan.md",
  "projectName": "my-money-plan",
  "outputDir": "output/my-money-plan",
  "mode": "interactive",
  "lastPhase": 3,
  "completed": ["parse", "architecture", "database"],
  "timestamp": "2025-12-25T10:30:00Z",
  "outputs": {
    "parsedSpec": ".temp/parsed-spec.json",
    "architecture": ".temp/architecture.json"
  },
  "stats": {
    "totalFiles": 45,
    "duration": 380
  }
}
```

## Error Handling

### Spec File Errors
- If spec file not found: Show error and list available specs in `specs/`
- If spec file is invalid: Show validation errors with line numbers

### Phase Execution Errors
- If any phase fails:
  1. Show detailed error message
  2. Save checkpoint at last successful phase
  3. Offer options:
     - Retry current phase
     - Skip current phase
     - Stop and resume later
     - Abort generation

### Checkpoint Recovery
- If interrupted (Ctrl+C, crash, etc.):
  1. Checkpoint is automatically saved
  2. Next run detects incomplete generation
  3. Offer to resume from last checkpoint

### Fix Phase Errors
- If build fails: Show TypeScript/lint errors with file:line
- Offer options:
  1. Auto-fix (run fix again)
  2. Manual fix (stop, let user fix)
  3. Skip fix (proceed without type-checking)

## Context Requirements

- Must have access to `.temp/` directory for intermediate files and checkpoints
- Must have write access to `output/` directory
- Spec file must be valid markdown with required sections

## Key Principles

### Interactive Mode Benefits
1. **User Control**: Approve each phase before proceeding
2. **Early Feedback**: Catch issues early before they compound
3. **Flexibility**: Modify, skip, or stop at any phase
4. **Transparency**: See exactly what's being generated at each step
5. **Safety**: Checkpoints allow recovery from interruptions

### Checkpoint System Benefits
1. **Resumability**: Continue from where you left off
2. **Crash Recovery**: Automatic save prevents data loss
3. **Experimentation**: Try different approaches from same checkpoint
4. **Debugging**: Isolate issues to specific phases

### When to Use Auto Mode
- Spec is well-tested and stable
- Quick regeneration needed
- CI/CD pipeline integration
- Batch processing multiple specs

### When to Use Interactive Mode (Default)
- First time generating from a spec
- Complex or large applications
- Want to review each phase's output
- Learning how SDD works
- Debugging generation issues

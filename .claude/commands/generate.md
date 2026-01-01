---
description: Generate complete application from specification with step-by-step approval and checkpoint system
argument-hint: [spec-file] [--auto] [--parallel] [--resume] [--skip-fix]
---

# SDD Generate - Application Generator Command

Complete application generation pipeline using specialized sub-agents and skills.

##  Usage

```bash
# Interactive mode (default) - Sequential execution
/generate specs/my-money-plan.md

# Auto mode - Skip confirmations
/generate specs/my-money-plan.md --auto

# Parallel execution (Phase 3-8)
/generate specs/my-money-plan.md --parallel

# Resume from checkpoint
/generate specs/my-money-plan.md --resume

# Combined options
/generate specs/my-money-plan.md --auto --parallel --skip-fix
```

## 📋 Arguments

Extract and parse:
- **First argument**: spec file path (required)
- **--auto**: Skip user confirmations (auto mode)
- **--sequential**: Sequential execution (default)
- **--parallel**: Parallel execution for Phase 3-8
- **--resume**: Resume from last checkpoint
- **--skip-fix**: Skip Phase 9 (fix)
- **--output**: Custom output directory (default: output)

## 🔄 Execution Flow

### Phase 1: Spec Parser

```
1. Show banner: "Phase 1: Spec Parser"
2. Use parse-agent
3. Agent internally uses parse skill
4. Save checkpoint
5. Show results:
   - Project name
   - Features count
   - Data models count
   - API endpoints count
   - UI components count
6. [Interactive] Ask: "Continue to Phase 2? (yes/no/modify/skip)"
   - yes: Proceed
   - no: Stop, save checkpoint
   - modify: Let user edit .temp/parsed-spec.json, re-run
   - skip: Skip to Phase 2
7. [Auto] Proceed automatically
```

### Phase 2: Architecture

```
1. Show banner: "Phase 2: Architecture Design"
2. Use architecture-agent
3. Agent internally uses architecture skill
4. Save checkpoint
5. Show results:
   - Directories count
   - Dependencies count
   - Planned files count
   - Directory tree preview
6. [Interactive] Ask: "Continue to Phase 3? (yes/no/modify/skip)"
7. [Auto] Proceed automatically
```

### Phase 3-8: Code Generation

**Sequential Mode (--sequential, default)**:

Execute phases one by one:

```
Phase 3: Database (database-agent)
  → Show results → Ask user
Phase 4: Frontend (frontend-agent)
  → Show results → Ask user
Phase 5: Backend (backend-agent)
  → Show results → Ask user
Phase 6: Config (config-agent)
  → Show results → Ask user
Phase 7: Testing (testing-agent)
  → Show results → Ask user
Phase 8: Deployment (deployment-agent)
  → Show results → Ask user
```

**Parallel Mode (--parallel)**:

Launch all agents simultaneously:

```
1. Show banner: "Phase 3-8: Code Generation (Parallel)"
2. Launch in parallel:
   - Use database-agent
   - Use frontend-agent
   - Use backend-agent
   - Use config-agent
   - Use testing-agent
   - Use deployment-agent
3. Wait for all to complete
4. Collect all results
5. Save checkpoint
6. Show combined summary:
   - Database: X files
   - Frontend: X files
   - Backend: X files
   - Config: X files
   - Tests: X files
   - Deployment: X files
7. [Interactive] Ask: "All code generated. Continue to Phase 9 (Fix)?"
8. [Auto] Proceed automatically
```

### Phase 9: Fix

```
1. Show banner: "Phase 9: Fix & Validate"
2. Use fix-agent (unless --skip-fix)
3. Agent internally uses fix skill
4. Save checkpoint with duration
5. Show results:
   - Errors found
   - Errors fixed
   - Build status
6. Continue to Phase 10
```

### Phase 10: Documentation Organization

```
1. Show banner: "Phase 10: Documentation Organization"
2. Create docs/ folder structure:
   - docs/database/
   - docs/frontend/
   - docs/backend/
   - docs/config/
   - docs/testing/
   - docs/deployment/
3. Move all documentation files:
   - DATABASE_*.md → docs/database/
   - FRONTEND_*.md → docs/frontend/
   - API_DOCUMENTATION.md → docs/backend/
   - CONFIG_*.md → docs/config/
   - TESTING.md, TEST_*.md → docs/testing/
   - DEPLOYMENT*.md, MONITORING.md, BACKUP*.md → docs/deployment/
4. Create docs/README.md (comprehensive index with navigation)
5. Create docs/GENERATION_SUMMARY.md:
   - Phase-by-phase timeline with actual durations from checkpoint
   - Complete statistics for all 10 phases
   - Generated files summary (200+ files breakdown)
   - Technology stack used
   - Documentation structure
   - Production readiness checklist
   - Next steps and quick start guide
   - Total lines of code and file count
6. Copy GENERATION_SUMMARY.md to SDD system:
   - Copy to generation-reports/{project-name}-{YYYY-MM-DD}.md
   - This maintains generation history in SDD system
   - Allows tracking and comparison of all generations
7. Update main README.md to reference docs/ folder
8. Update docs/README.md to link to GENERATION_SUMMARY.md
9. Save final checkpoint with phase10 stats
10. Mark generation as complete (generationComplete: true)
```

**Generated in docs/**:
- `docs/README.md` - Main documentation index
- `docs/GENERATION_SUMMARY.md` - Complete generation report
- `docs/INDEX.md` - File reference guide
- `docs/database/` - 2 database guides
- `docs/frontend/` - 1 frontend guide
- `docs/backend/` - 1 API guide
- `docs/config/` - 1 config guide
- `docs/testing/` - 2 testing guides
- `docs/deployment/` - 6 deployment guides

**Total Documentation**: 16 files organized in docs/

## Checkpoint: Checkpoint System

Save checkpoint after each phase to `.temp/checkpoint.json`:

```json
{
  "specFile": "specs/my-money-plan.md",
  "projectName": "my-money-plan",
  "outputDir": "output/my-money-plan",
  "mode": "interactive",
  "executionMode": "sequential",
  "lastPhase": 3,
  "completed": ["parse", "architecture", "database"],
  "timestamp": "2025-12-25T12:00:00Z",
  "stats": {
    "phase1": {
      "features": 7,
      "dataModels": 7,
      "apiEndpoints": 47,
      "duration": 45
    },
    "phase2": {
      "totalFiles": 106,
      "directories": 38,
      "dependencies": 41,
      "duration": 62
    },
    "phase3": {
      "models": 7,
      "enums": 4,
      "filesGenerated": 10,
      "duration": 73
    },
    "totalDuration": 180
  },
  "generationComplete": false
}
```

## Summary: Output Format

### Phase Completion (Interactive)

```
Phase 2: Architecture Design
--------------------------------

[OK] Architecture designed successfully!

Summary:
  - Directories: 12
  - Dependencies: 21 packages
  - Planned Files: 19

Structure Preview:
  my-money-plan/
  ├── prisma/
  ├── src/app/
  ├── src/components/
  └── public/

Checkpoint: .temp/checkpoint.json

--------------------------------
Continue to Phase 3 (Database)? (yes/no/modify/skip)
```

### Parallel Execution Progress

```
Phase 3-8: Code Generation (Parallel)
--------------------------------

Launching 6 agents in parallel...

[OK] Database Agent ........... Complete (28s)
[OK] Config Agent ............. Complete (15s)
Frontend Agent ........... Running (45s)
Backend Agent ............ Running (38s)
[OK] Testing Agent ............ Complete (52s)
[OK] Deployment Agent ......... Complete (12s)

Waiting for 2 agents...

[OK] Frontend Agent ........... Complete (98s)
[OK] Backend Agent ............ Complete (82s)

Complete! All agents completed in 98s!
```

### Final Report

```
════════════════════════════════════════════════
🎉 GENERATION COMPLETE! SDD SYSTEM
════════════════════════════════════════════════

Summary:
  - Project: my-money-plan
  - Location: output/my-money-plan/
  - Total Files: 200+ files
  - Phases: 10/10 [OK]
  - Execution: Sequential
  - Total Duration: 8m 34s

Phase Timing:
  [OK] Phase 1: Spec Parser ............. 45s
  [OK] Phase 2: Architecture ............ 62s
  [OK] Phase 3: Database ................ 73s
  [OK] Phase 4: Frontend ................ 89s
  [OK] Phase 5: Backend ................. 78s
  [OK] Phase 6: Config .................. 34s
  [OK] Phase 7: Testing ................. 91s
  [OK] Phase 8: Deployment .............. 67s
  [OK] Phase 9: Fix & Validate .......... 82s
  [OK] Phase 10: Documentation .......... 13s

Generated:
  [OK] Database:    10 files (schema, seed, migrations, utils)
  [OK] Frontend:    45+ files (pages, components, charts, hooks)
  [OK] Backend:     43 files (33 API routes, validations)
  [OK] Config:      11 files (package.json, tsconfig, etc)
  [OK] Tests:       33+ files (unit, integration, e2e)
  [OK] Deployment:  17 files (Docker, CI/CD, monitoring)
  [OK] Docs:        16 files (organized in docs/ folder)

Documentation:
  📚 docs/
     ├── README.md (main index)
     ├── GENERATION_SUMMARY.md (generation report)
     ├── INDEX.md (file reference)
     ├── database/ (2 guides)
     ├── frontend/ (1 guide)
     ├── backend/ (1 guide)
     ├── config/ (1 guide)
     ├── testing/ (2 guides)
     └── deployment/ (6 guides)

 Next Steps:
  1. cd output/my-money-plan
  2. npm install
  3. cp .env.example .env
  4. npx prisma migrate dev
  5. npm run dev

 Documentation: docs/README.md
 Your app: http://localhost:3000

════════════════════════════════════════════════
```

## [!] Error Handling

### Agent Failure

If any agent fails:
```
1. Show error message with details
2. Save checkpoint at last successful phase
3. Offer options:
   [Interactive]
   - Retry this phase
   - Skip this phase
   - Stop and resume later
   - Abort generation

   [Auto]
   - Stop execution
   - Save checkpoint
   - Report error
```

### Resume from Checkpoint

If checkpoint exists:
```
Detected incomplete generation!

Last checkpoint:
  - Project: my-money-plan
  - Completed: Phase 1-3
  - Last phase: Database
  - Saved: 2025-12-25 11:45:23

Resume from Phase 4? (yes/no)
```

##  Key Principles

### Interactive Mode (Default)
- User approves each phase
- Can modify outputs between phases
- Can stop and resume anytime
- Full transparency

### Auto Mode
- Fast, unattended execution
- Good for tested specs
- Still saves checkpoints
- Can be interrupted

### Sequential Mode (Default)
- Safer, easier to debug
- Good for first generation
- Clear progress tracking
- Lower complexity

### Parallel Mode
- 50% faster execution
- Good for stable specs
- Requires more resources
- Best with auto mode

## 🔍 Validation

Before proceeding:
1. Validate spec file exists
2. Check .temp/ directory writable
3. Check output/ directory writable
4. If --resume, validate checkpoint file

## [Fast] Performance

Estimated times:
- Sequential: 8-10 minutes (10 phases)
- Parallel: 4-5 minutes (Phase 3-8 parallel)
- Overhead per agent: ~1-2 seconds
- Parallel speedup: ~50%

Phase duration tracking:
- Each phase duration is recorded in checkpoint
- Total duration calculated at the end
- Displayed in final summary report

## 📝 Notes

- Sub-agents run in independent contexts
- Agents use skills for actual work
- This command handles orchestration only
- Checkpoints enable crash recovery
- Parallel mode is opt-in for safety

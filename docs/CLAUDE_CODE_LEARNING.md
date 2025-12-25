# Claude Code 학습 노트

> SDD 프로젝트를 통해 배우는 AI 도구 활용법 및 베스트 프랙티스

**작성 시작**: 2025-12-23
**프로젝트**: SDD System (Spec-Driven Development)
**목적**: AI 도구 활용 역량 향상 및 실전 패턴 수집

---

## [목차] 목차

1. [Claude Code 개요](#claude-code-개요)
2. [Skills (스킬)](#skills-스킬)
3. [Agents (에이전트)](#agents-에이전트)
4. [Slash Commands (슬래시 명령어)](#slash-commands-슬래시-명령어)
5. [조합 패턴 및 선택 가이드](#조합-패턴-및-선택-가이드)
6. [MCP & Hooks](#mcp--hooks)
7. [실전 패턴 및 베스트 프랙티스](#실전-패턴-및-베스트-프랙티스)
8. [학습 과정 기록](#학습-과정-기록)

---

## Claude Code 개요

### Claude Code란?

Claude Code는 Anthropic의 AI 어시스턴트 Claude를 CLI 환경에서 사용할 수 있게 해주는 도구입니다.

**핵심 특징**:
- **대화형 개발**: AI와 대화하며 코드 작성, 리팩토링, 디버깅
- **컨텍스트 유지**: 프로젝트 전체를 이해하고 작업
- **도구 통합**: 파일 시스템, Git, 외부 API 등과 연동
- **확장 가능**: Skills, Agents, MCP로 기능 확장

### 설치 및 기본 사용법

```bash
# 설치
npm install -g @anthropic-ai/claude-code

# 초기 설정
claude init

# 실행
claude

# 모델 선택
claude --model sonnet  # 또는 opus, haiku
```

---

## Skills (스킬)

### Skills란?

Skills는 **재사용 가능한 작업 패키지**입니다. Claude가 자동으로 발견하고 실행할 수 있는 구조화된 기능입니다.

**핵심 개념**:
- **자동 발견**: Claude가 요청을 분석해 적절한 Skill 선택
- **모듈화**: 복잡한 작업을 독립적인 단위로 분리
- **재사용성**: 여러 프로젝트에서 공유 가능
- **메인 컨텍스트**: 사용자와 대화 가능

### Skills 파일 구조

```
.claude/skills/
├── simple-skill.md                 # 단순한 Skill
└── complex-skill/                  # 복잡한 Skill
    ├── SKILL.md
    ├── reference.md
    └── scripts/
```

### SKILL.md 형식

```yaml
---
name: skill-name
description: When to use this skill and what it does
allowed-tools: Read, Grep, Glob, Bash
model: sonnet
---

# Skill Name

## Instructions

1. First step
2. Second step
3. Third step
```

### [실전] SDD 프로젝트 실전 예시

#### 우리가 만든 Skills

```
.claude/skills/
├── generate.md       # 메인 오케스트레이터
├── parse.md          # Spec 파싱
├── architecture.md   # 아키텍처 설계
├── database.md       # DB 스키마 생성
├── frontend.md       # 프론트엔드 생성
├── backend.md        # 백엔드 생성
├── config.md         # 설정 파일 생성
├── testing.md        # 테스트 생성
├── deployment.md     # 배포 설정 생성
└── fix.md            # 에러 수정
```

### [O] Skills 베스트 프랙티스

#### 1. Description 작성법

**핵심 원칙**:
- 무엇을 하는지 (What)
- 언제 사용하는지 (When)
- 구체적인 키워드 포함 (Keywords)

```yaml
# [X] 나쁜 예시
description: Helps with files

# [O] 좋은 예시
description: Parse markdown specification files into structured JSON. Use when converting app specs, analyzing requirements, or preparing data for code generation.
```

#### 2. 단일 책임 원칙

```yaml
# [X] 나쁜 예시 (너무 많은 기능)
name: app-builder
description: Build entire app including frontend, backend, database, tests, and deployment

# [O] 좋은 예시 (하나의 명확한 역할)
name: frontend-generator
description: Generate React/Next.js components and pages from architecture specification
```

#### 3. 체계적인 지침 작성

```markdown
## Instructions

### Input
- 무엇을 입력받는지
- 어디서 읽는지

### Process
1. 첫 번째 단계 (구체적으로)
2. 두 번째 단계 (예시 포함)
3. 세 번째 단계 (주의사항)

### Output
- 무엇을 생성하는지
- 어디에 저장하는지
- 형식은 무엇인지
```

---

## Agents (에이전트)

### Agents란?

Agents는 **특정 작업에 특화된 독립적인 AI 어시스턴트**입니다. 별도의 컨텍스트 윈도우에서 작동하며, 특정 도구와 프롬프트로 구성됩니다.

**Skills vs Agents 비교**:

| 특징 | Skills | Agents |
|------|--------|--------|
| **실행 방식** | Claude가 자동 발견 | 명시적 호출 또는 위임 |
| **컨텍스트** | 메인 대화와 공유 | 독립적인 컨텍스트 |
| **인터랙션** | 사용자와 대화 가능 [O] | 사용자와 대화 불가 [X] |
| **용도** | 재사용 가능한 작업 흐름 | 전문화된 작업 처리 |

### [주의] Sub Agent의 중요한 제약사항

**Sub Agent는 사용자와 직접 인터랙션이 불가능합니다.**

#### Sub Agent의 동작 방식

Parent-Delegate 패턴으로 작동합니다:

```
User ←→ Claude Code (메인 Agent)
             ↓
        Sub Agent (백그라운드 작업)
             ↓
        Claude Code ←→ User
```

#### 주요 특징

1. **직접 대화 불가**: `AskUserQuestion` 같은 도구를 사용할 수 없습니다
2. **결과만 반환**: 작업을 완료하고 결과를 메인 Agent에게 전달
3. **독립된 컨텍스트**: 메인 대화와 분리된 별도의 컨텍스트에서 작동

#### 언제 Sub Agent를 사용할까?

**[O] Sub Agent 적합**:
- 독립적으로 완료 가능한 작업 (코드 분석, 파일 탐색, 테스트 실행)
- 사용자 입력 없이 판단 가능
- 결과를 메인 Agent가 전달하면 됨

**[X] Sub Agent 부적합**:
- 사용자 선택이 필요한 작업
- 중간에 확인이 필요한 작업
- 대화형 인터랙션이 필요한 작업

### Agent 설정하기

```yaml
# .claude/agents/code-reviewer.md
---
name: code-reviewer
description: Expert code review for quality and security
tools: Read, Grep, Glob
model: sonnet
---

You are a senior code reviewer specializing in:
- Code clarity and maintainability
- Security vulnerabilities
- Performance optimization
- Test coverage

## Review Process

1. Read the code - Understand context and purpose
2. Check for issues
3. Provide feedback with severity levels
4. Suggest tests if coverage is lacking
```

### [O] Agents 베스트 프랙티스

#### 1. 명확한 역할 정의

```yaml
# [X] 나쁜 예시
description: Helps with code

# [O] 좋은 예시
description: Security-focused code reviewer. Identifies vulnerabilities, validates input sanitization, checks authentication/authorization.
```

#### 2. 적절한 도구 제한

```yaml
# Code Reviewer (읽기만)
tools: Read, Grep, Glob

# Bug Fixer (읽기 + 수정)
tools: Read, Edit, Grep

# Test Runner (읽기 + 실행)
tools: Read, Bash, Grep
```

#### 3. 모델 선택 전략

```yaml
# 복잡한 추론 필요 (Code Review, Architecture Design)
model: sonnet

# 빠른 검색/분석 (Explore, Simple Search)
model: haiku

# 최고 품질 필요 (Critical Code Generation)
model: opus
```

---

## Slash Commands (슬래시 명령어)

### Slash Commands란?

`/` 로 시작하는 **명시적 명령어**입니다. Skills와 달리 자동 발견되지 않으며, 사용자가 직접 호출합니다.

**Skills vs Slash Commands**:

| 특징 | Skills | Slash Commands |
|------|--------|----------------|
| **호출 방식** | 자동 발견 | 명시적 호출 (`/cmd`) |
| **복잡도** | 복잡한 작업 가능 | 간단한 작업 권장 |
| **파일 구조** | 디렉토리 + 여러 파일 | 단일 마크다운 파일 |
| **용도** | 재사용 작업 흐름 | 자주 쓰는 프롬프트 |

### Custom Slash Commands 만들기

```bash
# .claude/commands/optimize.md
---
description: Analyze code for performance issues
model: sonnet
---

# Performance Analysis

Analyze the provided code for:
- Time complexity issues
- Memory leaks
- Unnecessary re-renders (React)
- Database query optimization

Provide specific recommendations with examples.
```

**사용**:
```bash
> /optimize
# Claude가 최근 변경된 코드를 분석
```

### [O] Slash Commands 베스트 프랙티스

#### 언제 Slash Command를 사용할까?

**[O] Slash Command 사용**:
- 자주 사용하는 간단한 프롬프트
- 1-2단계로 완료되는 작업
- 팀 전체가 공유하는 표준 워크플로우

**[O] Skills 사용**:
- 복잡한 다단계 작업
- 여러 파일/스크립트 필요
- 자동 발견이 필요한 경우

---

## 조합 패턴 및 선택 가이드

### [패턴] 조합 패턴

각 개념은 독립적으로도 사용되지만, 조합하면 더 강력합니다.

#### 패턴 1: Command → Sub Agent

```markdown
# .claude/commands/review-security.md
---
description: Security review using specialized subagent
---

Use the code-reviewer subagent to check this code for:
- Security vulnerabilities
- Authentication/authorization issues
- Exposed secrets
```

**장점**:
- 명시적 호출로 의도 명확
- Sub Agent의 전문성 활용
- 독립 컨텍스트로 안전한 실행

#### 패턴 2: Command → Skills

```markdown
# .claude/commands/process-pdf.md
---
description: Use PDF processing skill
---

Use the pdf-processing skill to analyze the provided PDF
and extract all form fields.
```

**장점**:
- Command로 워크플로우 명확히
- Skills의 복잡한 로직 재사용
- 팀 표준화 용이

#### 패턴 3: Skills + Sub Agents

```markdown
# .claude/skills/generate.md
---
name: generate
description: Full application generation pipeline
---

1. Parse spec using `parse` skill
2. Design architecture using `architecture` skill
3. Use `code-generator` sub agent to generate code
4. Use `test-runner` sub agent to run tests
```

**장점**:
- 복잡한 파이프라인 구성
- 각 단계의 독립성 보장
- 병렬 실행 가능

### [실전] 상황별 선택 가이드

#### [O] Skills를 사용하세요

**상황**:
- 복잡한 다단계 작업 (파일 파싱, 코드 생성, 변환)
- 자주 반복되는 워크플로우
- 팀이 공유해야 하는 프로세스
- 자동으로 발견되길 원할 때

**예시**:
```bash
> Parse the spec file into JSON
# Claude가 자동으로 parse skill 실행
```

#### [O] Sub Agents를 사용하세요

**상황**:
- 전문화된 독립 작업 (코드 리뷰, 보안 검사, 테스트 실행)
- 사용자 입력 없이 자율적으로 완료 가능
- 메인 대화와 분리하고 싶을 때
- 병렬 실행이 필요할 때

**예시**:
```bash
> Use the code-reviewer agent to check this code
# Sub Agent가 독립 컨텍스트에서 리뷰
```

**[X] 적합하지 않은 경우**:
- 사용자 선택이 필요 (AskUserQuestion 불가)
- 중간 확인이 필요
- 대화형 인터랙션 필요

#### [O] Slash Commands를 사용하세요

**상황**:
- 간단하고 자주 쓰는 프롬프트
- 1-2단계로 완료되는 작업
- 명시적 호출이 더 명확할 때

**예시**:
```bash
> /quick-test
# 명시적으로 테스트 실행
```

### [목차] 선택 체크리스트

1. **자동 발견이 필요한가?**
   - YES → Skills
   - NO → Command 또는 Sub Agent

2. **사용자 인터랙션이 필요한가?**
   - YES → Skills 또는 Command
   - NO → Sub Agent

3. **복잡한 다단계 작업인가?**
   - YES → Skills
   - NO → Command

4. **병렬 실행이 필요한가?**
   - YES → Sub Agents
   - NO → Skills

5. **전문성이 필요한가?**
   - YES → Sub Agent
   - NO → Skills 또는 Command

---

## MCP & Hooks

### MCP (Model Context Protocol)

외부 시스템과 Claude를 연결하는 표준 프로토콜입니다.

**기본 사용법**:
```bash
# HTTP 원격 서버
claude mcp add --transport http github https://api.github.com/mcp/

# 확인
claude mcp list
```

**가능한 것들**: GitHub, 데이터베이스, Slack, Notion, Email 등

> 상세 내용은 [공식 문서](https://code.claude.com/docs/en/mcp.md) 참조

### Hooks

특정 시점에 자동으로 실행되는 스크립트입니다.

**주요 이벤트**:
- `PreToolUse` - 도구 사용 전
- `PostToolUse` - 도구 사용 후
- `PermissionRequest` - 권한 요청 시

**예시**:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$file\""
          }
        ]
      }
    ]
  }
}
```

> 상세 내용은 [공식 문서](https://code.claude.com/docs/en/hooks-guide.md) 참조

---

## 실전 패턴 및 베스트 프랙티스

### 패턴 1: 파이프라인 패턴 (SDD 프로젝트)

**구조**:
```
오케스트레이터 Skill (generate)
  ↓
Phase 1 Skill (parse)
  ↓
Phase 2 Skill (architecture)
  ↓
Phase 3-8 Skills (병렬 가능)
  ↓
Phase 9 Skill (fix)
```

**장점**:
- 각 단계가 독립적
- 실패 시 특정 단계부터 재시작 가능
- 병렬 실행 가능

### 패턴 2: 검토-수정 패턴

**구조**:
```
1. Code Generator Skill/Agent
2. Code Reviewer Agent
3. Fixer Agent (필요시)
```

### 베스트 프랙티스 체크리스트

#### Skills 작성 시
- [ ] Description이 구체적이고 키워드 풍부
- [ ] 단일 책임 원칙 준수
- [ ] 입력/출력 명확히 정의
- [ ] 에러 처리 포함

#### Agents 설정 시
- [ ] 역할이 명확
- [ ] 도구 제한 적절
- [ ] 모델 선택 최적화

#### Slash Commands 작성 시
- [ ] 간단하고 직관적
- [ ] 인자 힌트 제공
- [ ] 자주 사용하는 작업만

### 비용 최적화 전략

```yaml
# 모델 선택
haiku: 간단한 검색/분석 (저렴, 빠름)
sonnet: 일반적인 코드 작업 (균형)
opus: 복잡한 아키텍처/중요 코드 (최고 품질)
```

---

## 학습 과정 기록

### 2025-12-23: Skills 기반 시스템 구현

#### 실행 내용
- 10개 Skills 구현 (generate 외 9개)
- 파이프라인 패턴 적용
- .claude/skills/ 디렉토리 구성

#### 배운 점
**[O] 성공한 것**:
- Skills로 복잡한 파이프라인 구조화
- 각 Phase를 독립적인 Skill로 분리
- 재사용 가능한 모듈 생성

---

### 2025-12-25: 개념 명확화 및 시스템 구조 이해

#### 실행 내용

1. **Skills, Sub Agents, Commands 차이점 명확화**
   - Sub Agent는 사용자 인터랙션 불가 (가장 중요한 제약)
   - Skills와 Commands는 메인 컨텍스트에서 작동
   - 각 도구의 적합한 사용 시나리오 정리

2. **SDD 시스템 구조 파악**
   - **이중 구조 발견**: lib (API 방식) + .claude/skills (Skills 방식)
   - CLI 방식 (npm run generate): lib/agents/ 사용 (TypeScript)
   - Claude Code 방식: .claude/skills/ 사용 (Markdown)

3. **문서 간소화 작업**
   - 1,777줄 → ~1,200줄 (30% 감축)
   - 중복 제거: 개념 비교 섹션 축소
   - 예시 간소화: 대표 예시만 유지
   - MCP/Hooks 축소: 핵심만 유지, 공식 문서 링크

#### 배운 점

**[O] 핵심 깨달음**:
- **Skills**: 메인 컨텍스트, 자동 발견, 인터랙션 가능
- **Sub Agents**: 독립 컨텍스트, 명시적 호출, 인터랙션 불가
- **Slash Commands**: 메인 컨텍스트, 명시적 호출, 인터랙션 가능

**[실전] SDD 시스템 현황**:
- **v1.0 (API 방식)**: `npm run generate` → `cli.ts` → `lib/agents/`
  - 완전 자동화, CI/CD 가능
  - API 크레딧 사용 (~$0.55/앱)
  - TypeScript로 타입 안전성

- **v2.0 (Skills 방식)**: Claude Code 대화 → `.claude/skills/`
  - 무료 (Max 플랜)
  - 대화형, 실시간 피드백
  - 즉시 수정 가능

- **하이브리드 전략**:
  - 개발/테스트: Skills 방식 (무료, 대화형)
  - 프로덕션/CI/CD: API 방식 (자동화)

**[팁] 오케스트레이터 설계**:
- Command로 진입점 만들기 (명확한 호출)
- Skill로 실제 로직 구현 (복잡한 워크플로우)
- 필요시 Sub Agent 조합 (독립적 전문 작업)

#### 다음 단계
- [ ] `/generate` Command 추가 고려 (진입점 명확화)
- [ ] Code Reviewer Sub Agent 추가 고려
- [ ] Test Runner Sub Agent 추가 고려
- [ ] my-money-plan.md 완전 생성 테스트

---

## 참고 자료

### 공식 문서
- [Claude Code Skills](https://code.claude.com/docs/en/skills.md)
- [Claude Code Agents](https://code.claude.com/docs/en/sub-agents.md)
- [Claude Code MCP](https://code.claude.com/docs/en/mcp.md)
- [Claude Code Hooks](https://code.claude.com/docs/en/hooks-guide.md)

### 커뮤니티
- [Claude Code GitHub](https://github.com/anthropics/claude-code)
- [Discord Community](https://discord.gg/anthropic)

### 관련 프로젝트
- [SDD System](../README.md) - 이 프로젝트
- [MCP Servers Registry](https://github.com/modelcontextprotocol/servers)

---

**작성일**: 2025-12-23
**최종 업데이트**: 2025-12-25
**작성자**: Learning in progress...
**버전**: 2.1 (간소화 및 현황 업데이트)

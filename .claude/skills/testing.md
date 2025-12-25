# SDD Testing - Test Suite Generator

**Description**: Generate comprehensive test files for components and APIs

**Usage**:
```bash
testing
```

## Instructions

Generate production-ready test suites for Next.js applications.

### Task

1. **Read Input**:
   - `.temp/parsed-spec.json` - for features
   - `.temp/architecture.json` - for file list
   - Scan `output/{project-name}/` for generated components and API routes

2. **Generate Tests**:
   - Component tests (`.test.tsx`) for UI components
   - API tests (`.test.ts`) for API routes
   - E2E tests (`e2e/*.spec.ts`) for critical user flows
   - Test configuration (`vitest.config.ts`, `playwright.config.ts`)

3. **Save to** `output/{project-name}/` directory

### Test Stack

- **Component & API**: Vitest + React Testing Library
- **E2E**: Playwright
- **Assertions**: @testing-library/jest-dom

### Component Test Template

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click me</Button>)

    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('can be disabled', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### API Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { POST, GET } from './route'
import { prisma } from '@/lib/database/client'

vi.mock('@/lib/database/client')

describe('POST /api/users', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
    }

    vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

    const request = new Request('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', name: 'Test User' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toEqual(mockUser)
  })

  it('returns 400 for invalid data', async () => {
    const request = new Request('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test'

test.describe('User Flow', () => {
  test('user can create a new todo', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel(/title/i).fill('Buy milk')
    await page.getByRole('button', { name: /add/i }).click()

    await expect(page.getByText('Buy milk')).toBeVisible()
  })
})
```

### Test Configuration

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Core Principles

1. **Test Behavior** - Test what users see and do, not implementation
2. **Accessibility-First** - Use accessible queries (getByRole, getByLabelText)
3. **Realistic Data** - Use real-world test data
4. **Comprehensive** - Cover happy paths, edge cases, and error cases

### Output

1. Generate all test files
2. Show summary:
   - Component tests created
   - API tests created
   - E2E tests created

# [Project Name]

> [Brief description]

## 프로젝트 정보

- **프로젝트명**: [Project Name]
- **목적**: [Purpose]
- **주요 사용자**: [Target Users]

## 핵심 기능

1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

## 데이터 모델

### User (사용자)
- id: string (UUID)
- email: string (unique)
- name: string
- createdAt: Date
- updatedAt: Date

## Enum 타입

### UserRole
- user
- admin

## API 엔드포인트

### User Management
- `GET /api/users` - Get all users
- `GET /api/users/[id]` - Get user by ID
- `POST /api/users` - Create new user
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

## 페이지 구성

### 1. Home (`/`)
**Layout**: Default

**Components**:
- Hero section
- Feature list

## 기술 스택

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL

## 초기 데이터 (Seed Data)

```typescript
// Example seed data
{
  email: "user@example.com",
  name: "Test User"
}
```

## 향후 로드맵

### Phase 1 (MVP)
- [Feature 1]
- [Feature 2]

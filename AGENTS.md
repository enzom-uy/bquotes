# AGENTS.md - Developer Guide for AI Assistants

## Project Overview

NestJS backend for a quotes management application with book/author integration and external OpenLibrary API.

**Stack:** NestJS 11 + TypeScript 5.9 + PostgreSQL + Drizzle ORM + Better Auth (Google OAuth) + Pino logging + Rate limiting + Cloudinary

---

## Commands

### Development

```bash
pnpm start:dev        # Hot-reload dev server (port 5000)
pnpm start:debug      # Debug mode with watch
pnpm build            # Build for production
pnpm start:prod       # Run production build
```

### Testing

```bash
pnpm test                          # Run all tests
pnpm test:watch                    # Watch mode
pnpm test -- --testNamePattern="QuoteService"  # Single test by name
pnpm test -- quote.service.spec   # Single file
pnpm test:e2e                      # E2E tests
pnpm test:cov                      # Coverage report
```

### Linting & Formatting

```bash
pnpm lint             # ESLint with auto-fix
pnpm format           # Prettier format
```

### Database

```bash
pnpm migrate          # Run migrations (drizzle-kit push)
```

### Docker

```bash
# Development (backend + PostgreSQL)
docker compose --profile dev up postgres  # Just PostgreSQL
pnpm start:dev                            # Backend locally (recommended)

# Production testing
docker compose --profile prod-local up    # With local PostgreSQL
docker compose --profile prod-external up # With external DB (Supabase)
```

---

## Code Style

### Formatting

- **Indentation:** 4 spaces
- **Quotes:** Single quotes
- **Semicolons:** NONE (semi: false)
- **Trailing commas:** Always (ES5)

### Import Order

```typescript
// 1. Node built-ins
import { readFile } from 'fs/promises'

// 2. External packages
import { Controller, Get, Inject } from '@nestjs/common'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'

// 3. Internal modules (use @/* alias)
import { DATABASE_CONNECTION } from '@/db/db.module'
import * as schema from '@drizzle/schema'
```

### Schema Location

- **Path:** `@drizzle/schema` → `drizzle/schema.ts`
- **Path:** `@drizzle/relations` → `drizzle/relations.ts`
- Contains all Drizzle ORM tables (user, Quotes, Books, Authors, Reports, etc.)

### Naming Conventions

- **Files:** kebab-case (`quote.service.ts`, `create-quote.dto.ts`)
- **Classes:** PascalCase + suffix (`QuoteService`, `CreateQuotesDto`)
- **Variables/functions:** camelCase (`userId`, `getUserQuotes`)
- **Constants:** UPPER_SNAKE_CASE (`DATABASE_CONNECTION`)
- **DB columns:** snake_case (`user_id`, `created_at`)

### TypeScript Patterns

```typescript
// ✅ Use satisfies for type-safe objects
const data satisfies Partial<typeof schema.Quotes.$inferInsert> = { text: 'quote' }

// ✅ Infer types from schema
type NewQuote = typeof schema.Quotes.$inferInsert
type Quote = typeof schema.Quotes.$inferSelect

// ✅ Destructure single results
const [user] = await db.select().from(schema.Users).where(...)

// ❌ Avoid 'any' - use 'unknown' + type guards
```

---

## Architecture Patterns

### Controller Pattern

```typescript
@Controller('quotes')
export class QuoteController {
    constructor(private readonly quoteService: QuoteService) {}

    @Get('user/:userId/list')
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    async getUserQuotes(@Param('userId') userId: string, @Res() res: Response) {
        const quotes = await this.quoteService.getUserQuotes(userId)
        return res.json(quotes)
    }
}
```

**Key points:**

- Use `@Res()` decorator for manual response handling
- Apply `@Throttle()` for rate limiting (default: 100/min, search: 20/min, external: 10/min)
- Place specific routes with literals BEFORE generic param routes

### Service Pattern

```typescript
@Injectable()
export class QuoteService {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: NodePgDatabase<typeof schema>,
        private readonly logger: PinoLogger,
    ) {}

    async getUserQuotes(userId: string, tx?: NodePgDatabase<typeof schema>) {
        const database = tx || this.db
        try {
            return await database
                .select({
                    id: schema.Quotes.id,
                    userId: schema.Quotes.user_id, // Transform snake_case to camelCase
                    createdAt: schema.Quotes.created_at,
                })
                .from(schema.Quotes)
                .where(eq(schema.Quotes.user_id, userId))
        } catch (error) {
            this.logger.error({ error }, 'Failed to fetch quotes')
            throw new InternalServerErrorException('Failed to fetch quotes')
        }
    }
}
```

**Key points:**

- Accept optional `tx` parameter for transaction support
- Transform DB columns (snake_case → camelCase) in SELECT
- Wrap DB operations in try-catch with logging
- Throw NestJS exceptions (`NotFoundException`, `BadRequestException`, `InternalServerErrorException`)

### DTO Pattern

```typescript
import { IsString, IsNotEmpty, IsUUID } from 'class-validator'

export class CreateQuotesDto {
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    texts: string[]

    @IsUUID()
    bookId: string
}
```

---

## Database Conventions (Drizzle)

- **Global DB Module:** `DbModule` is `@Global()`, inject with `DATABASE_CONNECTION` token
- **Transform columns:** Always map snake_case DB columns to camelCase in queries
- **Type-safe updates:** Use `satisfies` operator for partial updates
- **Transactions:** Pass `tx` parameter to services for atomic operations

---

## Error Handling

### In Services

1. Throw specific NestJS exceptions: `throw new NotFoundException('...')`
2. Catch generic errors, log them, and re-throw as `InternalServerErrorException`
3. Re-throw specific exceptions directly without wrapping

### In Controllers

- Manual validation for query params: `res.status(400).json({ message: '...' })`
- Let global exception filter handle service exceptions

---

## Common Pitfalls

### Route Conflicts

```typescript
// ❌ WRONG - generic route first
@Get(':quoteId')           // Catches everything
@Get('user/:userId/list')  // Never reached

// ✅ CORRECT - specific routes first
@Get('user/:userId/list')  // Specific
@Get(':quoteId')            // Generic last
```

### Missing Column Transforms

```typescript
// ❌ WRONG - returns snake_case
return await db.select().from(schema.Quotes)

// ✅ CORRECT - transform to camelCase
return await db
    .select({
        userId: schema.Quotes.user_id,
        createdAt: schema.Quotes.created_at,
    })
    .from(schema.Quotes)
```

---

## Environment Variables

Required (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection
- `BETTER_AUTH_SECRET` - Min 32 chars
- `BETTER_AUTH_URL` - Backend URL
- `FRONTEND_URL` - Frontend URL for CORS
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth secret
- `NODE_ENV` - development | production
- `PORT` - Default 5000
- `CLD_CLOUD_NAME` - Cloudinary cloud name
- `CLD_API_KEY` - Cloudinary API key
- `CLD_API_SECRET` - Cloudinary API secret

---

## Additional Notes

- **API prefix:** All routes prefixed with `/api`
- **Path alias:** `@/*` maps to `src/*`
- **Schema alias:** `@drizzle/*` maps to `drizzle/*`
- **Global validation:** Configured with `whitelist: true` in main.ts
- **CORS:** Supports credentials for cross-origin auth
- **Logging:** Pino with pretty-print in dev, JSON in prod
- **Docker:** Multi-stage production build with non-root user + healthcheck at `/api/health`

### Cloudinary Images

- **Upload:** `POST /api/images/upload` - accepts multiple images (`images` field)
- **Delete:** `DELETE /api/images/delete` - accepts array of publicIds
- **Folders:** `profile_pictures`, `covers`
- **Supported formats:** png, jpeg, webp
- **Max size:** 5MB per image
- **User profile update:** Profile images handled in `PATCH /api/user/profile`

### Reports

- **Create:** `POST /api/reports`
- **Get by user:** `GET /api/reports/user/:userId`
- **Get all:** `GET /api/reports/all`
- **Get by ID:** `GET /api/reports/:reportId`
- **Reasons:** `spam`, `profile_picture`, `user_name`, `other`

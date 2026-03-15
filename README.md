
# Quotes Backend API

REST API for managing book quotes, built with NestJS.

## Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL (Supabase)
- **ORM:** Drizzle
- **Authentication:** Better Auth (Google OAuth)
- **Image Storage:** Cloudinary
- **External API:** [OpenLibrary](https://openlibrary.org/) (book and author data)

## Features

### Quotes

- Create, read, update and delete quotes
- Mark quotes as favorites
- Public or private quotes
- Quote search
- Pagination

### Books

- Search books on OpenLibrary
- Save books to local database

### Authors

- Author information from OpenLibrary

### Users

- User profile (name, image)
- Profile update with Cloudinary images

### Images

- Upload images to Cloudinary
- Multiple images per request
- Image deletion
- Folders: `profile_pictures`, `covers`

## API Routes

### prefix: `/api`

| Method | Route                            | Description                   |
| ------ | -------------------------------- | ----------------------------- |
| POST   | `/quotes`                        | Create quotes                 |
| GET    | `/quotes/user/:userId/list`      | List user quotes              |
| GET    | `/quotes/user/:userId/count`     | Count user quotes             |
| GET    | `/quotes/user/:userId/search`    | Search quotes                 |
| GET    | `/quotes/user/:userId/favorites` | List favorite quotes          |
| DELETE | `/quotes/user/:userId`           | Delete quotes                 |
| PATCH  | `/quotes/user/:userId`           | Update quotes                 |
| GET    | `/quotes/:quoteId`               | Get quote by ID               |
| GET    | `/user`                          | Get user (by email or id)     |
| PATCH  | `/user/profile`                  | Update user profile           |
| POST   | `/images/upload`                 | Upload images to Cloudinary   |
| DELETE | `/images/delete`                 | Delete images from Cloudinary |
| GET    | `/book/search`                   | Search books on OpenLibrary   |
| GET    | `/openlibrary/search`            | General search on OpenLibrary |
| GET    | `/openlibrary/book/:olid`        | Get book by OLID              |
| GET    | `/openlibrary/author/:olid`      | Get author by OLID            |
| GET    | `/health`                        | Health check                  |

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Cloudinary
CLD_CLOUD_NAME=...
CLD_API_KEY=...
CLD_API_SECRET=...

# App
NODE_ENV=development
PORT=5000
```

## Development

```bash
# Install dependencies
pnpm install

# Start PostgreSQL in Docker
docker compose --profile dev up postgres

# Run migrations
pnpm migrate

# Start development server
pnpm start:dev
```

## Rate Limiting

- **Default:** 100 requests/minute
- **Search:** 20 requests/minute
- **External (OpenLibrary):** 10 requests/minute

## License

MIT

# YAIP — Yet Another Invoicing App

Source-available invoicing for freelancers and small businesses.

## Features

- **Invoicing** — Create, send, track, and download invoices as PDF
- **Quotes** — Create quotes and convert them to invoices with one click
- **Contacts** — Manage your customer database
- **Dashboard** — Financial overview with stats and recent activity
- **Organizations** — Multi-user support with roles (admin, member, accountant)
- **Self-hosted** — Deploy anywhere with Docker Compose

## Tech Stack

- [TanStack Start](https://tanstack.com/start) — Full-stack React framework
- [tRPC](https://trpc.io) — Type-safe API layer
- [Prisma](https://www.prisma.io) + PostgreSQL — Database ORM
- [Better Auth](https://www.better-auth.com) — Authentication with organization support
- [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS — UI components

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL (or Docker)

### Development Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/yourusername/yaip.git
   cd yaip
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy the env file and fill in values:

   ```bash
   cp .env.example .env
   ```

   Generate a secure auth secret:

   ```bash
   openssl rand -base64 32
   ```

4. Start PostgreSQL (or use an existing instance):

   ```bash
   docker run -d --name yaip-postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=yaip \
     -p 5432:5432 \
     postgres:16-alpine
   ```

5. Run database migrations:

   ```bash
   npx prisma migrate dev
   ```

6. Start the dev server:

   ```bash
   pnpm dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

### Self-Hosting with Docker

```bash
# Clone the repo
git clone https://github.com/yourusername/yaip.git
cd yaip

# Set your secrets
echo 'BETTER_AUTH_SECRET=your-secret-here' > .env

# Start
docker compose up -d
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## OSS and Cloud Split

- This repository is the OSS runtime baseline.
- Hosted cloud-specific modules (managed billing/webhooks/infra) belong to a private `yaip-cloud` repository.
- Ownership and constraints are documented in `docs/architecture/oss-cloud-boundary.md`.
- Release and cutover checklist is documented in `docs/releases/oss-v1-cutover.md`.

## Testing

Run the standard test suite:

```bash
pnpm test
```

Run the DB-backed invoice/quote smoke flow (create/edit/send/convert) against your local PostgreSQL configured in `.env`:

```bash
pnpm test:integration
```

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `BETTER_AUTH_SECRET` | Secret for auth (min 32 chars) | Yes |
| `BETTER_AUTH_URL` | App URL (e.g. `http://localhost:3000`) | Yes |
| `BETTER_AUTH_GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) | No |
| `BETTER_AUTH_GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional) | No |
| `BETTER_AUTH_GITHUB_CLIENT_ID` | GitHub OAuth client ID (optional) | No |
| `BETTER_AUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth client secret (optional) | No |
| `RESEND_API_KEY` | Resend API key for sending invoice/quote/invite emails | No |
| `FROM_EMAIL` | Sender email address used for outgoing emails | No |
| `CRON_SECRET` | Bearer token required by `/api/cron/mark-overdue` | Yes (prod) |

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

## License

[PolyForm Noncommercial 1.0.0](LICENSE)

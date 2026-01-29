# Xango Tests

Next.js app for testing Xango APIs. It includes a login flow, a single-model
query UI with environment selection, and a batch area placeholder.

## Features

- Home dashboard with navigation to Unique and Batch flows
- Unique model query form with environment + API selectors
- JSON response viewer and query parameter badges
- Login page with optional dev-bypass credentials (NextAuth)
- Theme toggle and shared header

## Routes

- `/` Home
- `/unique` Unique model query
- `/batch` Batch processing (placeholder)
- `/login` Login
- `/api/auth/*` NextAuth API routes

## Getting Started

Prereqs: Node.js 20+ and npm

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create a `.env.local` with the values below if you want to use the dev-bypass
login. The bypass only works when `NODE_ENV` is not `production`.

```bash
AUTH_DEV_BYPASS_ENABLED=true
AUTH_DEV_BYPASS_PASSWORD=your_password
AUTH_DEV_DEFAULT_EMAIL=dev@local
AUTH_DEV_DEFAULT_ROLE=dev
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
NODE_ENV=development
```

## Scripts

- `npm run dev` Start dev server
- `npm run build` Production build
- `npm start` Run production server
- `npm run lint` Lint

## Project Structure

- `app/` App Router routes and layouts
- `app/unique/` Unique query UI
- `app/batch/` Batch page (placeholder)
- `app/(auth)/login/` Login page
- `app/api/auth/[...nextauth]/` NextAuth config
- `components/` Shared UI and form components
- `components/ui/` UI primitives
- `lib/` Utilities

## Notes

The Unique query currently uses a mocked response. Replace
`handleApiTest` in `app/unique/page.tsx` to call a real API.

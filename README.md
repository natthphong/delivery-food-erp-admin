# Baan Admin Console

Modern admin console for BaanFoodie and ERP operations. Built with Next.js 15 (Pages Router), TypeScript, TailwindCSS, and Redux Toolkit.

## Quickstart

```bash
npm install
cp .env.local.example .env.local # fill with project secrets
npm run dev
```

### Required environment variables (`.env.local`)

```
NEXT_PUBLIC_ADMIN_JWT_SECRET=replace_with_long_random_value
NEXT_PUBLIC_ADMIN_JWT_EXPIRES_IN=900
NEXT_PUBLIC_ADMIN_REFRESH_EXPIRES_IN=604800
NEXT_PUBLIC_SUPABASE_ERP_URL=https://erp-project.supabase.co
NEXT_PUBLIC_SUPABASE_ERP_SERVICE_KEY=erp_service_role_key
NEXT_PUBLIC_SUPABASE_BAAN_URL=https://baan-project.supabase.co
NEXT_PUBLIC_SUPABASE_BAAN_SERVICE_KEY=baan_service_role_key
```

## Features

- Email/password admin login with bcrypt verification against Supabase ERP
- JWT access + refresh tokens with in-memory refresh registry
- Axios client with automatic token refresh and request replay
- Redux Toolkit store with auth slice persisted to `localStorage`
- Protected dashboard that queries `/api/admin/me` and shows admin profile
- Supabase service clients for ERP and BaanFoodie (server-side only)

## Scripts

- `npm run dev` – start the development server
- `npm run build` – build for production
- `npm run start` – run the production build
- `npm run lint` – run Next.js lint checks

## Folder structure

```
src/
├── pages/
│   ├── _app.tsx
│   ├── index.tsx
│   ├── login.tsx
│   └── api/admin/*.ts
├── store/
├── styles/
└── utils/
```

## Notes

- Refresh tokens are stored in-memory only; restart the server to invalidate all sessions.
- Supabase service keys are accessed exclusively on the server through API routes.

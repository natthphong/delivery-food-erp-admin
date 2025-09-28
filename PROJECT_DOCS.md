
# AGENT_PATTERN.md

> Visual, interaction, and code conventions for the **Baan Admin Console**.
> Stack: **Next.js 15 (pages router)** + **TypeScript** + **TailwindCSS**.
> Vibe: modern admin (clean, data-first, low-noise).

## Brand & Color

* Primary: `emerald` (actions, accents)
* Neutrals: `slate` (text, borders, surfaces)
* Danger/Warning: `rose` / `amber`

Examples

* Text: `text-slate-900/700/500`
* Borders: `border-slate-200`
* Surfaces: `bg-white`, `bg-slate-50`
* CTAs: `bg-emerald-600 hover:bg-emerald-500 text-white`
* Focus: `focus:ring-emerald-100 focus:border-emerald-400`

## Layout primitives

* App shell: static left **sidebar** (240px), top **toolbar**, content container `max-w-6xl mx-auto px-6 py-8`
* Cards: `bg-white border border-slate-200 rounded-2xl shadow-sm p-5`
* Tables: sticky header, zebra rows `odd:bg-slate-50`, cell padding `py-3 px-4`
* Forms: inputs `rounded-xl border border-slate-200 px-3 py-2`
* Buttons:

  * Primary: `bg-emerald-600 text-white rounded-xl px-4 py-2`
  * Secondary: `bg-white border border-slate-200 rounded-xl px-4 py-2`
  * Destructive: `bg-rose-600 text-white rounded-xl`
  * Disabled: `disabled:opacity-60 disabled:cursor-not-allowed`

## Motion & states

* Micro only (`hover:*`, `active:scale-[0.99]`), no big animations
* Loaders: inline spinner (`animate-spin h-4 w-4 border-2 border-slate-300 border-t-transparent rounded-full`)
* Empty & error states use neutral copy; never blank screens

## Accessibility

* Label every control; visible focus rings; `aria-pressed` for toggle/tab
* Color contrast: prefer `text-slate-800` on light surfaces

## Code style

* Presentational components only read props; data fetching & effects live in **pages/** containers
* Strong typing everywhere; use path aliases (`@components`, `@utils`, `@store`)
* Keep i18n ready: strings via `useI18n()` where applicable (EN first, TH later)

## Ready-made patterns

### Segmented tabs

* Container: `flex bg-slate-100 rounded-2xl p-1`
* Segment: active `bg-white shadow-sm`, inactive `text-slate-500`

### Filter bar

* Grid 1/1/2: search input, select(s), date-range, right-aligned actions

### Data table top bar

* Left: title + count chip
* Right: search, filters, “New”, export

### Alert blocks

* Success: `bg-emerald-50 border-emerald-200 text-emerald-700`
* Error: `bg-rose-50 border-rose-200 text-rose-700`
* Warning: `bg-amber-50 border-amber-200 text-amber-800`

---

# PROJECT.DOCS.md

> **Baan Admin Console** – admin/ERP-ish console to manage BaanFoodie data.
> Goals for v0: login flow (admins), shell layout, example protected page, 2 Supabase clients.

## 1) Overview

* **Product name:** Baan Admin Console
* **Stack:** Next.js 15 (pages router) + TS + Tailwind
* **State:** Redux Toolkit (auth slice only) + axios client
* **Auth:** Email/password **admin login** → server mints **JWT access/refresh** (no Firebase here)
* **Backends:** two Supabase projects

  * **Supabase ERP** – `SUPABASE_ERP_URL`, `SUPABASE_ERP_SERVICE_KEY`
  * **Supabase BaanFoodie** – `SUPABASE_BAAN_URL`, `SUPABASE_BAAN_SERVICE_KEY`
* **Timezone:** Asia/Bangkok (UTC+7)

## 2) Repo layout (target)

```
.
├── public/
├── src/
│   ├── components/
│   │   ├── LayoutAdmin/              # Sidebar, Topbar, Content
│   │   ├── forms/                    # Inputs, Selects
│   │   ├── tables/                   # DataTable, Toolbars
│   │   └── common/                   # Modal, Alert, Spinner
│   ├── pages/
│   │   ├── _app.tsx
│   │   ├── login.tsx                 # Admin login page
│   │   ├── index.tsx                 # Protected dashboard placeholder
│   │   └── api/
│   │       └── admin/
│   │           ├── login.ts          # POST (issue tokens)
│   │           ├── refresh-token.ts  # POST (rotate refresh)
│   │           └── me.ts             # GET (whoami)
│   ├── store/
│   │   ├── authSlice.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── apiClient.ts              # axios + refresh
│   │   ├── jwt.ts                    # sign/verify, in-memory refresh registry (dev)
│   │   ├── supabaseErp.ts            # ERP server client
│   │   ├── supabaseBaan.ts           # BaanFoodie server client
│   │   ├── i18n.ts                   # (stub)
│   │   └── logger.ts
│   └── styles/
│       └── globals.css
├── tailwind.config.js
├── postcss.config.js
├── next.config.ts
├── tsconfig.json
└── .env.local (see below)
```

## 3) Environment

Create `.env.local`:

```env
# Admin JWT
NEXT_PUBLIC_ADMIN_JWT_SECRET=replace_with_long_random_value
NEXT_PUBLIC_ADMIN_JWT_EXPIRES_IN=900
NEXT_PUBLIC_ADMIN_REFRESH_EXPIRES_IN=604800

# Supabase ERP
NEXT_PUBLIC_SUPABASE_ERP_URL=https://erp-project.supabase.co
NEXT_PUBLIC_SUPABASE_ERP_SERVICE_KEY=erp_service_role_key

# Supabase BaanFoodie
NEXT_PUBLIC_SUPABASE_BAAN_URL=https://baan-project.supabase.co
NEXT_PUBLIC_SUPABASE_BAAN_SERVICE_KEY=baan_service_role_key
```

## 4) Auth model (admin)

* **/api/admin/login**
  Request `{ email, password }` (v0: check against a Supabase ERP table `admin_user` or env-only seed).
  Response: `{ accessToken, refreshToken, admin: { id, email, name, roles } }`

* **Tokens**

  * Access: short-lived JWT (HS256) signed with `ADMIN_JWT_SECRET`
  * Refresh: random opaque, stored in an in-memory map (dev) with rotation

* **Client**

  * Redux: `{ accessToken, refreshToken, admin }`
  * axios interceptor adds `Authorization: Bearer <access>`; on 401, calls `/api/admin/refresh-token` once.

## 5) Minimal DB (ERP side)

Create a table (in **Supabase ERP**) to store admins:

```sql
create table if not exists admin_user (
  id bigserial primary key,
  email text unique not null,
  password_hash text not null,
  name text,
  roles text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

> v0: seed a single admin; hashing can be `bcryptjs`.

## 6) Initial pages & APIs (v0 scope)

* `/login`

  * Email + Password
  * On submit → POST `/api/admin/login`
  * On success → save tokens to Redux/localStorage, redirect `/`
* `/` (Dashboard placeholder)

  * Renders inside admin layout (sidebar/topbar)
  * Protected by client guard (hydrate tokens first)
* APIs

  * `POST /api/admin/login`
  * `POST /api/admin/refresh-token`
  * `GET /api/admin/me`

## 7) Example code (snippets)

### `src/utils/jwt.ts` (dev-grade)

```ts
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

type AdminPayload = { adminId: number; email: string; roles: string[] };

const refreshStore = new Map<string, AdminPayload>(); // dev only

export function signAccessToken(payload: AdminPayload) {
  const secret = process.env.ADMIN_JWT_SECRET!;
  const exp = Number(process.env.ADMIN_JWT_EXPIRES_IN ?? 900);
  return jwt.sign(payload, secret, { algorithm: "HS256", expiresIn: exp });
}

export function verifyAccessToken(token: string): AdminPayload {
  const secret = process.env.ADMIN_JWT_SECRET!;
  return jwt.verify(token, secret) as AdminPayload;
}

export function mintRefreshToken(payload: AdminPayload) {
  const token = randomBytes(48).toString("hex");
  refreshStore.set(token, payload);
  return token;
}

export function rotateRefreshToken(oldToken: string) {
  const payload = refreshStore.get(oldToken);
  if (!payload) throw new Error("INVALID_REFRESH");
  refreshStore.delete(oldToken);
  const next = mintRefreshToken(payload);
  return { payload, refreshToken: next };
}
```

### `src/pages/api/admin/login.ts`

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { signAccessToken, mintRefreshToken } from "@/utils/jwt";
import { getErpClient } from "@/utils/supabaseErp";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ code: "METHOD_NOT_ALLOWED" });
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ code: "BAD_REQUEST", message: "Missing email/password" });

  const supa = getErpClient();
  const { data, error } = await supa.from("admin_user").select("*").eq("email", email).maybeSingle();
  if (error || !data) return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, data.password_hash);
  if (!ok) return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid credentials" });

  const payload = { adminId: data.id, email: data.email, roles: data.roles ?? [] };
  const accessToken = signAccessToken(payload);
  const refreshToken = mintRefreshToken(payload);

  res.status(200).json({ code: "OK", body: { accessToken, refreshToken, admin: { id: data.id, email: data.email, name: data.name, roles: data.roles ?? [] } } });
}
```

### `src/pages/api/admin/refresh-token.ts`

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { rotateRefreshToken, signAccessToken } from "@/utils/jwt";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ code: "METHOD_NOT_ALLOWED" });
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) return res.status(400).json({ code: "BAD_REQUEST" });
  try {
    const { payload, refreshToken: next } = rotateRefreshToken(refreshToken);
    const accessToken = signAccessToken(payload);
    return res.status(200).json({ code: "OK", body: { accessToken, refreshToken: next } });
  } catch {
    return res.status(400).json({ code: "REFRESH_FAILED" });
  }
}
```

### `src/pages/api/admin/me.ts`

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyAccessToken } from "@/utils/jwt";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ code: "UNAUTHORIZED" });

  try {
    const payload = verifyAccessToken(token);
    return res.status(200).json({ code: "OK", body: { admin: payload } });
  } catch {
    return res.status(401).json({ code: "UNAUTHORIZED" });
  }
}
```

### `src/utils/supabaseErp.ts` & `supabaseBaan.ts`

```ts
import { createClient } from "@supabase/supabase-js";

export function getErpClient() {
  const url = process.env.SUPABASE_ERP_URL!;
  const key = process.env.SUPABASE_ERP_SERVICE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getBaanClient() {
  const url = process.env.SUPABASE_BAAN_URL!";
  const key = process.env.SUPABASE_BAAN_SERVICE_KEY!";
  return createClient(url, key, { auth: { persistSession: false } });
}
```

### `src/pages/login.tsx` (Tailwind page)

```tsx
import { useState } from "react";
import axios from "@/utils/apiClient";
import { useRouter } from "next/router";
import { useAppDispatch } from "@/store";
import { setTokens, setAdmin } from "@/store/authSlice";

export default function AdminLogin() {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const submit = async () => {
    setErr(null); setLoading(true);
    try {
      const r = await axios.post("/api/admin/login", { email, password });
      const { accessToken, refreshToken, admin } = r.data.body;
      dispatch(setTokens({ accessToken, refreshToken }));
      dispatch(setAdmin(admin));
      router.replace("/");
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Admin sign in</h1>
        <p className="text-sm text-slate-500 mt-1">Use your admin account</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-slate-500" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400" />
          </div>
          <div>
            <label className="text-xs text-slate-500" htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400" />
          </div>
          {err && <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm p-3">{err}</div>}
          <button onClick={submit} disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

> With these, you can log in against the `admin_user` table, and you have a working token refresh path.

## 8) Roadmap after v0

* RBAC guard (roles → route access)
* “Tenants” switcher (across ERP vs Baan contexts)
* Data grids (orders, branches, menus) read from **Baan Supabase**
* Audit log (write to ERP)
* Server-side pagination for big tables

---

# PROMPT_GENERATOR_PATTERN.md

> Paste this whole block to your codegen agent (e.g., “Codex”). It will scaffold the admin project exactly as above.

## System intent

You are generating a **Next.js 15 + TypeScript + Tailwind** Admin Console called **Baan Admin Console**. It authenticates admins via **email/password**, issues **JWT access+refresh**, and connects to **two Supabase projects** (ERP and BaanFoodie). Produce production-grade, lint-clean code.

## Constraints & style

* Pages Router (i.e., `src/pages/**`)
* Tailwind for all styling; follow `AGENT_PATTERN.md`
* Strong TypeScript; no `any` except typed third-party
* Interceptors for JWT refresh
* Minimal dependencies: `axios`, `@reduxjs/toolkit`, `react-redux`, `jsonwebtoken`, `bcryptjs`, `@supabase/supabase-js`
* No server secrets in client bundles

## Required outputs (files)

1. **Configs**

  * `tailwind.config.js`, `postcss.config.js`, `next.config.ts`, `tsconfig.json`
  * `src/styles/globals.css` (import Tailwind base/components/utilities)

2. **Utils**

  * `src/utils/apiClient.ts` – axios instance; adds Bearer; on 401 → `/api/admin/refresh-token`
  * `src/utils/jwt.ts` – sign/verify + in-memory refresh registry (as in PROJECT.DOCS.md)
  * `src/utils/supabaseErp.ts` and `src/utils/supabaseBaan.ts` – server clients (no session)
  * `src/utils/logger.ts` – safe logger

3. **Store**

  * `src/store/index.ts` – configureStore, typed hooks
  * `src/store/authSlice.ts` – `{ accessToken, refreshToken, admin }` + reducers: `setTokens`, `setAdmin`, `logout`

4. **Pages**

  * `src/pages/_app.tsx` – wrap Provider, import globals; simple route guard: if path ≠ `/login`, render only after hydration; if no tokens → redirect `/login`
  * `src/pages/login.tsx` – Tailwind login form (spec above)
  * `src/pages/index.tsx` – protected “Dashboard” (placeholder), shows admin email + roles

5. **APIs**

  * `src/pages/api/admin/login.ts` – validate admin_user, bcrypt compare, issue tokens
  * `src/pages/api/admin/refresh-token.ts` – rotate refresh
  * `src/pages/api/admin/me.ts` – verify access token

6. **Readmes**

  * `AGENT_PATTERN.md` and `PROJECT.DOCS.md` (use the versions supplied by the user)
  * `README.md` with quickstart:

    * `npm i`
    * fill `.env.local`
    * `npm run dev`

## Behaviors to implement

* **Login flow**

  * POST `/api/admin/login`
  * Save tokens to Redux + `localStorage`
  * Redirect `/`
* **Refresh flow**

  * axios interceptor queues requests, calls `/api/admin/refresh-token` once, rotates tokens, retries original request
  * On hard failure, purge tokens, redirect `/login`
* **WhoAmI**

  * On dashboard mount, GET `/api/admin/me`; show email + roles; handle 401 with logout


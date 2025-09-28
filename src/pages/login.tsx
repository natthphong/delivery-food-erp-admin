import { FormEvent, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import apiClient from "@/utils/apiClient";
import { useAppDispatch } from "@/store";
import { setAdmin, setTokens, type AdminSession } from "@/store/authSlice";
import { saveAuth } from "@/utils/authStorage";

type LoginApiResponse = {
  accessToken: string;
  refreshToken: string;
  admin: AdminSession;
};

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { data } = await apiClient.post<LoginApiResponse>("/api/admin/login", { email, password });
      dispatch(setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken }));
      dispatch(setAdmin(data.admin));
      saveAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, admin: data.admin });
      void router.replace("/");
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Unable to sign in with those credentials";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Baan Admin Console · Sign in</title>
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Baan Admin Console</p>
            <h1 className="text-3xl font-semibold text-slate-900">Sign in to continue</h1>
            <p className="text-sm text-slate-500">Use your admin email and password.</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                placeholder="admin@baanfoodie.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

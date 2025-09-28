import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store";
import { setMe, signOut } from "@/store/authSlice";
import type { AdminProfile, ApiErr, ApiOk } from "@/types/auth";

type MeEnvelope = (ApiOk<AdminProfile> | ApiErr) & Partial<{ body: AdminProfile }>;

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!accessToken) {
        dispatch(signOut());
        if (router.pathname !== "/login") {
          await router.replace("/login");
        }
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          dispatch(signOut());
          await router.replace("/login");
          return;
        }

        const payload = (await response.json()) as MeEnvelope;
        if (payload.code === "OK" && payload.body) {
          if (!cancelled) {
            dispatch(setMe({ admin: payload.body }));
            setReady(true);
          }
          return;
        }

        dispatch(signOut());
        await router.replace("/login");
      } catch {
        if (!cancelled) {
          dispatch(signOut());
          await router.replace("/login");
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [accessToken, dispatch, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
          Loading console…
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAuth;

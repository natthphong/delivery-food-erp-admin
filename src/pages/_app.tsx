import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { store, useAppDispatch, useAppSelector } from "@/store";
import { logout, setAdmin, setTokens } from "@/store/authSlice";
import { clearAuth, loadAuth, saveAuth } from "@/utils/authStorage";
import "@/styles/globals.css";

const AuthBootstrap = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken, refreshToken, admin } = useAppSelector((state) => state.auth);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const persisted = loadAuth();
    if (persisted) {
      dispatch(setTokens({ accessToken: persisted.accessToken, refreshToken: persisted.refreshToken }));
      if (persisted.admin) {
        dispatch(setAdmin(persisted.admin));
      }
    }
    setHydrated(true);
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!accessToken || !refreshToken) {
      if (router.pathname !== "/login") {
        dispatch(logout());
        clearAuth();
        void router.replace("/login");
      }
      return;
    }

    if (router.pathname === "/login") {
      void router.replace("/");
    }
  }, [accessToken, refreshToken, hydrated, router, dispatch]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (accessToken && refreshToken) {
      saveAuth({ accessToken, refreshToken, admin });
    } else {
      clearAuth();
    }
  }, [accessToken, refreshToken, admin, hydrated]);

  if (router.pathname !== "/login" && !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
          Bootstrapping session...
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <Provider store={store}>
      <AuthBootstrap>
        <Component {...pageProps} />
      </AuthBootstrap>
    </Provider>
  );
};

export default App;

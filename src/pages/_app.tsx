import type { AppProps } from "next/app";
import type { NextPage } from "next";
import { Provider } from "react-redux";
import { store } from "@/store";
import RequireAuth from "@/components/RequireAuth";
import "@/styles/globals.css";

type NextPageWithAuth = NextPage & { requireAuth?: boolean };

type AppPropsWithAuth = AppProps & {
  Component: NextPageWithAuth;
};

const App = ({ Component, pageProps }: AppPropsWithAuth) => {
  const content = Component.requireAuth === false ? (
    <Component {...pageProps} />
  ) : (
    <RequireAuth>
      <Component {...pageProps} />
    </RequireAuth>
  );

  return <Provider store={store}>{content}</Provider>;
};

export default App;

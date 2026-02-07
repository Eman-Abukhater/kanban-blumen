import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useState } from "react";
import Head from "next/head";

import { KanbanContextComponent } from "../context/KanbanContextComponent";
import { Hydrate, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OnlineUsersButton from "@/components/layout/OnlineUsersButton";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <QueryClientProvider client={queryClient}>
        <Hydrate state={(pageProps as any).dehydratedState}>
          <KanbanContextComponent>
            <Component {...pageProps} />
            <OnlineUsersButton />

            <ToastContainer
              position="top-center"
              autoClose={2000}
              pauseOnHover
              closeOnClick
              draggable
              hideProgressBar
              toastClassName="blumen-toast"
              bodyClassName="blumen-toast-body"
            />
          </KanbanContextComponent>
        </Hydrate>
      </QueryClientProvider>
    </>
  );
}
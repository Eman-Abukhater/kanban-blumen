import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useState } from "react";
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
    <QueryClientProvider client={queryClient}>
      <Hydrate state={(pageProps as any).dehydratedState}>
        <KanbanContextComponent>
          <Component {...pageProps} />
          <OnlineUsersButton />

          {/* ✅ ONE global toast container */}
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
  );
}

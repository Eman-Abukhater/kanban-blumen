import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useState } from "react";
import { KanbanContextComponent } from "../context/KanbanContextComponent";
import { Hydrate, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OnlineUsersButton from "@/components/layout/OnlineUsersButton";

export default function App({ Component, pageProps }: AppProps) {
  // ✅ create QueryClient once
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
        </KanbanContextComponent>
      </Hydrate>
    </QueryClientProvider>
  );
}

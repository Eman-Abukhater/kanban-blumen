// src/pages/kanbanList/[id].tsx

import { useEffect, useMemo, useState, useContext, useRef } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import Shell from "@/components/layout/Shell";
import Topbar from "@/components/layout/Topbar";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import KanbanBoardSkeleton from "@/components/layout/KanbanBoardSkeleton";
import KanbanContext from "@/context/kanbanContext";
import SectionHeader from "@/components/layout/SectionHeader";
import { fetchKanbanList } from "@/services/kanbanApi";

export default function GetKanbanList() {
  const { setKanbanListState, userInfo, handleSetUserInfo, signalRConnection } =
    useContext(KanbanContext);

  const [showSkeleton, setShowSkeleton] = useState(false);

  const router = useRouter();
  const { id } = router.query as { id: string };

  const fkboardid = useMemo(() => {
    if (!id) return null;
    const parsed = parseInt(id, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [id]);



  // ✅ Keep a stable reference to setKanbanListState
  const setKanbanListStateRef = useRef(setKanbanListState);
  useEffect(() => {
    setKanbanListStateRef.current = setKanbanListState;
  }, [setKanbanListState]);

  // -------- fetch kanban lists (React Query v4 signature) --------
  const queryKey = ["kanbanlist", fkboardid] as const;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<
    any[],
    Error
  >(
    queryKey,
    () => fetchKanbanList(fkboardid as number),
    {
      enabled: router.isReady && !!fkboardid,

      // ✅ keep cached data for fast UI
      keepPreviousData: true,

      // ✅ still refresh when you return so deleted items don't "come back"
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,

      staleTime: 60_000, // 1 min
      cacheTime: 30 * 60_000, // 30 min (v4)

      retry: 2,

      onSuccess: (lists) => {
        setKanbanListStateRef.current(Array.isArray(lists) ? lists : []);
      },

      onError: (e) => {
        toast.error(e.message || "Failed to load board", {
          position: toast.POSITION.TOP_CENTER,
        });
      },
    }
  );

  // -------- auth check + restore user from sessionStorage --------
  useEffect(() => {
    if (!router.isReady || !fkboardid) return;

    if (userInfo?.fkboardid === fkboardid) return;

    if (userInfo) {
      handleSetUserInfo({ ...userInfo, fkboardid });
      return;
    }

    const stored = window.sessionStorage.getItem("userData");
    if (!stored) {
      router.push(`/unauthorized`);
      return;
    }

    const storedUserInfo = JSON.parse(stored);
    handleSetUserInfo({ ...storedUserInfo, fkboardid });
  }, [router.isReady, fkboardid, userInfo, handleSetUserInfo, router]);

  // -------- SignalR messages (refresh on updates) --------
  useEffect(() => {
    if (!signalRConnection) return;

    const handleMessage = (message: string) => {
      toast.info(`${message}`, {
        position: toast.POSITION.TOP_CENTER,
      });
    };

    signalRConnection.on("ReceiveMessage", handleMessage);

    return () => {
      signalRConnection.off("ReceiveMessage", handleMessage);
    };
  }, [signalRConnection]);

  // ✅ loader should depend ONLY on true first load / navigation
  // show skeleton only when there is no data yet
  const shouldShowLoading =
    router.isReady && !!fkboardid && isLoading && !data;

  useEffect(() => {
    if (shouldShowLoading) {
      const t = setTimeout(() => setShowSkeleton(true), 150);
      return () => clearTimeout(t);
    }
    setShowSkeleton(false);
  }, [shouldShowLoading]);

  return (
    <Shell>
      <Topbar />
      <SectionHeader />

      <section className="mx-auto w-full px-4 py-6">
        {showSkeleton && <KanbanBoardSkeleton />}

        {!shouldShowLoading && isError && (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-500">
                Error loading board
              </h2>
              <p className="mt-2 text-slate600 dark:text-slate500_80">
                {error?.message}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 rounded-[10px] bg-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-ink"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!shouldShowLoading && !isError && (
          <>
            <KanbanBoard />
          </>
        )}
      </section>
    </Shell>
  );
}
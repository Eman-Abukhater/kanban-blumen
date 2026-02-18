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

  const [isNavigating, setIsNavigating] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const router = useRouter();
  const { id } = router.query as { id: string };

  const fkboardid = useMemo(() => {
    if (!id) return null;
    const parsed = parseInt(id, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [id]);

  // -------- route change loading state --------
  useEffect(() => {
    const handleRouteChangeStart = () => setIsNavigating(true);
    const handleRouteChangeComplete = () => setIsNavigating(false);
    const handleRouteChangeError = () => setIsNavigating(false);

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    router.events.on("routeChangeError", handleRouteChangeError);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
      router.events.off("routeChangeError", handleRouteChangeError);
    };
  }, [router.events]);

  // -------- fetch kanban lists (React Query) --------
  const { data, isLoading, isError, error, refetch, isFetched } = useQuery<
    any,
    Error | null
  >({
    queryKey: ["kanbanlist", fkboardid],
    queryFn: () => fetchKanbanList(fkboardid),
    enabled: router.isReady && !!fkboardid,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // -------- auth check + restore user from sessionStorage --------
  useEffect(() => {
    if (!router.isReady || !fkboardid) return;

    // ✅ STOP LOOP: If already has the right fkboardid, do nothing
    if (userInfo?.fkboardid === fkboardid) return;

    // If userInfo exists but missing/wrong fkboardid, fix it once
    if (userInfo) {
      handleSetUserInfo({ ...userInfo, fkboardid });
      return;
    }

    // Restore from session storage
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
      refetch();
      toast.info(`${message}`, {
        position: toast.POSITION.TOP_CENTER,
      });
    };

    signalRConnection.on("ReceiveMessage", handleMessage);

    return () => {
      signalRConnection.off("ReceiveMessage", handleMessage);
    };
  }, [signalRConnection, refetch]);

  // ✅ Keep a stable reference to setKanbanListState
  const setKanbanListStateRef = useRef(setKanbanListState);
  useEffect(() => {
    setKanbanListStateRef.current = setKanbanListState;
  }, [setKanbanListState]);

  // -------- when data arrives, push into context state --------
  // ✅ IMPORTANT: do NOT depend on setKanbanListState directly
  useEffect(() => {
    if (!isFetched || isError) return;
    setKanbanListStateRef.current(Array.isArray(data) ? data : []);
  }, [isFetched, isError, data]);

  // ✅ loader should depend ONLY on real loading/navigation
  const shouldShowLoading =
    isNavigating || (router.isReady && !!fkboardid && isLoading);

  // ✅ show skeleton only if loading lasts >150ms
  useEffect(() => {
    if (shouldShowLoading) {
      const t = setTimeout(() => setShowSkeleton(true), 150);
      return () => clearTimeout(t);
    }
    setShowSkeleton(false);
  }, [shouldShowLoading]);

  // ======================================================
  //                   RENDER
  // ======================================================
  return (
    <Shell>
      <Topbar />
      <SectionHeader />

      <section className="mx-auto w-full px-4 py-6">
        {/* ⏳ Skeleton only after 150ms */}
        {showSkeleton && <KanbanBoardSkeleton />}

        {/* ❌ Error state */}
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

        {/* ✅ Always render board when not loading & not error */}
        {!shouldShowLoading && !isError && <KanbanBoard />}
      </section>
    </Shell>
  );
}
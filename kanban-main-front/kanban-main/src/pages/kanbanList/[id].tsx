// src/pages/kanbanList/[id].tsx
export const getServerSideProps = async () => ({ props: {} });

import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { ToastContainer, toast } from "react-toastify";

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

  const [showContent, setShowContent] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const router = useRouter();
  const { id } = router.query as { id: string };

  let fkboardid: number | null = null;
  if (id !== null) {
    const parsedId = parseInt(id, 10);
    if (!isNaN(parsedId)) {
      fkboardid = parsedId;
    }
  }

  // -------- route change loading state --------
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsNavigating(true);
      setShowContent(false);
    };

    const handleRouteChangeComplete = () => {
      setIsNavigating(false);
    };

    const handleRouteChangeError = () => {
      setIsNavigating(false);
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    router.events.on("routeChangeError", handleRouteChangeError);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
      router.events.off("routeChangeError", handleRouteChangeError);
    };
  }, [router]);

  // -------- fetch kanban lists (React Query) --------
  const { data, isLoading, isError, error, refetch, isFetched } = useQuery<
    any,
    Error | null
  >({
    queryKey: ["kanbanlist", fkboardid],
    queryFn: () => fetchKanbanList(fkboardid),
    enabled: router.isReady && !!fkboardid,
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // -------- auth check + restore user from sessionStorage --------
  useEffect(() => {
    if (!router.isReady) return;

    const checkUserExist = async () => {
      if (!userInfo) {
        const storeddata = window.sessionStorage.getItem("userData");
        if (!storeddata) {
          router.push(`/unauthorized`);
          return;
        }
        const storedUserInfo = JSON.parse(storeddata);

        const updatedUserData = {
          ...storedUserInfo,
          fkboardid,
        };
        handleSetUserInfo(updatedUserData);
        return;
      }

      const updatedUserData = {
        ...userInfo,
        fkboardid,
      };
      handleSetUserInfo(updatedUserData);
    };

    checkUserExist();
  }, [router.isReady, fkboardid, userInfo, handleSetUserInfo, router]);

  // -------- SignalR messages (refresh on updates) --------
  useEffect(() => {
    if (!signalRConnection) return;

    const handleMessage = (message: string) => {
      refetch();
      toast.info(`${message}`, {
        position: toast.POSITION.TOP_RIGHT,
      });
    };

    signalRConnection.on("ReceiveMessage", handleMessage);

    return () => {
      signalRConnection.off("ReceiveMessage", handleMessage);
    };
  }, [signalRConnection, refetch]);

  // -------- when data arrives, push into context state --------
  useEffect(() => {
    if (isFetched && !isError && data) {
      setKanbanListState(Array.isArray(data) ? data : []);
    }
  }, [isFetched, isError, data, setKanbanListState]);

  // -------- decide when to reveal the real UI --------
  useEffect(() => {
    const shouldShowContent =
      router.isReady && userInfo && (isFetched || isError);

    if (shouldShowContent) {
      setShowContent(true);
    }
  }, [router.isReady, userInfo, isFetched, isError]);

  const shouldShowLoading = isNavigating || !showContent || isLoading;

  // ======================================================
  //                   RENDER
  // ======================================================
  return (
    <>
      {/* Full-page skeleton while loading (matches light/dark bg) */}
      {shouldShowLoading && (
        <div className="fixed inset-0 z-40 bg-[#F4F6F8] dark:bg-[#141A21]">
          <KanbanBoardSkeleton />
        </div>
      )}

      {/* Error state */}
      {!isNavigating && showContent && isError && (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">
              Error Loading Data
            </h2>
            <p className="mt-2 text-gray-600">{error?.message}</p>
            <button
              onClick={() => router.reload()}
              className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      {/* Main Kanban page */}
      {!isNavigating && showContent && data && (
        <Shell>
          <Topbar />

          {/* ⭐ Header = Kanban + breadcrumb (no search, no button) */}
          <SectionHeader />

          {/* Kanban board columns */}
          <section className="mx-auto max-w-[1120px] px-0 py-6">
            <div className="kanban-scroll overflow-x-auto pb-4">
              <KanbanBoard />
            </div>
          </section>

          <ToastContainer
            position="top-right"
            autoClose={4000}
            pauseOnHover
            closeOnClick
            draggable
            toastClassName="blumen-toast"
            bodyClassName="blumen-toast-body"
            progressClassName="blumen-toast-progress"
          />
        </Shell>
      )}
    </>
  );
}

import { MainLayout } from "../../components/layout/MainLayout";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { fetchKanbanList } from "../../services/kanbanApi";
import { useContext } from "react";
import KanbanContext from "../../context/kanbanContext";
import LoadingPage2 from "@/components/layout/LoadingPage2";
import KanbanBoardSkeleton from "@/components/layout/KanbanBoardSkeleton";
import { useQuery } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";

// Removed SSR prefetching to prevent hydration blink

export default function getKanbanList() {
  const {
    setKanbanListState,
    userInfo,
    handleSetUserInfo,
    signalRConnection,
    setSignalRConnection,
    setUsersOnline,
  } = useContext(KanbanContext);

  // Local state to control loading visibility
  const [showContent, setShowContent] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Get the 'id' parameter from the URL using useRouter and make it integer
  const router = useRouter();
  const { id } = router.query as { id: string };
  let fkboardid: number | null = null;

  if (id !== null) {
    const parsedId = parseInt(id, 10); // Assuming base 10
    if (!isNaN(parsedId)) {
      fkboardid = parsedId;
    }
  }

  // Handle client-side navigation loading state
  useEffect(() => {
    const handleRouteChangeStart = () => {
      console.log("🚀 Route change started - showing loading");
      setIsNavigating(true);
      setShowContent(false); // Immediately hide content
    };

    const handleRouteChangeComplete = () => {
      console.log("✅ Route change complete");
      setIsNavigating(false);
    };

    const handleRouteChangeError = () => {
      console.log("❌ Route change error");
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

  //react query - fetch as soon as router and boardid are ready (don't wait for userInfo)
  const { data, isLoading, isError, error, refetch, isFetched } = useQuery<
    any,
    Error | null
  >({
    queryKey: ["kanbanlist", fkboardid],
    queryFn: () => fetchKanbanList(fkboardid),
    enabled: router.isReady && !!fkboardid, // Removed userInfo dependency for faster loading
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Auth check - runs once on mount and restores userInfo from sessionStorage on refresh
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
        // Restore user info from sessionStorage instead of redirecting
        const updatedUserData = {
          ...storedUserInfo,
          fkboardid,
        };
        handleSetUserInfo(updatedUserData);
        return;
      }

      // Update fkboardid if userInfo already exists
      const updatedUserData = {
        ...userInfo,
        fkboardid,
      };

      handleSetUserInfo(updatedUserData);
    };

    checkUserExist();
  }, [router.isReady, fkboardid]);

  // SignalR connection check with delay (only show warning, not error)
  useEffect(() => {
    if (!userInfo || !router.isReady) return;

    const signalRTimeout = setTimeout(() => {
      if (!signalRConnection) {
        console.warn("SignalR connection not established yet");
      }
    }, 5000);

    return () => clearTimeout(signalRTimeout);
  }, [userInfo, signalRConnection, router.isReady]);

  // SignalR message listener
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

  // Handle data after it's fetched - just set the state
  useEffect(() => {
    if (isFetched && !isError && data) {
      // Default lists are now created when the board is created,
      // so we just display whatever data we get from the API
      setKanbanListState(Array.isArray(data) ? data : []);
    }
  }, [isFetched, isError, data]);

  // Instant loading - show content as soon as data is ready
  useEffect(() => {
    const shouldShowContent =
      router.isReady && userInfo && (isFetched || isError);

    if (shouldShowContent) {
      setShowContent(true);
      console.log("✅ Showing content immediately");
    }
  }, [router.isReady, userInfo, isFetched, isError]);

  // Single source of truth for showing loading
  const shouldShowLoading = isNavigating || !showContent || isLoading;

  return (
    <>
      {/* Show skeleton for kanban board during loading */}
      {shouldShowLoading && (
        <>
          <div className="fixed inset-0 z-40 bg-gray-50">
            <div className="flex h-screen flex-col">
              {/* Navbar skeleton */}
              <div className="h-16 border-b border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-48 animate-pulse rounded bg-gray-200"></div>
                  <div className="flex gap-4">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
                    <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>
              {/* Kanban board skeleton */}
              <KanbanBoardSkeleton />
            </div>
          </div>
        </>
      )}

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

      {!isNavigating && showContent && data && (
        <>
          <MainLayout />
          <ToastContainer />
        </>
      )}
    </>
  );
}

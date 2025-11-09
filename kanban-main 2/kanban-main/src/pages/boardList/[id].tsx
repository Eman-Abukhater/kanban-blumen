export const getServerSideProps: GetServerSideProps = async () => ({
  props: {},
});
import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { useState, useEffect, useMemo } from "react";
import AddEditBoardModal from "../../components/modal/AddEditBoardModal";
import { useRouter } from "next/router";
import {
  fetchInitialBoards,
  AddBoard,
  EditBoard,
  AddKanbanList,
} from "../../services/kanbanApi";
import { ToastContainer, toast } from "react-toastify";
import dynamic from "next/dynamic";
const LottieClient = dynamic(() => import("@/components/LottieClient"), {
  ssr: false,
});
import animation_space from "../../../public/animationTeam2.json";
import animationSettings from "../../../public/animationNote.json";
import KanbanContext from "../../context/kanbanContext";
import { useContext } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import LoadingPage2 from "@/components/layout/LoadingPage2";
import BoardCardSkeleton from "@/components/layout/BoardCardSkeleton";

export default function getBoardList() {
  const {
    userInfo,
    handleSetUserInfo,
    signalRConnection,
    setSignalRConnection,
    setUsersOnline,
  } = useContext(KanbanContext);

  const router = useRouter();

  // Wait for router, then coerce id -> number (fkpoid)
  const fkpoid = useMemo(() => {
    if (!router.isReady) return null as number | null;
    const raw = router.query.id;
    const val = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }, [router.isReady, router.query.id]);

  const [boards, setBoards] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [board, setBoard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Track navigation to hide content immediately
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsNavigating(true);
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

  // ---- Fetch boards (REAL API) ----
  const fetchData = async () => {
    if (fkpoid == null) return;
    try {
      setIsLoading(true);
      const res = await fetchInitialBoards(fkpoid);
      if (res?.status === 200) {
        setBoards(Array.isArray(res.data) ? res.data : []);
      } else {
        toast.error("Could not fetch the data.", {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    } catch (e: any) {
      toast.error(`Fetch error: ${e?.message ?? "unknown"}`, {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Auth + initial fetch + SignalR ----
  useEffect(() => {
    if (!router.isReady) return;

    // 1) Auth check - restore userInfo from sessionStorage on refresh
    const checkUserExist = async () => {
      if (!userInfo) {
        const stored = window.sessionStorage.getItem("userData");
        if (!stored) {
          router.push(`/unauthorized`);
          return;
        }
        const u = JSON.parse(stored);
        // Restore user info from sessionStorage instead of redirecting
        handleSetUserInfo(u);
        return;
      }
    };

    checkUserExist();

    // Only fetch data if we have userInfo
    if (userInfo) {
      fetchData();
    }
    // 2) SignalR setup (non-blocking - runs in background)
    if (!signalRConnection && userInfo) {
      const joinRoom = async (
        userid: string,
        fkpoidStr: string | null,
        userName: string
      ) => {
        try {
          console.log("🔌 Starting SignalR connection in background...");
          const connection = new HubConnectionBuilder()
            .withUrl("https://empoweringatt.ddns.net:4070/board")
            .configureLogging(LogLevel.Warning) // Reduce logging noise
            .build();
          connection.serverTimeoutInMilliseconds = 1800000;
          connection.keepAliveIntervalInMilliseconds = 1800000;

          // Non-blocking connection - don't await
          connection
            .start()
            .then(() => {
              console.log("✅ SignalR connected successfully");

              connection.on("UserInOutMsg", (message) => {
                toast.dark(`${message}`, { position: toast.POSITION.TOP_LEFT });
              });

              connection.on("UsersInBoard", (users) => {
                setUsersOnline(users);
              });

              connection
                .invoke("JoinBoardGroup", {
                  fkpoid: fkpoidStr ?? fkpoid?.toString(),
                  userid: userid?.toString(),
                  username: userName,
                  userPic: userInfo.userpic,
                })
                .catch((err) => {
                  console.warn("⚠️ Failed to join board group:", err);
                });

              setSignalRConnection(connection);
            })
            .catch((e) => {
              console.warn(
                "⚠️ SignalR connection failed (non-critical):",
                e.message || e
              );
              // Don't block UI if SignalR fails
            });
        } catch (e) {
          console.warn("⚠️ SignalR setup error (non-critical):", e);
        }
      };
      // Fire and forget - don't wait for SignalR
      joinRoom(userInfo.id, userInfo.fkpoid, userInfo.username);
    }

    // live update: refetch on add/edit
    if (signalRConnection) {
      const handler = async (_message: string) => {
        toast.info(`${_message}`, { position: toast.POSITION.TOP_RIGHT });
        await fetchData();
      };
      signalRConnection.on("addEditBoard", handler);
      return () => {
        signalRConnection.off("addEditBoard", handler);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, fkpoid, userInfo, signalRConnection]);

  const openEditModal = (b: any) => {
    setBoard(b);
    setIsModalOpen(true);
  };
  const closeEditModal = () => {
    setBoard(null);
    setIsModalOpen(false);
  };

  const handleEditTitle = async (newTitle: string, boardId: number) => {
    const res = await EditBoard(newTitle, boardId, userInfo.username);
    if (res?.status !== 200 || !res?.data) {
      toast.error("Failed to edit board.", {
        position: toast.POSITION.TOP_CENTER,
      });
      return;
    }
    // Update local state
    setBoards((prev) =>
      prev.map((b) => (b.boardId === boardId ? { ...b, title: newTitle } : b))
    );
    toast.success(`${res.data}`, { position: toast.POSITION.TOP_CENTER });
    closeEditModal();
  };

  const handleAddBoardClick = async (newTitle: string) => {
    console.log("🧩 userInfo when adding board:", userInfo);
    try {
      setIsCreatingBoard(true);

      // 1. Create the board
      const res = await AddBoard(
        newTitle,
        fkpoid,
        userInfo.id,
        userInfo.username
      );

      if (res?.status !== 200 || !res?.data) {
        toast.error("Failed to add board.", {
          position: toast.POSITION.TOP_CENTER,
        });
        return;
      }

      const newBoardId = res.data;

      // 2. Create default lists for the new board
      const defaultListTitles = ["To do", "In progress", "In review", "Done"];

      for (let i = 0; i < defaultListTitles.length; i++) {
        const title = defaultListTitles[i];
        try {
          await AddKanbanList(
            title,
            newBoardId,
            userInfo.username,
            userInfo.id,
            fkpoid
          );
          console.log(
            `✅ Created default list: "${title}" for board ${newBoardId}`
          );
        } catch (error) {
          console.error(`❌ Error creating default list "${title}":`, error);
        }
      }

      // 3. Update UI
      setBoards((prev) => [...prev, { boardId: newBoardId, title: newTitle }]);
      toast.success(`Board "${newTitle}" created with default lists!`, {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setIsCreatingBoard(false);
    }
  };

  return (
    <>
      {/* Hide content during navigation to prevent flash */}
      {!isNavigating && userInfo && (
        <div className="flex h-screen flex-col bg-gray-100">
          <div
            className="flex items-center justify-center bg-gray-100"
            style={{ marginTop: "-13px" }}
          >
            <div className="w-full max-w-md space-y-4 p-4">
              <div
                className="flex items-center justify-center bg-gray-100"
                style={{ height: "273px" }}
              >
                <LottieClient animationData={animation_space} loop />
              </div>
            </div>
          </div>

          <div
            className="flex items-center justify-center bg-gray-100"
            style={{ marginTop: "-33px" }}
          >
            <div className="w-full max-w-4xl space-y-4 p-4">
              <h1
                className="rounded-lg bg-gradient-to-r from-white to-blue-500 text-center text-3xl text-white shadow-lg"
                style={{ position: "relative" }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: "67px" }}
                >
                  <LottieClient animationData={animationSettings} loop />
                </div>
                <div className="btn-shine">
                  <span>
                    {userInfo?.projectTitle || `Project ${fkpoid ?? ""}`} -
                    Boards
                  </span>
                </div>
              </h1>

              {isLoading ? (
                // Show skeleton while loading boards
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <BoardCardSkeleton count={4} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {isCreatingBoard && <BoardCardSkeleton count={1} />}
                  {boards?.map((b: any, index: number) => (
                    <div
                      key={index}
                      className="relative flex items-center justify-between rounded-md bg-white p-4 shadow-md hover:shadow-lg"
                    >
                      <h2 className="truncate text-lg font-semibold">
                        <span className="block text-xs text-gray-500">
                          ID: {b.boardId}
                        </span>
                        {b.title}
                      </h2>

                      <div className="right-2 top-2 flex items-center space-x-3">
                        <button
                          className="rounded-full bg-yellow-500 p-2 text-white focus:outline-none hover:bg-yellow-600"
                          onClick={() => openEditModal(b)}
                        >
                          {/* pencil icon */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-6 w-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                            />
                          </svg>
                        </button>

                        <button
                          className="rounded-full bg-blue-500 p-2 text-white focus:outline-none hover:bg-blue-600"
                          onClick={() => {
                            // carry board context and navigate
                            handleSetUserInfo({
                              ...userInfo,
                              boardTitle: b.title,
                              fkboardid: b.boardId,
                            });
                            router.push(`/kanbanList/${b.boardId}`);
                          }}
                        >
                          {/* eye icon */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-6 w-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && boards?.length < 21 && (
                <button
                  className="fixed bottom-4 right-4 rounded-full bg-green-500 p-4 text-white focus:outline-none hover:bg-blue-600"
                  onClick={() => openEditModal("")}
                >
                  {/* plus icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-8 w-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              )}

              <AddEditBoardModal
                isOpen={isModalOpen}
                onClose={closeEditModal}
                handleEditTitle={(newTitle: string, boardId: number) =>
                  handleEditTitle(newTitle, boardId)
                }
                handleAddBoardClick={handleAddBoardClick}
                board={board}
              />
              <div style={{ marginBottom: "72px" }} />
            </div>
            <ToastContainer />
          </div>
        </div>
      )}
    </>
  );
}

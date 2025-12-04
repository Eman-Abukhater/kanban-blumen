// src/pages/boardList/[id].tsx
export const getServerSideProps = async () => ({ props: {} });

import type { GetServerSideProps } from "next";
import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

import Shell from "@/components/layout/Shell";
import Topbar from "@/components/layout/Topbar";
import BoardCard from "@/components/kanban/BoardCard";
import AddEditBoardModal from "@/components/modal/AddEditBoardModal";
import BoardCardSkeleton from "@/components/layout/BoardCardSkeleton";
import KanbanContext from "@/context/kanbanContext";
import SectionHeader from "@/components/layout/SectionHeader";

import {
  fetchInitialBoards,
  AddBoard,
  EditBoard,
  AddKanbanList,
} from "@/services/kanbanApi";

type ApiBoard = {
  boardId: number;
  title: string;
};

export default function BoardListPage() {
  const {
    userInfo,
    handleSetUserInfo,
    signalRConnection,
    setSignalRConnection,
    setUsersOnline,
  } = useContext(KanbanContext);

  const router = useRouter();

  // ----- project id (fkpoid) from route -----
  const fkpoid = useMemo(() => {
    if (!router.isReady) return null as number | null;
    const raw = router.query.id;
    const val = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }, [router.isReady, router.query.id]);

  // ----- state -----
  const [boards, setBoards] = useState<ApiBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<ApiBoard | null>(null);

  // ----- route change "flash" guard -----
  useEffect(() => {
    const handleStart = () => setIsNavigating(true);
    const handleDone = () => setIsNavigating(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleDone);
    router.events.on("routeChangeError", handleDone);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleDone);
      router.events.off("routeChangeError", handleDone);
    };
  }, [router]);

  // ----- fetch boards from backend -----
  const fetchData = async () => {
    if (fkpoid == null) return;
    try {
      setIsLoading(true);
      const res = await fetchInitialBoards(fkpoid);
      if (res?.status === 200) {
        const data = Array.isArray(res.data) ? res.data : [];
        setBoards(data as ApiBoard[]);
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

  // ----- auth check + initial fetch + SignalR -----
  useEffect(() => {
    if (!router.isReady) return;

    const checkUserExist = async () => {
      if (!userInfo) {
        const stored = window.sessionStorage.getItem("userData");
        if (!stored) {
          router.push(`/unauthorized`);
          return;
        }
        const u = JSON.parse(stored);
        handleSetUserInfo(u);
        return;
      }
    };

    checkUserExist();

    if (userInfo) {
      fetchData();
    }

    // SignalR connection (same logic as old file)
    if (!signalRConnection && userInfo) {
      const joinRoom = async (
        userid: string,
        fkpoidStr: string | null,
        userName: string
      ) => {
        try {
          const connection = new HubConnectionBuilder()
            .withUrl("https://empoweringatt.ddns.net:4070/board")
            .configureLogging(LogLevel.Warning)
            .build();

          connection.serverTimeoutInMilliseconds = 1800000;
          connection.keepAliveIntervalInMilliseconds = 1800000;

          connection
            .start()
            .then(() => {
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
                  console.warn("Failed to join board group:", err);
                });

              setSignalRConnection(connection);
            })
            .catch((e) => {
              console.warn(
                "SignalR connection failed (non-critical):",
                e.message || e
              );
            });
        } catch (e) {
          console.warn("SignalR setup error (non-critical):", e);
        }
      };

      joinRoom(userInfo.id, userInfo.fkpoid, userInfo.username);
    }

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

  // ----- modal helpers -----
  const openAddModal = () => {
    setSelectedBoard(null);
    setIsModalOpen(true);
  };

  const openEditModal = (board: ApiBoard) => {
    setSelectedBoard(board);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedBoard(null);
    setIsModalOpen(false);
  };

  // 👉 This is what you passed to SectionHeader
  const handleCreateBoard = () => {
    openAddModal();
  };

  // ----- edit board title -----
  const handleEditTitle = async (newTitle: string, boardId: number) => {
    if (!userInfo) return;
    const res = await EditBoard(newTitle, boardId, userInfo.username);
    if (res?.status !== 200 || !res?.data) {
      toast.error("Failed to edit board.", {
        position: toast.POSITION.TOP_CENTER,
      });
      return;
    }
    setBoards((prev) =>
      prev.map((b) => (b.boardId === boardId ? { ...b, title: newTitle } : b))
    );
    toast.success(`${res.data}`, { position: toast.POSITION.TOP_CENTER });
    closeModal();
  };

  // ----- create board + default lists -----
  const handleAddBoardClick = async (newTitle: string) => {
    if (!userInfo || fkpoid == null) return;

    try {
      setIsCreatingBoard(true);

      // 1) create board
      const res = await AddBoard(newTitle, fkpoid, userInfo.id, userInfo.username);
      if (res?.status !== 200 || !res?.data) {
        toast.error("Failed to add board.", {
          position: toast.POSITION.TOP_CENTER,
        });
        return;
      }

      const newBoardId = res.data;

      // 2) create default lists
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
        } catch (error) {
          console.error(`Error creating default list "${title}":`, error);
        }
      }

      // 3) update local state
      setBoards((prev) => [
        ...prev,
        { boardId: newBoardId, title: newTitle },
      ]);

      toast.success(`Board "${newTitle}" created with default lists!`, {
        position: toast.POSITION.TOP_CENTER,
      });
      closeModal();
    } finally {
      setIsCreatingBoard(false);
    }
  };

  // ----- filter by search -----
  const filteredBoards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return boards;
    return boards.filter((b) => b.title.toLowerCase().includes(q));
  }, [boards, search]);

  // ----- click handlers for card -----
  const handleAddClick = (board: ApiBoard) => {
    if (!userInfo) return;
    handleSetUserInfo({
      ...userInfo,
      boardTitle: board.title,
      fkboardid: board.boardId,
    });
    router.push(`/kanbanList/${board.boardId}`);
  };

  const handleMoreClick = (board: ApiBoard) => {
    openEditModal(board);
  };

  return (
    <Shell>
      <Topbar />

      {/* Header with breadcrumb + search + "Create Board" button */}
      <SectionHeader
        search={search}
        setSearch={setSearch}
        onCreate={handleCreateBoard}
        createLabel="Create Board"
      />

      {/* Board cards grid */}
      <section className="mx-auto max-w-[1120px] px-0 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <BoardCardSkeleton count={4} />
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="rounded-[16px] border border-slate500_12 bg-white p-10 text-center">
            <h3 className="text-[18px] font-semibold text-ink">No Boards yet</h3>
            <p className="mt-1 text-[14px] text-[#637381]">
              Try creating a new board for this project.
            </p>
            <button
              type="button"
              onClick={handleCreateBoard}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-[10px] bg-ink px-5 text-[14px] font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] hover:opacity-95"
            >
              Create Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {isCreatingBoard && <BoardCardSkeleton count={1} />}
            {filteredBoards.map((board) => (
              <BoardCard
                key={board.boardId}
                idLabel={String(board.boardId).padStart(3, "0")}
                title={board.title}
                taskCount={"20+"} // TEMP until backend provides real count
                tags={[
                  { label: "New Project" },
                  { label: "Urgent" },
                  { label: "2+" },
                ]}
                onAdd={() => handleAddClick(board)}
                onMore={() => handleMoreClick(board)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Board modal */}
      <AddEditBoardModal
        isOpen={isModalOpen}
        onClose={closeModal}
        handleEditTitle={handleEditTitle}
        handleAddBoardClick={handleAddBoardClick}
        board={selectedBoard}
      />

      <ToastContainer />
    </Shell>
  );
}

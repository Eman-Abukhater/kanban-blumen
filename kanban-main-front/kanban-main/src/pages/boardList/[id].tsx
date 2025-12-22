// src/pages/boardList/[id].tsx
export const getServerSideProps = async () => ({ props: {} });

import { useState, useEffect, useMemo, useContext, useCallback } from "react";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import {
  Eye,
  Edit2,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import Image from "next/image";

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
  DeleteBoard,
} from "@/services/kanbanApi";

type ApiBoard = {
  boardId: number;
  title: string;
};

type SortField = "id" | "title" | "task";

const BOARDS_CACHE_PREFIX = "blumen-boards-cache-";

export default function BoardListPage() {
  const {
    userInfo,
    handleSetUserInfo,
    signalRConnection,
    setSignalRConnection,
    setUsersOnline,
  } = useContext(KanbanContext);

  const router = useRouter();

  const fkpoid = useMemo(() => {
    if (!router.isReady) return null as number | null;
    const raw = router.query.id;
    const val = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }, [router.isReady, router.query.id]);

  const [boards, setBoards] = useState<ApiBoard[]>([]);

  // loading states
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<ApiBoard | null>(null);

  // ✅ view mode: false = cards, true = table
  const [isTableView, setIsTableView] = useState(false);

  // sort state
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // 🔹 footer state (dense + pagination)
  const [dense, setDense] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [page, setPage] = useState(0);
  const [rowsMenuOpen, setRowsMenuOpen] = useState(false);

  // 🔹 did we hydrate from cache?
  const [hasCachedBoards, setHasCachedBoards] = useState(false);

  // ───────────────────────
  // Route change tracking
  // ───────────────────────
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

  // ───────────────────────
  // Auth: hydrate userInfo from sessionStorage
  // ───────────────────────
  useEffect(() => {
    if (!router.isReady) return;

    if (!userInfo) {
      const stored = window.sessionStorage.getItem("userData");
      if (!stored) {
        router.push(`/unauthorized`);
        return;
      }
      const u = JSON.parse(stored);
      handleSetUserInfo(u);
    }
  }, [router.isReady, userInfo, handleSetUserInfo, router]);

  // ───────────────────────
  // Boards cache: read from sessionStorage (per project)
  // ───────────────────────
  useEffect(() => {
    if (!router.isReady || fkpoid == null) return;
    if (typeof window === "undefined") return;

    try {
      const cacheKey = `${BOARDS_CACHE_PREFIX}${fkpoid}`;
      const cached = window.sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setBoards(parsed);
          setIsLoading(false);
          setHasCachedBoards(true);
        }
      }
    } catch {
      // ignore cache errors
    }
  }, [router.isReady, fkpoid]);

  // ───────────────────────
  // Fetch boards (API) – re-usable + cache writer
  // ───────────────────────
  const fetchData = useCallback(
    async (options?: { showLoader?: boolean }) => {
      if (fkpoid == null) return;

      const showLoader = options?.showLoader ?? !hasCachedBoards;

      try {
        if (showLoader) setIsLoading(true);

        const res = await fetchInitialBoards(fkpoid);
        if (res?.status === 200) {
          const data = Array.isArray(res.data) ? res.data : [];
          setBoards(data as ApiBoard[]);

          if (typeof window !== "undefined") {
            const cacheKey = `${BOARDS_CACHE_PREFIX}${fkpoid}`;
            window.sessionStorage.setItem(cacheKey, JSON.stringify(data));
          }
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
        if (showLoader) setIsLoading(false);
      }
    },
    [fkpoid, hasCachedBoards]
  );

  // ───────────────────────
  // When userInfo & fkpoid are ready → fetch boards
  // ───────────────────────
  useEffect(() => {
    if (!router.isReady || fkpoid == null || !userInfo) return;
    fetchData({ showLoader: !hasCachedBoards });
  }, [router.isReady, fkpoid, userInfo, fetchData, hasCachedBoards]);

  // ✅ show skeleton only if loading lasts >150ms (better UX)
  useEffect(() => {
    if (isLoading) {
      const t = setTimeout(() => setShowSkeleton(true), 150);
      return () => clearTimeout(t);
    }
    setShowSkeleton(false);
  }, [isLoading]);

  // ───────────────────────
  // SignalR connection setup (once)
  // ───────────────────────
  useEffect(() => {
    if (!router.isReady || !userInfo) return;
    if (signalRConnection) return;

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
              toast.dark(`${message}`, { position: toast.POSITION.TOP_CENTER });
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
  }, [
    router.isReady,
    userInfo,
    signalRConnection,
    setSignalRConnection,
    setUsersOnline,
    fkpoid,
  ]);

  // ───────────────────────
  // SignalR: listen to addEditBoard → refetch (no skeleton)
  // ───────────────────────
  useEffect(() => {
    if (!signalRConnection) return;

    const handler = async (_message: string) => {
      toast.info(`${_message}`, { position: toast.POSITION.TOP_CENTER });
      await fetchData({ showLoader: false });
    };

    signalRConnection.on("addEditBoard", handler);
    return () => {
      signalRConnection.off("addEditBoard", handler);
    };
  }, [signalRConnection, fetchData]);

  // 🔁 reset page when search or rowsPerPage change
  useEffect(() => {
    setPage(0);
  }, [search, rowsPerPage]);

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

  const handleCreateBoard = () => {
    openAddModal();
  };

  const handleEditTitle = async (newTitle: string, boardId: number) => {
    if (!userInfo) return;

    const res = await EditBoard(newTitle, boardId, userInfo.username);

    if (!res || res.status !== 200) {
      const msg =
        (res && (res as any).data && (res as any).data.message) ||
        "Failed to edit board.";
      toast.error(msg, { position: toast.POSITION.TOP_CENTER });
      return;
    }

    // ✅ update local state immediately
    setBoards((prev) =>
      prev.map((b) => (b.boardId === boardId ? { ...b, title: newTitle } : b))
    );

    const msg =
      typeof res.data === "string"
        ? res.data
        : (res.data as any)?.message || "Board updated successfully.";
    toast.success(msg, { position: toast.POSITION.TOP_CENTER });

    closeModal();
  };

  const handleAddBoardClick = async (newTitle: string) => {
    if (!userInfo || fkpoid == null) return;

    try {
      setIsCreatingBoard(true);

      const res = await AddBoard(
        newTitle,
        fkpoid,
        userInfo.id,
        userInfo.username
      );

      if (!res || res.status !== 200 || !res.data) {
        const msg =
          (res && (res as any).data && (res as any).data.message) ||
          "Failed to add board.";
        toast.error(msg, { position: toast.POSITION.TOP_CENTER });
        return;
      }

      // 🔍 Extract newBoardId from different possible shapes
      let newBoardId: number | null = null;
      const payload: any = res.data;

      if (typeof payload === "number") {
        newBoardId = payload;
      } else if (typeof payload === "string" && /^\d+$/.test(payload)) {
        newBoardId = Number(payload);
      } else if (typeof payload === "object" && payload !== null) {
        newBoardId =
          payload.boardId ??
          payload.id ??
          payload.data?.boardId ??
          payload.data?.id ??
          null;
      }

      if (newBoardId == null || !Number.isFinite(newBoardId)) {
        toast.error("Board created but ID was not returned correctly.", {
          position: toast.POSITION.TOP_CENTER,
        });
        return;
      }

      const boardId: number = newBoardId;

      // create default lists
      const defaultListTitles = ["To do", "In progress", "In review", "Done"];
      for (let i = 0; i < defaultListTitles.length; i++) {
        const title = defaultListTitles[i];
        try {
          await AddKanbanList(
            title,
            boardId,
            userInfo.username,
            userInfo.id,
            fkpoid
          );
        } catch (error) {
          console.error(`Error creating default list "${title}":`, error);
        }
      }

      // ✅ update local state immediately
      setBoards((prev) => [...prev, { boardId, title: newTitle }]);

      const msg =
        typeof res.data === "string"
          ? res.data
          : payload.message || `Board "${newTitle}" created with default lists!`;

      toast.success(msg, { position: toast.POSITION.TOP_CENTER });

      closeModal();
    } finally {
      setIsCreatingBoard(false);
    }
  };

  const handleDeleteBoard = async (boardId: number) => {
    if (!userInfo) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this board?"
    );
    if (!confirmed) return;

    try {
      const res = await DeleteBoard(boardId);

      if (!res || res.status !== 200) {
        const backendMessage =
          (res as any)?.data?.message ||
          (res as any)?.data?.error ||
          (res as any)?.data ||
          "Failed to delete board.";

        toast.error(backendMessage, { position: toast.POSITION.TOP_CENTER });

        // if 404 not found → remove from UI
        if (
          res &&
          res.status === 404 &&
          ((res.data as any)?.message?.toLowerCase().includes("not found") ||
            (res.data as any)?.error?.toLowerCase().includes("not found"))
        ) {
          setBoards((prev) => prev.filter((b) => b.boardId !== boardId));
        }

        return;
      }

      setBoards((prev) => prev.filter((b) => b.boardId !== boardId));

      const successMsg =
        typeof res.data === "string"
          ? res.data
          : (res.data as any)?.message || "Board deleted successfully";

      toast.success(successMsg, { position: toast.POSITION.TOP_CENTER });
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete board.", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };

  // 🔍 filter
  const filteredBoards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return boards;
    return boards.filter((b) => (b.title ?? "").toLowerCase().includes(q));
  }, [boards, search]);

  // ↕️ sort
  const sortedBoards = useMemo(() => {
    const arr = [...filteredBoards];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortField === "id") {
        cmp = a.boardId - b.boardId;
      } else if (sortField === "title") {
        cmp = (a.title ?? "").localeCompare(b.title ?? "");
      } else {
        cmp = a.boardId - b.boardId;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filteredBoards, sortField, sortDirection]);

  // 📄 pagination
  const total = sortedBoards.length;
  const startIndex = page * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, total);
  const paginatedBoards = sortedBoards.slice(startIndex, endIndex);

  const canPrev = page > 0;
  const canNext = endIndex < total;

  const handleChangeRowsPerPage = (value: number) => {
    setRowsPerPage(value);
    setRowsMenuOpen(false);
  };

  const handlePrev = () => {
    if (canPrev) setPage((p) => p - 1);
  };

  const handleNext = () => {
    if (canNext) setPage((p) => p + 1);
  };

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ChevronDown className="h-3 w-3 text-slate500 dark:text-slate500_80" />
      );
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3 text-slate600 dark:text-slate500_80" />
    ) : (
      <ChevronDown className="h-3 w-3 text-slate600 dark:text-slate500_80" />
    );
  };

  const handleAddClick = (board: ApiBoard) => {
    if (!userInfo) return;
    handleSetUserInfo({
      ...userInfo,
      boardTitle: board.title,
      fkboardid: board.boardId,
    });
    router.push(`/kanbanList/${board.boardId}`);
  };

  return (
    <>
      <Shell>
        <Topbar />

        <SectionHeader
          search={search}
          setSearch={setSearch}
          onCreate={handleCreateBoard}
          createLabel="Create Board"
          isTableView={isTableView}
          onChangeViewMode={(mode) => setIsTableView(mode === "table")}
        />

        <section className="mx-auto max-w-[1120px] px-0 py-6">
          {/* If userInfo or route params not ready, show skeleton (no blank screen) */}
          {!userInfo || fkpoid == null || isNavigating ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <BoardCardSkeleton count={4} />
            </div>
          ) : (
            <>
              {/* ======================= CARD VIEW (default) ======================= */}
              {!isTableView && (
                <>
                  {showSkeleton ? (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      <BoardCardSkeleton count={4} />
                    </div>
                  ) : total === 0 ? (
                    <div className="rounded-[16px] border border-slate500_12 bg-white p-10 text-center dark:border-slate500_20 dark:bg-[#1B232D]">
                      <h3 className="text-[18px] font-semibold text-ink dark:text-white">
                        No Boards yet
                      </h3>
                      <p className="mt-1 text-[14px] text-[#637381] dark:text-slate500_80">
                        Try creating a new board for this project.
                      </p>
                      <button
                        type="button"
                        onClick={handleCreateBoard}
                        className="mt-4 inline-flex h-9 items-center justify-center rounded-[10px] bg-ink px-5 text-[14px] font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] hover:opacity-95 dark:bg-white dark:text-[#1C252E] dark:shadow-none"
                      >
                        Create Board
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${
                        dense ? "gap-4" : "gap-5"
                      }`}
                    >
                      {isCreatingBoard && <BoardCardSkeleton count={1} />}
                      {paginatedBoards.map((board) => (
                        <BoardCard
                          key={board.boardId}
                          idLabel={String(board.boardId).padStart(3, "0")}
                          title={board.title}
                          taskCount={"20+"}
                          tags={[
                            { label: "New Project" },
                            { label: "Urgent" },
                            { label: "2+" },
                          ]}
                          onAdd={() => handleAddClick(board)}
                          onEdit={() => openEditModal(board)}
                          onDelete={() => handleDeleteBoard(board.boardId)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ======================= TABLE / ROW VIEW ========================= */}
              {isTableView && (
                <div className="overflow-hidden rounded-[24px] border border-slate500_12 bg-white dark:border-slate500_20 dark:bg-[#1B232D]">
                  {/* Search + icons INSIDE card (top bar) */}
                  <div className="flex items-center justify-between border-b border-slate500_12 px-6 py-4 dark:border-slate500_20">
                    {/* search */}
                    <div className="w-[320px]">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate500 dark:text-slate500_80" />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search..."
                          className="h-10 w-full rounded-[12px] border border-slate500_20 bg-white pl-9 pr-3 text-[14px] text-ink placeholder-slate500 outline-none focus:ring-2 focus:ring-brand/40 dark:border-slate500_20 dark:bg-[#1B232D] dark:text-slate500_80 dark:placeholder-slate500_80"
                        />
                      </div>
                    </div>

                    {/* icons right */}
                    <div className="flex items-center gap-3">
                      <button className="rounded-[10px] p-2 hover:bg-slate500_12 dark:hover:bg-slate500_20">
                        <Image
                          src="/icons/filter-icon.svg"
                          alt="filter"
                          width={20}
                          height={20}
                          className="opacity-80"
                        />
                      </button>

                      <button
                        className="rounded-[10px] p-2 hover:bg-slate500_12 dark:hover:bg-slate500_20"
                        onClick={() => setIsTableView(false)}
                      >
                        <Image
                          src="/icons/column.svg"
                          alt="column"
                          width={20}
                          height={20}
                          className="opacity-80"
                        />
                      </button>

                      <button className="rounded-[10px] bg-slate500_12 p-2 dark:bg-slate500_20">
                        <Image
                          src="/icons/grid-icon.svg"
                          alt="grid"
                          width={20}
                          height={20}
                          className="opacity-80"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Header row */}
                  <div className="flex items-center border-b border-slate500_12 bg-[#F9FAFB] px-6 py-4 text-[13px] font-medium text-slate600 dark:border-slate500_20 dark:bg-[#141A21] dark:text-slate500_80">
                    <div className="w-10">
                      <input
                        type="checkbox"
                        className="border-1 h-4 w-4 rounded-[6px] border-[#1C252E] text-brand focus:ring-0 dark:border-slate500_20"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSortClick("id")}
                      className="flex w-16 items-center gap-1 text-left"
                    >
                      <span>ID</span>
                      {renderSortIcon("id")}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSortClick("title")}
                      className="flex flex-1 items-center gap-1 text-left"
                    >
                      <span>Board Name</span>
                      {renderSortIcon("title")}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSortClick("task")}
                      className="flex w-24 items-center gap-1 text-left"
                    >
                      <span>Task</span>
                      {renderSortIcon("task")}
                    </button>

                    <div className="w-24" />
                  </div>

                  {/* Body */}
                  {showSkeleton ? (
                    <>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex animate-pulse items-center border-b border-dashed border-slate500_12 px-6 py-4 text-sm dark:border-slate500_20"
                        >
                          <div className="w-10">
                            <div className="h-4 w-4 rounded-[6px] bg-slate500_12 dark:bg-slate500_20" />
                          </div>
                          <div className="w-16">
                            <div className="h-4 w-10 rounded bg-slate500_12 dark:bg-slate500_20" />
                          </div>
                          <div className="flex-1">
                            <div className="h-4 w-2/3 rounded bg-slate500_12 dark:bg-slate500_20" />
                          </div>
                          <div className="w-24">
                            <div className="h-4 w-12 rounded bg-slate500_12 dark:bg-slate500_20" />
                          </div>
                          <div className="flex w-24 items-center justify-end gap-3">
                            <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                            <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : total === 0 ? (
                    <div className="p-10 text-center">
                      <h3 className="text-[18px] font-semibold text-ink dark:text-white">
                        No Boards yet
                      </h3>
                      <p className="mt-1 text-[14px] text-[#637381] dark:text-slate500_80">
                        Try creating a new board for this project.
                      </p>
                      <button
                        type="button"
                        onClick={handleCreateBoard}
                        className="mt-4 inline-flex h-9 items-center justify-center rounded-[10px] bg-ink px-5 text-[14px] font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] hover:opacity-95 dark:bg-white dark:text-[#1C252E] dark:shadow-none"
                      >
                        Create Board
                      </button>
                    </div>
                  ) : (
                    <>
                      {isCreatingBoard && (
                        <div className="flex animate-pulse items-center border-b border-dashed border-slate500_12 px-6 py-4 text-sm dark:border-slate500_20">
                          <div className="w-10">
                            <div className="h-4 w-4 rounded-[6px] bg-slate500_12 dark:bg-slate500_20" />
                          </div>
                          <div className="w-16">
                            <div className="h-4 w-10 rounded bg-slate500_12 dark:bg-slate500_20" />
                          </div>
                          <div className="flex-1">
                            <div className="h-4 w-2/3 rounded bg-slate500_12 dark:bg-slate500_20" />
                          </div>
                          <div className="w-24">
                            <div className="h-4 w-12 rounded bg-slate500_12 dark:bg-slate500_20" />
                          </div>
                          <div className="flex w-24 items-center justify-end gap-3">
                            <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                            <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                          </div>
                        </div>
                      )}

                      {paginatedBoards.map((board) => (
                        <div
                          key={board.boardId}
                          className="flex items-center border-b border-dashed border-slate500_12 px-6 py-4 text-[14px] text-ink last:border-b-0 dark:border-slate500_20 dark:text-slate500_80"
                        >
                          <div className="w-10">
                            <input
                              type="checkbox"
                              className="border-1 h-4 w-4 rounded-[6px] border-[#1C252E] text-brand focus:ring-0 dark:border-slate500_20"
                            />
                          </div>

                          <div className="w-16 text-slate600 dark:text-slate500_80">
                            {String(board.boardId).padStart(3, "0")}
                          </div>

                          <div className="flex-1">{board.title || "Board title"}</div>

                          <div className="w-24 text-slate600 dark:text-slate500_80">
                            20+
                          </div>

                          <div className="flex w-24 items-center justify-end gap-3">
                            <button
                              type="button"
                              title="Open board"
                              onClick={() => handleAddClick(board)}
                              className="rounded-full p-1.5 hover:bg-slate500_08 dark:hover:bg-slate500_20"
                            >
                              <Eye className="h-4 w-4 text-slate600 dark:text-slate500_80" />
                            </button>

                            <button
                              type="button"
                              title="Edit board"
                              onClick={() => openEditModal(board)}
                              className="rounded-full p-1.5 hover:bg-slate500_08 dark:hover:bg-slate500_20"
                            >
                              <Edit2 className="h-4 w-4 text-slate600 dark:text-slate500_80" />
                            </button>

                            <button
                              type="button"
                              title="More"
                              onClick={() => openEditModal(board)}
                              className="rounded-full p-1.5 hover:bg-slate500_08 dark:hover:bg-slate500_20"
                            >
                              <MoreVertical className="h-4 w-4 text-slate600 dark:text-slate500_80" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* Footer */}
        {!isLoading && total > 0 && (
          <div className="mx-auto flex max-w-[1120px] items-center justify-between pb-6 pt-4 text-[13px] text-[#212B36] dark:text-slate500_80">
            <button
              type="button"
              onClick={() => setDense((d) => !d)}
              className="flex items-center gap-2"
            >
              <span
                className={`
                  relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                  ${
                    dense
                      ? "bg-ink dark:bg-ink"
                      : "bg-slate500_20 dark:bg-[#919EAB7A]"
                  }
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 rounded-full bg-white shadow-soft transform transition-transform
                    ${dense ? "translate-x-[18px]" : "translate-x-[2px]"}
                  `}
                />
              </span>

              <span className="text-[#212B36] dark:text-[#E5EAF1]">Dense</span>
            </button>

            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="text-[#637381] dark:text-slate500_80">
                  Rows per page:
                </span>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRowsMenuOpen((o) => !o)}
                    className="flex items-center gap-1 text-[13px] text-[#111827] dark:text-[#F9FAFB]"
                  >
                    {rowsPerPage}
                    <ChevronDown className="h-4 w-4 text-slate500 dark:text-slate500_80" />
                  </button>

                  {rowsMenuOpen && (
                    <div className="absolute right-0 mt-1 w-20 rounded-[12px] border border-slate500_20 bg-white/98 shadow-[0_18px_45px_rgba(145,158,171,0.24)] dark:border-[#1F2937] dark:bg-[#050B14]">
                      {[3, 5, 6, 9].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleChangeRowsPerPage(option)}
                          className={`
                            flex w-full items-center justify-between px-3 py-1 text-left text-[13px]
                            hover:bg-slate500_08 dark:hover:bg-white/5
                            ${
                              rowsPerPage === option
                                ? "font-semibold text-[#111827] dark:text-white"
                                : "text-[#637381] dark:text-slate500_80"
                            }
                          `}
                        >
                          <span>{option}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <span className="text-[#212B36] dark:text-slate500_80">
                {total === 0
                  ? "0-0 of 0"
                  : `${startIndex + 1}-${endIndex} of ${total}`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!canPrev}
                  className={`flex h-5 w-5 items-center justify-center ${
                    !canPrev
                      ? "cursor-default text-slate300 dark:text-slate600"
                      : "text-slate500 hover:text-slate900 dark:text-slate500_80 dark:hover:text-white"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canNext}
                  className={`flex h-5 w-5 items-center justify-center ${
                    !canNext
                      ? "cursor-default text-slate300 dark:text-slate600"
                      : "text-slate500 hover:text-slate900 dark:text-slate500_80 dark:hover:text-white"
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <AddEditBoardModal
          isOpen={isModalOpen}
          onClose={closeModal}
          handleEditTitle={handleEditTitle}
          handleAddBoardClick={handleAddBoardClick}
          board={selectedBoard}
        />

        <ToastContainer
          position="top-center"
          autoClose={4000}
          pauseOnHover
          closeOnClick
          draggable
          toastClassName="blumen-toast"
          bodyClassName="blumen-toast-body"
          progressClassName="blumen-toast-progress"
        />
      </Shell>
    </>
  );
}

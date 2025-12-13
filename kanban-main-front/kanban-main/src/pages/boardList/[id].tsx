// src/pages/boardList/[id].tsx
export const getServerSideProps = async () => ({ props: {} });

import type { GetServerSideProps } from "next";
import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import {
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  ChevronDown,
  ChevronUp,
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
  const [isLoading, setIsLoading] = useState(true);
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
                toast.dark(`${message}`, {
                  position: toast.POSITION.TOP_LEFT,
                });
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
      if (res?.status !== 200 || !res?.data) {
        toast.error("Failed to add board.", {
          position: toast.POSITION.TOP_CENTER,
        });
        return;
      }

      const newBoardId = res.data;

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

      setBoards((prev) => [...prev, { boardId: newBoardId, title: newTitle }]);

      toast.success(`Board "${newTitle}" created with default lists!`, {
        position: toast.POSITION.TOP_CENTER,
      });
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
        toast.error("Failed to delete board.", {
          position: toast.POSITION.TOP_CENTER,
        });
        return;
      }

      // remove board from state
      setBoards((prev) => prev.filter((b) => b.boardId !== boardId));

      // backend usually returns a message string
      toast.success(res.data || "Board deleted successfully", {
        position: toast.POSITION.TOP_CENTER,
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete board.", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };

  const filteredBoards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return boards;
    return boards.filter((b) => b.title.toLowerCase().includes(q));
  }, [boards, search]);

  const sortedBoards = useMemo(() => {
    const arr = [...filteredBoards];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortField === "id") {
        cmp = a.boardId - b.boardId;
      } else if (sortField === "title") {
        cmp = a.title.localeCompare(b.title);
      } else {
        // "task" – fake using id for now
        cmp = a.boardId - b.boardId;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filteredBoards, sortField, sortDirection]);

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

  const handleMoreClick = (board: ApiBoard) => {
    openEditModal(board);
  };

  return (
    <Shell>
      <Topbar />

      <SectionHeader
        search={search}
        setSearch={setSearch}
        onCreate={handleCreateBoard}
        createLabel="Create Board"
        isTableView={isTableView}
        onChangeViewMode={(mode) => {
          // "cards" → false   |   "table" → true
          setIsTableView(mode === "table");
        }}
      />

      <section className="mx-auto max-w-[1120px] px-0 py-6">
        {/* ======================= CARD VIEW (default) ======================= */}
        {!isTableView && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <BoardCardSkeleton count={4} />
              </div>
            ) : filteredBoards.length === 0 ? (
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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {isCreatingBoard && <BoardCardSkeleton count={1} />}
                {filteredBoards.map((board) => (
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
                    onAdd={() => handleAddClick(board)} // enter list
                    onEdit={() => openEditModal(board)} // open edit modal
                    onDelete={() => handleDeleteBoard(board.boardId)} // delete board
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
                {/* Filter (visual only for now) */}
                <button className="rounded-[10px] p-2 hover:bg-slate500_12 dark:hover:bg-slate500_20">
                  <Image
                    src="/icons/filter-icon.svg"
                    alt="filter"
                    width={20}
                    height={20}
                    className="opacity-80"
                  />
                </button>

                {/* Column (cards) */}
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

                {/* Grid (table) – active */}
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
              {/* checkbox col */}
              <div className="w-10">
                <input
                  type="checkbox"
                  className="border-1 h-4 w-4 rounded-[6px] border-[#1C252E] text-brand focus:ring-0 dark:border-slate500_20"
                />
              </div>

              {/* ID sortable */}
              <button
                type="button"
                onClick={() => handleSortClick("id")}
                className="flex w-16 items-center gap-1 text-left"
              >
                <span>ID</span>
                {renderSortIcon("id")}
              </button>

              {/* Board name sortable */}
              <button
                type="button"
                onClick={() => handleSortClick("title")}
                className="flex flex-1 items-center gap-1 text-left"
              >
                <span>Board Name</span>
                {renderSortIcon("title")}
              </button>

              {/* Task sortable */}
              <button
                type="button"
                onClick={() => handleSortClick("task")}
                className="flex w-24 items-center gap-1 text-left"
              >
                <span>Task</span>
                {renderSortIcon("task")}
              </button>

              {/* actions header */}
              <div className="w-24" />
            </div>

            {/* Body */}
            {isLoading ? (
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
            ) : sortedBoards.length === 0 ? (
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

                {sortedBoards.map((board) => (
                  <div
                    key={board.boardId}
                    className="flex items-center border-b border-dashed border-slate500_12 px-6 py-4 text-[14px] text-ink last:border-b-0 dark:border-slate500_20 dark:text-slate500_80"
                  >
                    {/* checkbox */}
                    <div className="w-10">
                      <input
                        type="checkbox"
                        className="border-1 h-4 w-4 rounded-[6px] border-[#1C252E] text-brand focus:ring-0 dark:border-slate500_20"
                      />
                    </div>

                    {/* ID */}
                    <div className="w-16 text-slate600 dark:text-slate500_80">
                      {String(board.boardId).padStart(3, "0")}
                    </div>

                    {/* Board name */}
                    <div className="flex-1 ">
                      {board.title || "Board title"}
                    </div>

                    {/* Task (static 20+ for now) */}
                    <div className="w-24 text-slate600 dark:text-slate500_80">
                      20+
                    </div>

                    {/* actions: Quick View / Edit / More */}
                    <div className="flex w-24 items-center justify-end gap-3">
                      <button
                        type="button"
                        title="Quick View"
                        onClick={() => handleAddClick(board)}
                        className="hover:bg-slate500_08 rounded-full p-1.5 dark:hover:bg-slate500_20"
                      >
                        <Eye className="h-4 w-4 text-slate600 dark:text-slate500_80" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoreClick(board)}
                        className="hover:bg-slate500_08 rounded-full p-1.5 dark:hover:bg-slate500_20"
                      >
                        <Edit2 className="h-4 w-4 text-slate600 dark:text-slate500_80" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoreClick(board)}
                        className="hover:bg-slate500_08 rounded-full p-1.5 dark:hover:bg-slate500_20"
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
      </section>

      <AddEditBoardModal
        isOpen={isModalOpen}
        onClose={closeModal}
        handleEditTitle={handleEditTitle}
        handleAddBoardClick={handleAddBoardClick}
        board={selectedBoard}
      />

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
  );
}

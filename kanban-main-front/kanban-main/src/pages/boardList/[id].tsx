// src/pages/boardList/[id].tsx
export const getServerSideProps = async () => ({ props: {} });

import { useState, useEffect, useMemo, useContext, useCallback, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import {
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

/* ===================== Dynamic Rows Per Page Dropdown (MUI-like) ===================== */
type RowsDropdownProps = {
  open: boolean;
  value: number;
  options: number[];
  onToggle: () => void;
  onClose: () => void;
  onSelect: (v: number) => void;
};

function RowsPerPageDropdown({
  open,
  value,
  options,
  onToggle,
  onClose,
  onSelect,
}: RowsDropdownProps) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 80,
  });
  const [maxH, setMaxH] = useState<number>(240);
  const [openDown, setOpenDown] = useState(true);

  const updatePosition = () => {
    const btn = btnRef.current;
    const menu = menuRef.current;
    if (!btn) return;

    const r = btn.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;

    const menuH = menu?.offsetHeight ?? 160;

    const spaceBelow = viewportH - r.bottom;
    const spaceAbove = r.top;

    const shouldOpenDown =
      spaceBelow >= Math.min(140, menuH) || spaceBelow >= spaceAbove;

    const pad = 8;
    const width = Math.max(80, Math.ceil(r.width));
    const left = Math.min(
      Math.max(pad, r.left),
      Math.max(pad, viewportW - pad - width)
    );

    const gap = 8;
    const top = shouldOpenDown ? r.bottom + gap : r.top - gap;

    const available = shouldOpenDown ? spaceBelow - 16 : spaceAbove - 16;
    const clampedMax = Math.max(90, Math.min(240, available));

    setOpenDown(shouldOpenDown);
    setPos({ top, left, width });
    setMaxH(clampedMax);
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onWin = () => updatePosition();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      onClose();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1 whitespace-nowrap text-[13px] text-[#111827] dark:text-[#F9FAFB]"
      >
        {value}
        <ChevronDown className="h-4 w-4 text-slate500 dark:text-slate500_80" />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            width: pos.width,
            maxHeight: maxH,
            overflowY: "auto",
            transform: openDown ? "translateY(0)" : "translateY(-100%)",
          }}
          className="
            z-[9999]
            rounded-[12px]
            border border-slate500_20
            bg-white/98
            shadow-[0_18px_45px_rgba(145,158,171,0.24)]
            dark:border-[#1F2937]
            dark:bg-[#050B14]
          "
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`flex w-full items-center justify-between px-3 py-1 text-left text-[13px]
                hover:bg-slate500_12 dark:hover:bg-white/5
                ${
                  value === option
                    ? "font-semibold text-[#111827] dark:text-white"
                    : "text-[#637381] dark:text-slate500_80"
                }`}
            >
              <span>{option}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
/* ============================================================================ */

// ✅ Delete confirm modal state
type DeleteBoardModalState = {
  isOpen: boolean;
  boardId: number | null;
  boardTitle: string;
  isLoading: boolean;
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

  const fkpoid = useMemo(() => {
    if (!router.isReady) return null as number | null;
    const raw = router.query.id;
    const val = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }, [router.isReady, router.query.id]);

const safeFkpoid = useMemo(() => {
  const fromRoute = fkpoid;
  const fromUser = userInfo?.fkpoid != null ? Number(userInfo.fkpoid) : null;
  return fromRoute ?? fromUser;
}, [fkpoid, userInfo?.fkpoid]);
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

  // sort state (table only)
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // ✅ UPDATE #1: separate pagination for CARD vs TABLE (same as projects.tsx)
  const [dense, setDense] = useState(false);

  const [cardRowsPerPage, setCardRowsPerPage] = useState(10); // ✅ better default for your grid (5*2)
  const [cardPage, setCardPage] = useState(0);
  const [cardRowsMenuOpen, setCardRowsMenuOpen] = useState(false);

  const [tableRowsPerPage, setTableRowsPerPage] = useState(6);
  const [tablePage, setTablePage] = useState(0);
  const [tableRowsMenuOpen, setTableRowsMenuOpen] = useState(false);

  // 🔹 did we hydrate from cache?
  const [hasCachedBoards, setHasCachedBoards] = useState(false);

  // ✅ delete confirm modal
  const [deleteBoardModal, setDeleteBoardModal] =
    useState<DeleteBoardModalState>({
      isOpen: false,
      boardId: null,
      boardTitle: "",
      isLoading: false,
    });

  const openDeleteBoardConfirm = (board: ApiBoard) => {
    setDeleteBoardModal({
      isOpen: true,
      boardId: board.boardId,
      boardTitle: board.title,
      isLoading: false,
    });
  };

  const closeDeleteBoardConfirm = () => {
    setDeleteBoardModal((prev) => ({
      ...prev,
      isOpen: false,
      boardId: null,
      boardTitle: "",
      isLoading: false,
    }));
  };

  // ✅ close delete modal on ESC
  useEffect(() => {
    if (!deleteBoardModal.isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDeleteBoardConfirm();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteBoardModal.isOpen]);

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

  // ✅ reset BOTH paginations when search changes
  useEffect(() => {
    setCardPage(0);
    setTablePage(0);
  }, [search]);

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
  // Frontend Validation: Check if title exceeds 100 characters
  if (newTitle.length > 100) {
    toast.error("Title must be at most 100 characters.", { 
      position: toast.POSITION.TOP_CENTER,
      autoClose: 3000,  // Auto close to prevent UI disruption
      hideProgressBar: true  // Hide progress bar to avoid UI shift
    });
    return;
  }

  if (!userInfo) return;

  const res = await EditBoard(newTitle, boardId, userInfo.username);

  if (!res || res.status !== 200) {
    const msg =
      (res && (res as any).data && (res as any).data.message) ||
      "Failed to edit board.";
    toast.error(msg, { position: toast.POSITION.TOP_CENTER });
    return;
  }

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
  if (newTitle.length > 100) {
    toast.error("Title must be at most 100 characters.", {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 3000,
      hideProgressBar: true,
    });
    return;
  }

  // ✅ use safeFkpoid, not fkpoid
  if (!userInfo || safeFkpoid == null) {
    toast.error("Missing project id (fkpoid). Please refresh.", {
      position: toast.POSITION.TOP_CENTER,
    });
    return;
  }

  // ✅ also guard required fields for backend zod
  if (!userInfo.id || !userInfo.username) {
    toast.error("Missing user info (id/username). Please login again.", {
      position: toast.POSITION.TOP_CENTER,
    });
    return;
  }

  try {
    setIsCreatingBoard(true);

    const res = await AddBoard(
      newTitle,
      Number(safeFkpoid),   // ✅ project id
      Number(userInfo.id),  // ✅ addedbyid
      String(userInfo.username) // ✅ addedby
    );

    if (!res || res.status !== 200 || !res.data) {
      const msg =
        (res as any)?.data?.message ||
        (res as any)?.data?.error ||
        "Failed to add board.";
      toast.error(msg, { position: toast.POSITION.TOP_CENTER });
      return;
    }

    // backend returns just board.id (number)
    const boardId = Number(res.data);
    if (!Number.isFinite(boardId)) {
      toast.error("Board created but ID not returned correctly.", {
        position: toast.POSITION.TOP_CENTER,
      });
      return;
    }

    // Create default lists (optional)
    const defaultListTitles = ["To do", "In progress", "In review", "Done", "Completed"];
    for (const title of defaultListTitles) {
      try {
        await AddKanbanList(
          title,
          boardId,
          userInfo.username,
          userInfo.id,
          Number(safeFkpoid)
        );
      } catch (e) {
        console.error(`Error creating default list "${title}":`, e);
      }
    }

    // ✅ update UI immediately
    setBoards((prev) => [{ boardId, title: newTitle }, ...prev]);
    setCardPage(0);
    setTablePage(0);

    toast.success(`Board "${newTitle}" created with default lists!`, {
      position: toast.POSITION.TOP_CENTER,
    });

    closeModal();
  } finally {
    setIsCreatingBoard(false);
  }
};
  // ✅ Confirm delete board (called from modal)
  const handleConfirmDeleteBoard = async () => {
    if (!userInfo) return;

    const boardId = deleteBoardModal.boardId;
    if (!boardId) return;

    try {
      setDeleteBoardModal((prev) => ({ ...prev, isLoading: true }));

      const res = await DeleteBoard(boardId);

      if (!res || res.status !== 200) {
        const backendMessage =
          (res as any)?.data?.message ||
          (res as any)?.data?.error ||
          (res as any)?.data ||
          "Failed to delete board.";

        toast.error(backendMessage, { position: toast.POSITION.TOP_CENTER });

        if (
          res &&
          res.status === 404 &&
          ((res.data as any)?.message?.toLowerCase().includes("not found") ||
            (res.data as any)?.error?.toLowerCase().includes("not found"))
        ) {
          setBoards((prev) => prev.filter((b) => b.boardId !== boardId));
        }

        setDeleteBoardModal((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      setBoards((prev) => prev.filter((b) => b.boardId !== boardId));

      // ✅ if page becomes empty after delete, step back safely
      setCardPage((p) => Math.max(0, p - 1));
      setTablePage((p) => Math.max(0, p - 1));

      const successMsg =
        typeof res.data === "string"
          ? res.data
          : (res.data as any)?.message || "Board deleted successfully";

      toast.success(successMsg, { position: toast.POSITION.TOP_CENTER });
      closeDeleteBoardConfirm();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete board.", {
        position: toast.POSITION.TOP_CENTER,
      });
      setDeleteBoardModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // 🔍 filter
  const filteredBoards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return boards;
    return boards.filter((b) => (b.title ?? "").toLowerCase().includes(q));
  }, [boards, search]);

  /* =========================
     CARD VIEW: newest first + separate pagination
  ========================== */
  const cardSortedBoards = useMemo(() => {
    const arr = [...filteredBoards];
    arr.sort((a, b) => (b.boardId ?? 0) - (a.boardId ?? 0));
    return arr;
  }, [filteredBoards]);

  const cardTotal = cardSortedBoards.length;
  const cardStartIndex = cardPage * cardRowsPerPage;
  const cardEndIndex = Math.min(cardStartIndex + cardRowsPerPage, cardTotal);
  const cardPaginatedBoards = cardSortedBoards.slice(cardStartIndex, cardEndIndex);

  const cardCanPrev = cardPage > 0;
  const cardCanNext = cardEndIndex < cardTotal;

  const handleChangeCardRowsPerPage = (value: number) => {
    setCardRowsPerPage(value);
    setCardRowsMenuOpen(false);
    setCardPage(0);
  };

  const handleCardPrev = () => {
    if (cardCanPrev) setCardPage((p) => p - 1);
  };

  const handleCardNext = () => {
    if (cardCanNext) setCardPage((p) => p + 1);
  };

  /* =========================
     TABLE VIEW: your current sort + separate pagination
  ========================== */
  const tableSortedBoards = useMemo(() => {
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

  const tableTotal = tableSortedBoards.length;
  const tableStartIndex = tablePage * tableRowsPerPage;
  const tableEndIndex = Math.min(tableStartIndex + tableRowsPerPage, tableTotal);
  const tablePaginatedBoards = tableSortedBoards.slice(tableStartIndex, tableEndIndex);

  const tableCanPrev = tablePage > 0;
  const tableCanNext = tableEndIndex < tableTotal;

  const handleChangeTableRowsPerPage = (value: number) => {
    setTableRowsPerPage(value);
    setTableRowsMenuOpen(false);
    setTablePage(0);
  };

  const handleTablePrev = () => {
    if (tableCanPrev) setTablePage((p) => p - 1);
  };

  const handleTableNext = () => {
    if (tableCanNext) setTablePage((p) => p + 1);
  };

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setTablePage(0);
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

  // ✅ Save current project id for breadcrumb back link
  if (fkpoid != null) {
    sessionStorage.setItem("activeProjectId", String(fkpoid));
  }

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
          onChangeViewMode={(mode) => {
            const nextIsTable = mode === "table";
            setIsTableView(nextIsTable);
            setCardRowsMenuOpen(false);
            setTableRowsMenuOpen(false);
          }}
        />

        <section className="mx-auto w-full px-4 py-6">
          {!userInfo || fkpoid == null || isNavigating ? (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
 ${
                dense ? "gap-4" : "gap-5"
              }`}
            >
              <BoardCardSkeleton count={6} />
            </div>
          ) : (
            <>
              {/* ======================= CARD VIEW (default) ======================= */}
              {!isTableView && (
                <>
                  {showSkeleton ? (
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
 ${
                        dense ? "gap-4" : "gap-5"
                      }`}
                    >
                      <BoardCardSkeleton count={6} />
                    </div>
                  ) : cardTotal === 0 ? (
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
                      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
 ${
                        dense ? "gap-4" : "gap-5"
                      }`}
                    >
                      {isCreatingBoard && <BoardCardSkeleton count={1} />}

                      {cardPaginatedBoards.map((board) => (
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
                          onDelete={() => openDeleteBoardConfirm(board)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ======================= TABLE / ROW VIEW ========================= */}
              {isTableView && (
                <div className="rounded-[24px] border border-slate500_12 bg-white dark:border-slate500_20 dark:bg-[#1B232D] overflow-hidden">
                  {/* ✅ Top controls */}
                  <div className="border-b border-slate500_12 px-4 py-4 dark:border-slate500_20 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="w-full sm:max-w-[360px]">
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

                      <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
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
                  </div>

                  {/* ✅ Table content scroll only */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[760px]">
                      {/* Header row */}
                      <div className="flex items-center border-b border-slate500_12 bg-[#F9FAFB] px-6 py-4 text-[13px] font-medium text-slate600 dark:border-slate500_20 dark:bg-[#141A21] dark:text-slate500_80">
                        <div className="w-10 shrink-0">
                          <input
                            type="checkbox"
                            className="border-1 h-4 w-4 rounded-[6px] border-[#1C252E] text-brand focus:ring-0 dark:border-slate500_20"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSortClick("id")}
                          className="flex w-16 shrink-0 items-center gap-1 text-left"
                        >
                          <span>ID</span>
                          {renderSortIcon("id")}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSortClick("title")}
                          className="flex flex-1 min-w-0 items-center gap-1 text-left"
                        >
                          <span>Board Name</span>
                          {renderSortIcon("title")}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSortClick("task")}
                          className="flex w-24 shrink-0 items-center gap-1 text-left"
                        >
                          <span>Task</span>
                          {renderSortIcon("task")}
                        </button>

                        <div className="w-24 shrink-0" />
                      </div>

                      {/* Body */}
                      {showSkeleton ? (
                        <>
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex animate-pulse items-center border-b border-dashed border-slate500_12 px-6 py-4 text-sm dark:border-slate500_20"
                            >
                              <div className="w-10 shrink-0">
                                <div className="h-4 w-4 rounded-[6px] bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                              <div className="w-16 shrink-0">
                                <div className="h-4 w-10 rounded bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="h-4 w-2/3 rounded bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                              <div className="w-24 shrink-0">
                                <div className="h-4 w-12 rounded bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                              <div className="flex w-24 shrink-0 items-center justify-end gap-3">
                                <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                                <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                            </div>
                          ))}
                        </>
                      ) : tableTotal === 0 ? (
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
                              <div className="w-10 shrink-0">
                                <div className="h-4 w-4 rounded-[6px] bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                              <div className="w-16 shrink-0">
                                <div className="h-4 w-10 rounded bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="h-4 w-2/3 rounded bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                              <div className="w-24 shrink-0">
                                <div className="h-4 w-12 rounded bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                              <div className="flex w-24 shrink-0 items-center justify-end gap-3">
                                <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                                <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                            </div>
                          )}

                          {tablePaginatedBoards.map((board) => (
                            <div
                              key={board.boardId}
                              className="flex items-center border-b border-dashed border-slate500_12 px-6 py-4 text-[14px] text-ink last:border-b-0 dark:border-slate500_20 dark:text-slate500_80"
                            >
                              <div className="w-10 shrink-0">
                                <input
                                  type="checkbox"
                                  className="border-1 h-4 w-4 rounded-[6px] border-[#1C252E] text-brand focus:ring-0 dark:border-slate500_20"
                                />
                              </div>

                              <div className="w-16 shrink-0 text-slate600 dark:text-slate500_80">
                                {String(board.boardId).padStart(3, "0")}
                              </div>

                              <div className="flex-1 min-w-0">
                                <span className="block whitespace-normal break-words">
                                  {board.title || "Board title"}
                                </span>
                              </div>

                              <div className="w-24 shrink-0 text-slate600 dark:text-slate500_80">
                                20+
                              </div>

                              <div className="flex w-24 shrink-0 items-center justify-end gap-0">
                                                              <button
                                  type="button"
                                  title="Edit board"
                                  onClick={() => openEditModal(board)}
                                  className="rounded-full p-1.5 hover:bg-slate500_08 dark:hover:bg-slate500_20"
                                >
  <svg
  className="h-4 w-4 text-[#637381] dark:text-[#919EAB]"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M11.4 18.1511L18.796 10.7551C17.5517 10.2356 16.4216 9.47656 15.47 8.52114C14.5142 7.56935 13.7547 6.43891 13.235 5.19414L5.83902 12.5901C5.26202 13.1671 4.97302 13.4561 4.72502 13.7741C4.43213 14.1494 4.18098 14.5555 3.97602 14.9851C3.80302 15.3491 3.67402 15.7371 3.41602 16.5111L2.05402 20.5941C1.99133 20.7811 1.98203 20.9818 2.02716 21.1738C2.07229 21.3657 2.17007 21.5412 2.30949 21.6807C2.44891 21.8201 2.62446 21.9179 2.81641 21.963C3.00835 22.0081 3.20907 21.9988 3.39602 21.9361L7.47902 20.5741C8.25402 20.3161 8.64102 20.1871 9.00502 20.0141C9.43502 19.8091 9.84102 19.5581 10.216 19.2651C10.534 19.0171 10.823 18.7281 11.4 18.1511ZM20.848 8.70314C21.5855 7.9657 21.9997 6.96553 21.9997 5.92264C21.9997 4.87975 21.5855 3.87957 20.848 3.14214C20.1106 2.4047 19.1104 1.99042 18.0675 1.99042C17.0246 1.99042 16.0245 2.4047 15.287 3.14214L14.4 4.02914L14.438 4.14014C14.8751 5.39086 15.5904 6.52604 16.53 7.46014C17.492 8.42784 18.667 9.15725 19.961 9.59014L20.848 8.70314Z"
    fill="currentColor"
  />
</svg>                              </button>



  
                                <button
                                  type="button"
                                  title="Delete board"
                                  onClick={() => openDeleteBoardConfirm(board)}
                                  className="rounded-full p-1.5 hover:bg-slate500_08 dark:hover:bg-slate500_20"
                                >
 <svg
    className="h-4 w-4 text-[#637381] dark:text-[#919EAB]"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 6.37611C3 5.89211 3.345 5.49911 3.771 5.49911H6.436C6.965 5.48311 7.432 5.10011 7.612 4.53411L7.642 4.43411L7.757 4.04311C7.827 3.80311 7.888 3.59311 7.974 3.40611C8.312 2.66711 8.938 2.15411 9.661 2.02311C9.845 1.99011 10.039 1.99011 10.261 1.99011H13.739C13.962 1.99011 14.156 1.99011 14.339 2.02311C15.062 2.15411 15.689 2.66711 16.026 3.40611C16.112 3.59311 16.173 3.80211 16.244 4.04311L16.358 4.43411L16.388 4.53411C16.568 5.10011 17.128 5.48411 17.658 5.49911H20.228C20.655 5.49911 21 5.89211 21 6.37611C21 6.86011 20.655 7.25311 20.229 7.25311H3.77C3.345 7.25311 3 6.86011 3 6.37611Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.596 21.9901H12.404C15.187 21.9901 16.578 21.9901 17.484 21.1041C18.388 20.2181 18.48 18.7651 18.665 15.8591L18.932 11.6711C19.032 10.0941 19.082 9.30511 18.629 8.80611C18.175 8.30611 17.409 8.30611 15.876 8.30611H8.124C6.591 8.30611 5.824 8.30611 5.371 8.80611C4.917 9.30611 4.967 10.0941 5.068 11.6711L5.335 15.8591C5.52 18.7651 5.612 20.2191 6.517 21.1041C7.422 21.9901 8.813 21.9901 11.596 21.9901ZM10.246 12.1791C10.206 11.7451 9.838 11.4291 9.426 11.4721C9.013 11.5151 8.713 11.9021 8.754 12.3361L9.254 17.5991C9.294 18.0331 9.662 18.3491 10.074 18.3061C10.487 18.2631 10.787 17.8761 10.746 17.4421L10.246 12.1791ZM14.575 11.4721C14.987 11.5151 15.288 11.9021 15.246 12.3361L14.746 17.5991C14.706 18.0331 14.337 18.3491 13.926 18.3061C13.513 18.2631 13.213 17.8761 13.254 17.4421L13.754 12.1791C13.794 11.7451 14.164 11.4291 14.575 11.4721Z"
      fill="currentColor"
    />
  </svg>                                  </button>


                                  <button
                                  type="button"
                                  title="Open board"
                                  onClick={() => handleAddClick(board)}
                                  className="rounded-full p-1.5 hover:bg-slate500_08 dark:hover:bg-slate500_20"
                                >
  <svg
  className="h-4 w-4 text-[#637381] dark:text-[#919EAB]"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fillRule="evenodd"
    clipRule="evenodd"
    d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22ZM12.75 9C12.75 8.80109 12.671 8.61032 12.5303 8.46967C12.3897 8.32902 12.1989 8.25 12 8.25C11.8011 8.25 11.6103 8.32902 11.4697 8.46967C11.329 8.61032 11.25 8.80109 11.25 9V11.25H9C8.80109 11.25 8.61032 11.329 8.46967 11.4697C8.32902 11.6103 8.25 11.8011 8.25 12C8.25 12.1989 8.32902 12.3897 8.46967 12.5303C8.61032 12.671 8.80109 12.75 9 12.75H11.25V15C11.25 15.1989 11.329 15.3897 11.4697 15.5303C11.6103 15.671 11.8011 15.75 12 15.75C12.1989 15.75 12.3897 15.671 12.5303 15.5303C12.671 15.3897 12.75 15.1989 12.75 15V12.75H15C15.1989 12.75 15.3897 12.671 15.5303 12.5303C15.671 12.3897 15.75 12.1989 15.75 12C15.75 11.8011 15.671 11.6103 15.5303 11.4697C15.3897 11.329 15.1989 11.25 15 11.25H12.75V9Z"
    fill="currentColor"
  />
</svg>                                 </button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* ✅ Footer INSIDE row view card */}
                  {!isLoading && tableTotal > 0 && (
                    <div className="border-t border-slate500_12 px-4 py-3 text-[13px] text-[#212B36] dark:border-slate500_20 dark:text-slate500_80 sm:px-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Dense */}
                        <button
                          type="button"
                          onClick={() => setDense((d) => !d)}
                          className="flex items-center gap-2"
                        >
                          <span
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              dense
                                ? "bg-ink dark:bg-ink"
                                : "bg-slate500_20 dark:bg-[#919EAB7A]"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 rounded-full bg-white shadow-soft transform transition-transform ${
                                dense
                                  ? "translate-x-[18px]"
                                  : "translate-x-[2px]"
                              }`}
                            />
                          </span>

                          <span className="whitespace-nowrap text-[#212B36] dark:text-[#E5EAF1]">
                            Dense
                          </span>
                        </button>

                        {/* Controls */}
                        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
                          {/* Rows per page (TABLE) */}
                          <div className="flex items-center gap-2">
                            <span className="hidden whitespace-nowrap text-[#637381] dark:text-slate500_80 sm:inline">
                              Rows per page:
                            </span>

                            <RowsPerPageDropdown
                              open={tableRowsMenuOpen}
                              value={tableRowsPerPage}
                              options={[3, 5, 6, 9]}
                              onToggle={() => setTableRowsMenuOpen((o) => !o)}
                              onClose={() => setTableRowsMenuOpen(false)}
                              onSelect={(v) => handleChangeTableRowsPerPage(v)}
                            />
                          </div>

                          {/* Range */}
                          <span className="whitespace-nowrap text-[#212B36] dark:text-slate500_80">
                            {tableTotal === 0
                              ? "0-0 of 0"
                              : `${tableStartIndex + 1}-${tableEndIndex} of ${tableTotal}`}
                          </span>

                          {/* Pagination */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleTablePrev}
                              disabled={!tableCanPrev}
                              className={`flex h-5 w-5 items-center justify-center ${
                                !tableCanPrev
                                  ? "cursor-default text-slate300 dark:text-slate600"
                                  : "text-slate500 hover:text-slate900 dark:text-slate500_80 dark:hover:text-white"
                              }`}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={handleTableNext}
                              disabled={!tableCanNext}
                              className={`flex h-5 w-5 items-center justify-center ${
                                !tableCanNext
                                  ? "cursor-default text-slate300 dark:text-slate600"
                                  : "text-slate500 hover:text-slate900 dark:text-slate500_80 dark:hover:text-white"
                              }`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* ✅ CARD VIEW FOOTER (separate rows-per-page + MUI-like dropdown) */}
        {!isTableView && !isLoading && cardTotal > 0 && (
          <div className="mx-auto flex w-full items-center justify-between gap-3 px-4 pb-6 pt-4 text-[13px] text-[#212B36] dark:text-slate500_80">
            {/* LEFT */}
            <button
              type="button"
              onClick={() => setDense((d) => !d)}
              className="flex shrink-0 items-center gap-2"
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

              <span className="whitespace-nowrap text-[#212B36] dark:text-[#E5EAF1]">
                Dense
              </span>
            </button>

            {/* RIGHT */}
            <div className="flex min-w-0 flex-1 items-center justify-end gap-5">
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-5 gap-y-2">
                {/* Rows per page (CARD) */}
                <div className="flex items-center gap-2">
                  <span className="hidden whitespace-nowrap text-[#637381] dark:text-slate500_80 sm:inline">
                    Rows per page:
                  </span>

                  <RowsPerPageDropdown
                    open={cardRowsMenuOpen}
                    value={cardRowsPerPage}
                    options={[6, 10, 12, 20]}
                    onToggle={() => setCardRowsMenuOpen((o) => !o)}
                    onClose={() => setCardRowsMenuOpen(false)}
                    onSelect={(v) => handleChangeCardRowsPerPage(v)}
                  />
                </div>

                {/* Range */}
                <span className="whitespace-nowrap text-[#212B36] dark:text-slate500_80">
                  {cardTotal === 0
                    ? "0-0 of 0"
                    : `${cardStartIndex + 1}-${cardEndIndex} of ${cardTotal}`}
                </span>

                {/* Pagination */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCardPrev}
                    disabled={!cardCanPrev}
                    className={`flex h-5 w-5 items-center justify-center ${
                      !cardCanPrev
                        ? "cursor-default text-slate300 dark:text-slate600"
                        : "text-slate500 hover:text-slate900 dark:text-slate500_80 dark:hover:text-white"
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCardNext}
                    disabled={!cardCanNext}
                    className={`flex h-5 w-5 items-center justify-center ${
                      !cardCanNext
                        ? "cursor-default text-slate300 dark:text-slate600"
                        : "text-slate500 hover:text-slate900 dark:text-slate500_80 dark:hover:text-white"
                    }`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Delete Board Confirm Modal */}
        {deleteBoardModal.isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeDeleteBoardConfirm();
            }}
          >
            <div className="w-full max-w-md min-w-0 rounded-[12px] border border-slate500_20 bg-surface p-6 shadow-soft dark:border-slate500_20 dark:bg-[#1B232D]">
              <h3 className="text-xl font-bold text-ink dark:text-white">
                Delete Board?
              </h3>

              <p className="mt-2 min-w-0 whitespace-normal text-slate600 dark:text-slate500_80">
                Are you sure you want to delete{" "}
                <span className="font-semibold break-all">
                  &ldquo;{deleteBoardModal.boardTitle}&rdquo;
                </span>
                ? This action cannot be undone.
              </p>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={closeDeleteBoardConfirm}
  className="
    inline-flex h-10 items-center justify-center rounded-[10px]
    px-4 text-sm font-semibold
    border border-slate500_20 text-ink bg-white
    hover:bg-slate500_08 active:scale-[0.98]
    disabled:cursor-not-allowed disabled:opacity-60
    dark:bg-transparent dark:text-white dark:border-slate500_20
    dark:hover:bg-white/5
    transition
  "                  disabled={deleteBoardModal.isLoading}
                >
                  Cancel 
                </button>

                <button
                  onClick={handleConfirmDeleteBoard}
                  disabled={deleteBoardModal.isLoading}
                  className="btn rounded-[10px] bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteBoardModal.isLoading ? "Deleting..." : "Delete"}
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
      </Shell>
    </>
  );
}

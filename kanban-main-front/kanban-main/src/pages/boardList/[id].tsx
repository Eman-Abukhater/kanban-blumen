// src/pages/boardList/[id].tsx
export const getServerSideProps = async () => ({ props: {} });

import { useState, useEffect, useMemo, useContext, useCallback, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import {
  Eye,
  Edit2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
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
  // Frontend Validation: Check if title exceeds 100 characters
  if (newTitle.length > 100) {
    toast.error("Title must be at most 100 characters.", {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 3000,  // Auto close to prevent UI disruption
      hideProgressBar: true  // Hide progress bar to avoid UI shift
    });
    return;
  }

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

    // ✅ UPDATE #2: add to the TOP (newest first) + go to first page (so you see it instantly)
    setBoards((prev) => [{ boardId, title: newTitle }, ...prev]);
    setCardPage(0);
    setTablePage(0);

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

                              <div className="flex w-24 shrink-0 items-center justify-end gap-3">
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
                                  title="Delete board"
                                  onClick={() => openDeleteBoardConfirm(board)}
                                  className="rounded-full p-1.5 hover:bg-slate500_08 dark:hover:bg-slate500_20"
                                >
                                  <Trash2 className="h-4 w-4 text-slate600 dark:text-slate500_80" />
                                </button>
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
                  className="btn btn-outline"
                  disabled={deleteBoardModal.isLoading}
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmDeleteBoard}
                  disabled={deleteBoardModal.isLoading}
                  className="btn rounded-[10px] bg-red-600 px-2 py-2 text-sm font-semibold text-white hover:bg-red-700 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
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

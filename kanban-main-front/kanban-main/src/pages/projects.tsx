// src/pages/projects.tsx
export const getServerSideProps = async () => ({ props: {} });

import SectionHeader from "@/components/layout/SectionHeader";
import type { GetServerSideProps } from "next";
import {
  useState,
  useEffect,
  useMemo,
  useContext,
  useRef,
  useLayoutEffect,
} from "react";
import { useRouter } from "next/router";
import AddEditProjectModal from "../components/modal/AddEditProjectModal";

import {
  fetchUserProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../services/kanbanApi";

import { toast } from "react-toastify";

import KanbanContext from "../context/kanbanContext";
import ProjectCardSkeleton from "@/components/layout/ProjectCardSkeleton";

import Shell from "@/components/layout/Shell";
import Topbar from "@/components/layout/Topbar";
import ProjectCard from "@/components/kanban/ProjectCard";
import Image from "next/image";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Edit2,
  Trash2,
  Search,
} from "lucide-react";

type SortField = "id" | "title" | "createdBy" | "members" | "artboard";

const PROJECTS_CACHE_KEY = "blumen-projects-cache";

/* ===================== Dynamic Rows Per Page Dropdown ===================== */
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
/* ======================================================================== */

export default function ProjectsList() {
  const { userInfo, handleSetUserInfo } = useContext(KanbanContext);
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // loading states
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const [search, setSearch] = useState("");
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    projectId: number | null;
    projectTitle: string;
  }>({
    isOpen: false,
    projectId: null,
    projectTitle: "",
  });

  // 🔹 footer state
  const [dense, setDense] = useState(false);

  // ✅ Separate pagination for Card View vs Table View
  const [cardRowsPerPage, setCardRowsPerPage] = useState(8); // default should fill 4x2 grid when space exists
  const [cardPage, setCardPage] = useState(0);
  const [cardRowsMenuOpen, setCardRowsMenuOpen] = useState(false);

  const [tableRowsPerPage, setTableRowsPerPage] = useState(6); // keep your table default
  const [tablePage, setTablePage] = useState(0);
  const [tableRowsMenuOpen, setTableRowsMenuOpen] = useState(false);

  // 🔹 view mode: false = cards, true = table (row view)
  const [isTableView, setIsTableView] = useState(false);

  // 🔹 sort state (for table)
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Track navigation
  useEffect(() => {
    const start = () => setIsNavigating(true);
    const done = () => setIsNavigating(false);

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", done);
    router.events.on("routeChangeError", done);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", done);
      router.events.off("routeChangeError", done);
    };
  }, [router]);

  // 🌟 1) Hydrate from local cache (if any)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const cached = window.sessionStorage.getItem(PROJECTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setProjects(parsed);
          setIsLoading(false);
        }
      }
    } catch {
      // ignore cache errors
    }
  }, []);

  // 🌟 2) Ensure userInfo exists (auth check via sessionStorage)
  useEffect(() => {
    if (!router.isReady) return;

    if (!userInfo) {
      const stored = window.sessionStorage.getItem("userData");
      if (!stored) {
        router.push(`/unauthorized`);
        return;
      }
      const parsed = JSON.parse(stored);
      handleSetUserInfo(parsed);
    }
  }, [router.isReady, userInfo, handleSetUserInfo, router]);

  // 🌟 3) Fetch projects once userInfo is available
  useEffect(() => {
    if (!router.isReady || !userInfo) return;

    let cancelled = false;

    const loadProjects = async () => {
      setIsLoading((prev) => prev || projects.length === 0);

      try {
        const res = await fetchUserProjects();
        if (!res || cancelled) return;

        if (res.status === 200 && res.data?.success) {
          const rawProjects = res.data.data || [];
          const filtered = rawProjects.filter((p: any) => p.id !== 1);
          setProjects(filtered);

          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(
              PROJECTS_CACHE_KEY,
              JSON.stringify(filtered)
            );
          }
        } else if (!cancelled) {
          toast.error("Could not fetch projects.", {
            position: toast.POSITION.TOP_CENTER,
          });
        }
      } catch (e: any) {
        if (!cancelled) {
          toast.error(`Fetch error: ${e?.message ?? "unknown"}`, {
            position: toast.POSITION.TOP_CENTER,
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, userInfo]);

  // ✅ show skeleton only if loading lasts >150ms
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

  // Modal controls
  const openEditModal = (project: any | null) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };
  const closeEditModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

  // CRUD handlers
  const handleEditProject = async (
    newTitle: string,
    newDescription: string,
    projectId: number
  ) => {
    try {
      const res = await updateProject(projectId, newTitle, newDescription);
      if (res?.status === 200 && res?.data?.success) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? res.data.data : p))
        );
        toast.success("Project updated successfully!", {
          position: toast.POSITION.TOP_CENTER,
        });
        closeEditModal();
      } else {
        toast.error("Failed to update project.", {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    } catch (e: any) {
      toast.error(`Error: ${e?.message ?? "Failed to update project"}`, {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };

  const handleAddProject = async (newTitle: string, newDescription: string) => {
    try {
      setIsCreatingProject(true);
      const res = await createProject(newTitle, newDescription);

      if (res?.status === 201 && res?.data?.success) {
        // ✅ Add new one first
        setProjects((prev) => [res.data.data, ...prev]);

        // ✅ Ensure you SEE the new project immediately
        setCardPage(0);
        setTablePage(0);

        toast.success("Project created successfully!", {
          position: toast.POSITION.TOP_CENTER,
        });
        closeEditModal();
      } else {
        toast.error("Failed to create project.", {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    } catch (e: any) {
      toast.error(`Error: ${e?.message ?? "Failed to create project"}`, {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteConfirmModal.projectId) return;

    try {
      const idToDelete = deleteConfirmModal.projectId;
      const res = await deleteProject(idToDelete);

      if (res?.status === 200 && res?.data?.success) {
        setProjects((prev) => prev.filter((p) => p.id !== idToDelete));

        // ✅ close modal
        setDeleteConfirmModal({
          isOpen: false,
          projectId: null,
          projectTitle: "",
        });

        // ✅ if current page becomes empty after delete, clamp to last valid page
        // We'll clamp after render using derived totals (below) by just moving one step back safely:
        setCardPage((p) => Math.max(0, p - 1));
        setTablePage((p) => Math.max(0, p - 1));

        toast.success("Project deleted successfully!", {
          position: toast.POSITION.TOP_CENTER,
        });
      } else {
        toast.error("Failed to delete project.", {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    } catch (e: any) {
      toast.error(`Error: ${e?.message ?? "Failed to delete project"}`, {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };

  const openDeleteConfirm = (projectId: number, projectTitle: string) =>
    setDeleteConfirmModal({ isOpen: true, projectId, projectTitle });

  const closeDeleteConfirm = () =>
    setDeleteConfirmModal({
      isOpen: false,
      projectId: null,
      projectTitle: "",
    });

  const handleViewProject = (project: any) => {
    if (!userInfo) return;
    handleSetUserInfo({
      ...userInfo,
      fkpoid: project.id,
      projectTitle: project.title,
    });
    router.push(`/boardList/${project.id}`);
  };

  // search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p: any) =>
      [p.title, p.description, p.createdBy?.username].some((v: any) =>
        String(v ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [projects, search]);

  /* =========================
     ✅ CARD VIEW ORDER + PAGINATION
     - Always show newest first (so new project appears instantly)
     - Use cardRowsPerPage (default 8), NOT the table rows-per-page
  ========================== */
  const cardSorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => (b.id ?? 0) - (a.id ?? 0)); // newest first by id
    return arr;
  }, [filtered]);

  const cardTotal = cardSorted.length;
  const cardStartIndex = cardPage * cardRowsPerPage;
  const cardEndIndex = Math.min(cardStartIndex + cardRowsPerPage, cardTotal);
  const cardPaginated = cardSorted.slice(cardStartIndex, cardEndIndex);
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
     ✅ TABLE VIEW SORT + PAGINATION
     - Keep your existing sortable table logic
  ========================== */
  const tableSorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortField === "id") {
        cmp = (a.id ?? 0) - (b.id ?? 0);
      } else if (sortField === "title") {
        cmp = (a.title ?? "").localeCompare(b.title ?? "");
      } else if (sortField === "createdBy") {
        cmp = (a.createdBy?.username ?? "").localeCompare(
          b.createdBy?.username ?? ""
        );
      } else {
        cmp = (a.id ?? 0) - (b.id ?? 0);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortField, sortDirection]);

  const tableTotal = tableSorted.length;
  const tableStartIndex = tablePage * tableRowsPerPage;
  const tableEndIndex = Math.min(tableStartIndex + tableRowsPerPage, tableTotal);
  const tablePaginated = tableSorted.slice(tableStartIndex, tableEndIndex);
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

  // ✅ IMPORTANT: render shell always
  return (
    <>
      <Shell>
        <Topbar />

        <SectionHeader
          search={search}
          setSearch={setSearch}
          onCreate={() => openEditModal(null)}
          createLabel="Create Project"
          isTableView={isTableView}
          onChangeViewMode={(mode) => {
            const nextIsTable = mode === "table";
            setIsTableView(nextIsTable);
            // close menus on switch
            setCardRowsMenuOpen(false);
            setTableRowsMenuOpen(false);
          }}
        />

        <section className="mx-auto w-full px-5 py-6">
          {!userInfo ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <ProjectCardSkeleton count={8} />
            </div>
          ) : (
            <>
              {/* =================== CARD VIEW =================== */}
              {!isTableView ? (
                <>
                  {showSkeleton ? (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      <ProjectCardSkeleton count={8} />
                    </div>
                  ) : cardTotal === 0 ? (
                    <div className="card p-10 text-center">
                      <h3 className="text-[18px] font-semibold text-ink dark:text-white">
                        No Projects
                      </h3>
                      <p className="text-muted mt-1 dark:text-slate500_80">
                        Try creating a new project or clear the search.
                      </p>
                      <button
                        className="btn-dark mt-4"
                        onClick={() => openEditModal(null)}
                      >
                        Create Project
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {isCreatingProject && <ProjectCardSkeleton count={1} />}
                      {cardPaginated.map((project: any) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onView={() => handleViewProject(project)}
                          onEdit={() => openEditModal(project)}
                          onDelete={() =>
                            openDeleteConfirm(project.id, project.title)
                          }
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* =================== TABLE / ROW VIEW =================== */
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
                    <div className="min-w-[900px]">
                      {/* Header row */}
                      <div className="flex items-center border-b border-slate500_12 bg-[#F4F6F8] px-6 py-4 text-[13px] font-medium text-slate600 dark:border-slate500_20 dark:bg-[#141A21] dark:text-slate500_80">
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
                          <span>Project Name</span>
                          {renderSortIcon("title")}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSortClick("createdBy")}
                          className="flex w-32 shrink-0 items-center gap-1 text-left"
                        >
                          <span>Created By</span>
                          {renderSortIcon("createdBy")}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSortClick("members")}
                          className="flex w-24 shrink-0 items-center gap-1 text-left"
                        >
                          <span>Member(s)</span>
                          {renderSortIcon("members")}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSortClick("artboard")}
                          className="flex w-24 shrink-0 items-center gap-1 text-left"
                        >
                          <span>Artboard</span>
                          {renderSortIcon("artboard")}
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
                              <div className="w-32 shrink-0">
                                <div className="h-4 w-3/4 rounded bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                              <div className="w-24 shrink-0">
                                <div className="h-4 w-10 rounded bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                              <div className="w-24 shrink-0">
                                <div className="h-4 w-10 rounded bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                              <div className="flex w-24 shrink-0 items-center justify-end gap-3">
                                <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                                <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                                <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                              </div>
                            </div>
                          ))}
                        </>
                      ) : tableTotal === 0 ? (
                        <div className="p-10 text-center">
                          <h3 className="text-[18px] font-semibold text-ink dark:text-white">
                            No Projects
                          </h3>
                          <p className="mt-1 text-[14px] text-[#637381] dark:text-slate500_80">
                            Try creating a new project or clear the search.
                          </p>
                          <button
                            type="button"
                            onClick={() => openEditModal(null)}
                            className="mt-4 inline-flex h-9 items-center justify-center rounded-[10px] bg-ink px-5 text-[14px] font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] hover:opacity-95 dark:bg-white dark:text-[#1C252E] dark:shadow-none"
                          >
                            Create Project
                          </button>
                        </div>
                      ) : (
                        <>
                          {tablePaginated.map((project: any) => (
                            <div
                              key={project.id}
                              className="flex items-center border-b border-dashed border-slate500_12 px-6 py-4 text-[14px] text-ink last:border-b-0 dark:border-slate500_20 dark:text-slate500_80"
                            >
                              <div className="w-10 shrink-0">
                                <input
                                  type="checkbox"
                                  className="border-1 h-4 w-4 rounded-[6px] border-[#1C252E] text-brand focus:ring-0 dark:border-slate500_20"
                                />
                              </div>

                              <div className="w-16 shrink-0 dark:text-slate500_80">
                                {String(project.id).padStart(3, "0")}
                              </div>

                              <div className="flex-1 min-w-0">
                                <span className="block whitespace-normal break-words">
                                  {project.title ?? "Project title"}
                                </span>
                              </div>

                              <div className="w-32 shrink-0 text-[#1C252E] dark:text-[#FFFFFF]">
                                {project.createdBy?.username ?? "Admin"}
                              </div>

                              <div className="w-24 shrink-0 text-[#1C252E] dark:text-[#FFFFFF]">
                                20+
                              </div>

                              <div className="w-24 shrink-0 dark:text-[#FFFFFF]">
                                20+
                              </div>

                              <div className="flex w-24 shrink-0 items-center justify-end gap-3">
                                <button
                                  type="button"
                                  title="Open board"
                                  onClick={() => handleViewProject(project)}
                                  className="rounded-full p-1.5 hover:bg-slate500_08 dark:hover:bg-slate500_20"
                                >
                                  <Eye className="h-4 w-4 text-slate600 dark:text-slate500_80" />
                                </button>

                                <button
                                  type="button"
                                  title="Edit project"
                                  onClick={() => openEditModal(project)}
                                  className="rounded-full p-1.5 hover:bg-slate500_08 dark:hover:bg-slate500_20"
                                >
                                  <Edit2 className="h-4 w-4 text-slate600 dark:text-slate500_80" />
                                </button>

                                <button
                                  type="button"
                                  title="Delete project"
                                  onClick={() =>
                                    openDeleteConfirm(project.id, project.title)
                                  }
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

                  {/* ✅ Footer INSIDE the table card */}
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
                          {/* Rows per page */}
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

        {/* Footer (CARD VIEW) */}
        {!isTableView && !isLoading && cardTotal > 0 && (
          <div className="mx-auto flex w-full items-center justify-between gap-3 px-4 pb-6 pt-4 text-[13px] text-[#212B36] dark:text-slate500_80">
            {/* LEFT: Dense */}
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

            {/* RIGHT: controls */}
            <div className="flex min-w-0 flex-1 items-center justify-end gap-5">
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-5 gap-y-2">
                {/* Rows per page (CARD VIEW) */}
                <div className="flex items-center gap-2">
                  <span className="hidden whitespace-nowrap text-[#637381] dark:text-slate500_80 sm:inline">
                    Rows per page:
                  </span>

                  <RowsPerPageDropdown
                    open={cardRowsMenuOpen}
                    value={cardRowsPerPage}
                    options={[4, 8, 12, 16]}
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

        <AddEditProjectModal
          isOpen={isModalOpen}
          onClose={closeEditModal}
          handleEditProject={handleEditProject}
          handleAddProject={handleAddProject}
          project={selectedProject}
        />

        {deleteConfirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md min-w-0 rounded-[12px] border border-slate500_20 bg-surface p-6 shadow-soft dark:border-slate500_20 dark:bg-[#1B232D]">
              <h3 className="text-xl font-bold text-ink dark:text-white">
                Delete Project?
              </h3>

              <p className="mt-2 min-w-0 whitespace-normal text-slate600 dark:text-slate500_80">
                Are you sure you want to delete{" "}
                <span className="font-semibold break-all">
                  &ldquo;{deleteConfirmModal.projectTitle}&rdquo;
                </span>
                ? This action cannot be undone.
              </p>

              <div className="mt-6 flex justify-end gap-2">
                <button onClick={closeDeleteConfirm} className="btn btn-outline">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="btn rounded-[10px] bg-red-600 px-2 py-2 text-sm font-semibold text-white hover:bg-red-700 hover:opacity-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-10" />
      </Shell>
    </>
  );
}

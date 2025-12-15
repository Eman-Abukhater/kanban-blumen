// src/pages/projects.tsx
export const getServerSideProps = async () => ({ props: {} });

import SectionHeader from "@/components/layout/SectionHeader";
import type { GetServerSideProps } from "next";
import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/router";
import AddEditProjectModal from "../components/modal/AddEditProjectModal";

import {
  fetchUserProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../services/kanbanApi";

import { ToastContainer, toast } from "react-toastify";

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

export default function ProjectsList() {
  const { userInfo, handleSetUserInfo } = useContext(KanbanContext);
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const [rowsPerPage, setRowsPerPage] = useState(6); // default 6 rows/cards
  const [page, setPage] = useState(0); // 0-based page index
  const [rowsMenuOpen, setRowsMenuOpen] = useState(false);

  // 🔹 view mode: false = cards, true = table (row view)
  const [isTableView, setIsTableView] = useState(false);

  // 🔹 sort state (for table)
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Track navigation (optional visual tweak)
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

  // 🌟 1) Hydrate from local cache (if any) to avoid empty page when data already exists
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = window.sessionStorage.getItem(PROJECTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setProjects(parsed);
          // we already have something to show → no need for skeleton while fresh data loads
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
      // only show skeleton if we don't already have cached projects
      setIsLoading((prev) => prev || projects.length === 0);

      try {
        const res = await fetchUserProjects();
        if (!res || cancelled) return;

        if (res.status === 200 && res.data?.success) {
          const rawProjects = res.data.data || [];
          // filter out default project id = 1
          const filtered = rawProjects.filter((p: any) => p.id !== 1);
          setProjects(filtered);

          // update cache
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
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, userInfo]);

  // reset page when search or rowsPerPage change
  useEffect(() => {
    setPage(0);
  }, [search, rowsPerPage]);

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
        setProjects((prev) => [res.data.data, ...prev]);
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
      const res = await deleteProject(deleteConfirmModal.projectId);
      if (res?.status === 200 && res?.data?.success) {
        setProjects((prev) =>
          prev.filter((p) => p.id !== deleteConfirmModal.projectId)
        );
        toast.success("Project deleted successfully!", {
          position: toast.POSITION.TOP_CENTER,
        });
        setDeleteConfirmModal({
          isOpen: false,
          projectId: null,
          projectTitle: "",
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

  // sort (for table view + cards so order is same)
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortField === "id") {
        cmp = a.id - b.id;
      } else if (sortField === "title") {
        cmp = (a.title ?? "").localeCompare(b.title ?? "");
      } else if (sortField === "createdBy") {
        cmp = (a.createdBy?.username ?? "").localeCompare(
          b.createdBy?.username ?? ""
        );
      } else {
        // members / artboard – no real data, fallback to id
        cmp = a.id - b.id;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortField, sortDirection]);

  // pagination calculations
  const total = sorted.length;
  const startIndex = page * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, total);
  const paginated = sorted.slice(startIndex, endIndex);

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

  return (
    <>
      {!isNavigating && userInfo && (
        <Shell>
          <Topbar />

          <SectionHeader
            search={search}
            setSearch={setSearch}
            onCreate={() => openEditModal(null)}
            createLabel="Create Project"
            isTableView={isTableView}
            onChangeViewMode={(mode) => setIsTableView(mode === "table")}
          />

          <section className="mx-auto max-w-[1120px] px-3 py-6">
            {/* =================== CARD VIEW =================== */}
            {!isTableView ? (
              <>
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <ProjectCardSkeleton count={6} />
                  </div>
                ) : total === 0 ? (
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
                  <div
                    className={`grid gap-5 ${
                      dense
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    }`}
                  >
                    {isCreatingProject && <ProjectCardSkeleton count={1} />}
                    {paginated.map((project: any) => (
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
              <div className="overflow-hidden rounded-[24px] border border-slate500_12 bg-white dark:border-slate500_20 dark:bg-[#1B232D]">
                {/* Search + icons INSIDE card top bar */}
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
                    {/* Filter (visual) */}
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
                <div className="flex items-center border-b border-slate500_12 bg-[#F4F6F8] px-6 py-4 text-[13px] font-medium text-slate600 dark:border-slate500_20 dark:bg-[#141A21] dark:text-slate500_80">
                  {/* checkbox col */}
                  <div className="w-10">
                    <input
                      type="checkbox"
                      className="border-1 h-4 w-4 rounded-[6px] border-[#1C252E] text-brand focus:ring-0 dark:border-slate500_20"
                    />
                  </div>

                  {/* ID */}
                  <button
                    type="button"
                    onClick={() => handleSortClick("id")}
                    className="flex w-16 items-center gap-1 text-left"
                  >
                    <span>ID</span>
                    {renderSortIcon("id")}
                  </button>

                  {/* Project Name */}
                  <button
                    type="button"
                    onClick={() => handleSortClick("title")}
                    className="flex flex-1 items-center gap-1 text-left"
                  >
                    <span>Project Name</span>
                    {renderSortIcon("title")}
                  </button>

                  {/* Created By */}
                  <button
                    type="button"
                    onClick={() => handleSortClick("createdBy")}
                    className="flex w-32 items-center gap-1 text-left"
                  >
                    <span>Created By</span>
                    {renderSortIcon("createdBy")}
                  </button>

                  {/* Member(s) */}
                  <button
                    type="button"
                    onClick={() => handleSortClick("members")}
                    className="flex w-24 items-center gap-1 text-left"
                  >
                    <span>Member(s)</span>
                    {renderSortIcon("members")}
                  </button>

                  {/* Artboard */}
                  <button
                    type="button"
                    onClick={() => handleSortClick("artboard")}
                    className="flex w-24 items-center gap-1 text-left"
                  >
                    <span>Artboard</span>
                    {renderSortIcon("artboard")}
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
                        <div className="w-32">
                          <div className="h-4 w-3/4 rounded bg-slate500_12 dark:bg-slate500_20" />
                        </div>
                        <div className="w-24">
                          <div className="h-4 w-10 rounded bg-slate500_12 dark:bg-slate500_20" />
                        </div>
                        <div className="w-24">
                          <div className="h-4 w-10 rounded bg-slate500_12 dark:bg-slate500_20" />
                        </div>
                        <div className="flex w-24 items-center justify-end gap-3">
                          <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                          <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                          <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : total === 0 ? (
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
                    {isCreatingProject && (
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
                        <div className="w-32">
                          <div className="h-4 w-3/4 rounded bg-slate500_12 dark:bg-slate500_20" />
                        </div>
                        <div className="w-24">
                          <div className="h-4 w-10 rounded bg-slate500_12 dark:bg-slate500_20" />
                        </div>
                        <div className="w-24">
                          <div className="h-4 w-10 rounded bg-slate500_12 dark:bg-slate500_20" />
                        </div>
                        <div className="flex w-24 items-center justify-end gap-3">
                          <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                          <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                          <div className="h-4 w-4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
                        </div>
                      </div>
                    )}

                    {paginated.map((project: any) => (
                      <div
                        key={project.id}
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
                        <div className="text-[[#1C252E] w-16 dark:text-slate500_80">
                          {String(project.id).padStart(3, "0")}
                        </div>

                        {/* Project Name */}
                        <div className="flex-1">
                          {project.title ?? "Project title"}
                        </div>

                        {/* Created By */}
                        <div className="w-32 text-[#1C252E] dark:text-[#FFFFFF]">
                          {project.createdBy?.username ?? "Admin"}
                        </div>

                        {/* Member(s) – static for now */}
                        <div className="w-24  text-[#1C252E] dark:text-[#FFFFFF]">
                          20+
                        </div>

                        {/* Artboard – static for now */}
                        <div className="text-[[#1C252E] w-24 dark:text-[#FFFFFF]">
                          20+
                        </div>

                        {/* actions */}
                        <div className="flex w-24 items-center justify-end gap-3">
                          {/* View */}
                          <button
                            type="button"
                            title="Open board"
                            onClick={() => handleViewProject(project)}
                            className="hover:bg-slate500_08 rounded-full p-1.5 dark:hover:bg-slate500_20"
                          >
                            <Eye className="h-4 w-4 text-slate600 dark:text-slate500_80" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            title="Edit project"
                            onClick={() => openEditModal(project)}
                            className="hover:bg-slate500_08 rounded-full p-1.5 dark:hover:bg-slate500_20"
                          >
                            <Edit2 className="h-4 w-4 text-slate600 dark:text-slate500_80" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            title="Delete project"
                            onClick={() =>
                              openDeleteConfirm(project.id, project.title)
                            }
                            className="hover:bg-slate500_08 rounded-full p-1.5 dark:hover:bg-slate500_20"
                          >
                            <Trash2 className="h-4 w-4 text-slate600 dark:text-slate500_80" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </section>

          {/* 🔹 DENSE + PAGINATION FOOTER (shared for both views) */}
          {!isLoading && total > 0 && (
            <div className="mx-auto flex max-w-[1120px] items-center justify-between pb-6 pt-4 text-[13px] text-[#212B36] dark:text-slate500_80">
              {/* Dense toggle – visual switch, follows theme */}
              <button
                type="button"
                onClick={() => setDense((d) => !d)}
                className="flex items-center gap-2"
              >
                {/* switch */}
                <span
                  className={`
                    relative inline-flex h-5 w-9 items-center rounded-full
                    transition-colors
                    ${
                      dense
                        ? "bg-ink dark:bg-ink"
                        : "bg-slate500_20 dark:bg-[#919EAB7A]"
                    }
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 rounded-full bg-white shadow-soft
                      transform transition-transform
                      ${dense ? "translate-x-[18px]" : "translate-x-[2px]"}
                    `}
                  />
                </span>

                {/* label */}
                <span className="text-[#212B36] dark:text-[#E5EAF1]">
                  Dense
                </span>
              </button>

              {/* Right side: rows per page + range + arrows */}
              <div className="flex items-center gap-5">
                {/* Rows per page */}
                <div className="flex items-center gap-2">
                  <span className="text-[#637381] dark:text-slate500_80">
                    Rows per page:
                  </span>

                  <div className="relative">
                    {/* trigger – value + chevron */}
                    <button
                      type="button"
                      onClick={() => setRowsMenuOpen((o) => !o)}
                      className="flex items-center gap-1 text-[13px] text-[#111827] dark:text-[#F9FAFB]"
                    >
                      {rowsPerPage}
                      <ChevronDown className="h-4 w-4 text-slate500 dark:text-slate500_80" />
                    </button>

                    {/* dropdown menu */}
                    {rowsMenuOpen && (
                      <div
                        className="
                          absolute right-0 mt-1 w-20 rounded-[12px]
                          border border-slate500_20 bg-white/98
                          shadow-[0_18px_45px_rgba(145,158,171,0.24)]
                          dark:border-[#1F2937] dark:bg-[#050B14]
                        "
                      >
                        {[3, 5, 6, 9].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleChangeRowsPerPage(option)}
                            className={`
                              flex w-full items-center justify-between px-3 py-1
                              text-left text-[13px]
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

                {/* Range text */}
                <span className="text-[#212B36] dark:text-slate500_80">
                  {total === 0
                    ? "0-0 of 0"
                    : `${startIndex + 1}-${endIndex} of ${total}`}
                </span>

                {/* Arrows */}
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

          {/* Add / Edit modal */}
          <AddEditProjectModal
            isOpen={isModalOpen}
            onClose={closeEditModal}
            handleEditProject={handleEditProject}
            handleAddProject={handleAddProject}
            project={selectedProject}
          />

          {/* Delete Confirmation Modal */}
          {deleteConfirmModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-[12px] border border-slate500_20 bg-surface p-6 shadow-soft dark:border-slate500_20 dark:bg-[#1B232D]">
                <h3 className="text-xl font-bold text-ink dark:text-white">
                  Delete Project?
                </h3>
                <p className="mt-2 text-slate600 dark:text-slate500_80">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">
                    &ldquo;{deleteConfirmModal.projectTitle}&rdquo;
                  </span>
                  ? This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={closeDeleteConfirm}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    className="btn bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

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

          <div className="h-10" />
        </Shell>
      )}
    </>
  );
}

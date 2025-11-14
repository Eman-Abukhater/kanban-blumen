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
import dynamic from "next/dynamic";

const LottieClient = dynamic(() => import("@/components/LottieClient"), { ssr: false });
import animation_space from "../../public/animationRocket.json";

import KanbanContext from "../context/kanbanContext";
import ProjectCardSkeleton from "@/components/layout/ProjectCardSkeleton";

import Shell from "@/components/layout/Shell";
import Topbar from "@/components/layout/Topbar";
import ProjectCard from "@/components/kanban/ProjectCard";

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

  // Track navigation to hide content immediately
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

  // Auth check + fetch projects
  useEffect(() => {
    if (!router.isReady) return;

    const run = async () => {
      if (!userInfo) {
        const stored = window.sessionStorage.getItem("userData");
        if (!stored) {
          router.push(`/unauthorized`);
          return;
        }
        handleSetUserInfo(JSON.parse(stored));
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetchUserProjects();
        if (res?.status === 200 && res?.data?.success) {
          // filter out default project id = 1
          const filtered = (res.data.data || []).filter((p: any) => p.id !== 1);
          setProjects(filtered);
        } else {
          toast.error("Could not fetch projects.", { position: toast.POSITION.TOP_CENTER });
        }
      } catch (e: any) {
        toast.error(`Fetch error: ${e?.message ?? "unknown"}`, { position: toast.POSITION.TOP_CENTER });
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [router.isReady, userInfo, handleSetUserInfo, router]);

  // Modal controls
  const openEditModal = (project: any) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };
  const closeEditModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

  // CRUD handlers
  const handleEditProject = async (newTitle: string, newDescription: string, projectId: number) => {
    try {
      const res = await updateProject(projectId, newTitle, newDescription);
      if (res?.status === 200 && res?.data?.success) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? res.data.data : p)));
        toast.success("Project updated successfully!", { position: toast.POSITION.TOP_CENTER });
        closeEditModal();
      } else {
        toast.error("Failed to update project.", { position: toast.POSITION.TOP_CENTER });
      }
    } catch (e: any) {
      toast.error(`Error: ${e?.message ?? "Failed to update project"}`, { position: toast.POSITION.TOP_CENTER });
    }
  };

  const handleAddProject = async (newTitle: string, newDescription: string) => {
    try {
      setIsCreatingProject(true);
      const res = await createProject(newTitle, newDescription);
      if (res?.status === 201 && res?.data?.success) {
        setProjects((prev) => [res.data.data, ...prev]);
        toast.success("Project created successfully!", { position: toast.POSITION.TOP_CENTER });
        closeEditModal();
      } else {
        toast.error("Failed to create project.", { position: toast.POSITION.TOP_CENTER });
      }
    } catch (e: any) {
      toast.error(`Error: ${e?.message ?? "Failed to create project"}`, { position: toast.POSITION.TOP_CENTER });
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteConfirmModal.projectId) return;

    try {
      const res = await deleteProject(deleteConfirmModal.projectId);
      if (res?.status === 200 && res?.data?.success) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteConfirmModal.projectId));
        toast.success("Project deleted successfully!", { position: toast.POSITION.TOP_CENTER });
        setDeleteConfirmModal({ isOpen: false, projectId: null, projectTitle: "" });
      } else {
        toast.error("Failed to delete project.", { position: toast.POSITION.TOP_CENTER });
      }
    } catch (e: any) {
      toast.error(`Error: ${e?.message ?? "Failed to delete project"}`, { position: toast.POSITION.TOP_CENTER });
    }
  };

  const openDeleteConfirm = (projectId: number, projectTitle: string) =>
    setDeleteConfirmModal({ isOpen: true, projectId, projectTitle });
  const closeDeleteConfirm = () =>
    setDeleteConfirmModal({ isOpen: false, projectId: null, projectTitle: "" });

  const handleViewProject = (project: any) => {
    handleSetUserInfo({ ...userInfo, fkpoid: project.id, projectTitle: project.title });
    router.push(`/boardList/${project.id}`);
  };

  // search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p: any) =>
      [p.title, p.description, p.createdBy?.username].some((v: any) =>
        String(v ?? "").toLowerCase().includes(q)
      )
    );
  }, [projects, search]);

  return (
    <>
      {/* Hide content during navigation to prevent flash */}
      {!isNavigating && userInfo && (
        <Shell>
         <Topbar onCreate={() => openEditModal(null)} />
         <SectionHeader search={search} setSearch={setSearch} />

      

          <section className="mx-auto max-w-[1120px] px-6 py-6">            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <ProjectCardSkeleton count={6} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="card p-10 text-center">
                <h3 className="text-[18px] font-semibold">No Projects</h3>
                <p className="text-muted mt-1">Try creating a new project or clear the search.</p>
                <button className="btn-dark mt-4" onClick={() => openEditModal(null)}>
                  Create Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {isCreatingProject && <ProjectCardSkeleton count={1} />}
                {filtered.map((project: any) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onView={() => handleViewProject(project)}
                    onEdit={() => openEditModal(project)}
                    onDelete={() => openDeleteConfirm(project.id, project.title)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Add / Edit modal (unchanged) */}
          <AddEditProjectModal
            isOpen={isModalOpen}
            onClose={closeEditModal}
            handleEditProject={handleEditProject}
            handleAddProject={handleAddProject}
            project={selectedProject}
          />

          {/* Delete Confirmation Modal (kept, restyled slightly by your tokens) */}
          {deleteConfirmModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-[12px] border border-slate500_20 bg-surface p-6 shadow-soft">
                <h3 className="text-xl font-bold text-ink">Delete Project?</h3>
                <p className="mt-2 text-slate600">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">&ldquo;{deleteConfirmModal.projectTitle}&rdquo;</span>?
                  This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={closeDeleteConfirm} className="btn btn-outline">
                    Cancel
                  </button>
                  <button onClick={handleDeleteProject} className="btn bg-red-600 text-white hover:bg-red-700">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          <ToastContainer />
          <div className="h-10" />
        </Shell>
      )}
    </>
  );
}

export const getServerSideProps = async () => ({
  props: {},
});
import type { GetServerSideProps } from "next";
import { useState, useEffect, useMemo } from "react";
import AddEditProjectModal from "../components/modal/AddEditProjectModal";
import { useRouter } from "next/router";
import {
  fetchUserProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../services/kanbanApi";
import { ToastContainer, toast } from "react-toastify";
import dynamic from "next/dynamic";
const LottieClient = dynamic(() => import("@/components/LottieClient"), {
  ssr: false,
});
import animation_space from "../../public/animationRocket.json";
import animationSettings from "../../public/animationSettings.json";
import KanbanContext from "../context/kanbanContext";
import { useContext } from "react";
import LoadingPage2 from "@/components/layout/LoadingPage2";
import ProjectCardSkeleton from "@/components/layout/ProjectCardSkeleton";

export default function ProjectsList() {
  const { userInfo, handleSetUserInfo } = useContext(KanbanContext);
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
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

  // Check auth and fetch projects
  useEffect(() => {
    if (!router.isReady) return;

    const checkUserAndFetchProjects = async () => {
      // Check if user is authenticated
      if (!userInfo) {
        const stored = window.sessionStorage.getItem("userData");
        if (!stored) {
          router.push(`/unauthorized`);
          return;
        }
        const u = JSON.parse(stored);
        // If we have stored user data, set it in context
        handleSetUserInfo(u);
        return;
      }

      // Fetch projects
      try {
        setIsLoading(true);
        const res = await fetchUserProjects();

        if (res?.status === 200 && res?.data?.success) {
          // 🔒 Filter out default project (ID 1) from UI display
          const filteredProjects = (res.data.data || []).filter(
            (project: any) => project.id !== 1
          );
          setProjects(filteredProjects);
        } else {
          toast.error("Could not fetch projects.", {
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

    checkUserAndFetchProjects();
  }, [router.isReady, userInfo]);

  const openEditModal = (project: any) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

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

  const openDeleteConfirm = (projectId: number, projectTitle: string) => {
    setDeleteConfirmModal({ isOpen: true, projectId, projectTitle });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmModal({ isOpen: false, projectId: null, projectTitle: "" });
  };

  const handleViewProject = (project: any) => {
    // Update user info with selected project
    handleSetUserInfo({
      ...userInfo,
      fkpoid: project.id,
      projectTitle: project.title,
    });

    // Navigate to board list for this project
    router.push(`/boardList/${project.id}`);
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
                style={{ height: "240px" }}
              >
                <LottieClient
                  style={{ height: "220px" }}
                  animationData={animation_space}
                  loop
                />
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
                  style={{ width: "57px" }}
                >
                  <LottieClient animationData={animationSettings} loop />
                </div>
                <div className="btn-shine">
                  <span>My Projects</span>
                </div>
              </h1>

              {isLoading ? (
                // Show skeleton while loading projects
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ProjectCardSkeleton count={4} />
                </div>
              ) : projects.length === 0 ? (
                <div className="rounded-lg bg-white p-8 text-center shadow-md">
                  <h3 className="mb-2 text-xl font-semibold text-gray-700">
                    No Projects Yet
                  </h3>
                  <p className="mb-4 text-gray-500">
                    Get started by creating your first project!
                  </p>
                  <button
                    className="rounded-md bg-green-500 px-6 py-3 text-white transition-colors focus:outline-none hover:bg-green-600"
                    onClick={() => openEditModal(null)}
                  >
                    Create Your First Project
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {isCreatingProject && <ProjectCardSkeleton count={1} />}
                  {projects.map((project: any, index: number) => (
                    <div
                      key={project.id || index}
                      className="relative flex flex-col justify-between rounded-md bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
                    >
                      <div>
                        <h2 className="mb-2 truncate text-lg font-semibold">
                          <span className="block text-xs text-gray-500">
                            ID: {project.id}
                          </span>
                          {project.title}
                        </h2>

                        {project.description && (
                          <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                            {project.description}
                          </p>
                        )}

                        <div className="mb-3 flex items-center text-xs text-gray-500">
                          <span>
                            Created by:{" "}
                            {project.createdBy?.username || "Unknown"}
                          </span>
                        </div>

                        {project.boards && project.boards.length > 0 && (
                          <div className="mb-3 text-xs text-gray-500">
                            <span>📋 {project.boards.length} board(s)</span>
                          </div>
                        )}

                        {project.members && project.members.length > 0 && (
                          <div className="mb-3 flex items-center text-xs text-gray-500">
                            <span>👥 {project.members.length} member(s)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end space-x-3">
                        <button
                          className="rounded-full bg-blue-500 p-2 text-white transition-colors focus:outline-none hover:bg-blue-600"
                          onClick={() => handleViewProject(project)}
                          title="View Project Boards"
                        >
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
                        <button
                          className="rounded-full bg-amber-500 p-2 text-white transition-colors focus:outline-none hover:bg-amber-600"
                          onClick={() => openEditModal(project)}
                          title="Rename Project"
                        >
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
                          className="rounded-full bg-red-500 p-2 text-white transition-colors focus:outline-none hover:bg-red-600"
                          onClick={() =>
                            openDeleteConfirm(project.id, project.title)
                          }
                          title="Delete Project"
                        >
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
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {projects.length < 21 && (
                <button
                  className="fixed bottom-4 right-4 rounded-full bg-green-500 p-4 text-white transition-colors focus:outline-none hover:bg-green-600"
                  onClick={() => openEditModal(null)}
                  title="Create New Project"
                >
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

              <AddEditProjectModal
                isOpen={isModalOpen}
                onClose={closeEditModal}
                handleEditProject={handleEditProject}
                handleAddProject={handleAddProject}
                project={selectedProject}
              />

              {/* Delete Confirmation Modal */}
              {deleteConfirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                    <h3 className="mb-4 text-xl font-bold text-gray-900">
                      Delete Project?
                    </h3>
                    <p className="mb-6 text-gray-700">
                      Are you sure you want to delete{" "}
                      <span className="font-semibold">
                        "{deleteConfirmModal.projectTitle}"
                      </span>
                      ? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={closeDeleteConfirm}
                        className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition-colors focus:outline-none hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteProject}
                        className="rounded-md bg-red-500 px-4 py-2 text-white transition-colors focus:outline-none hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "72px" }} />
            </div>
            <ToastContainer />
          </div>
        </div>
      )}
    </>
  );
}

// src/components/modal/AddEditProjectModal.tsx
import { useEffect, useState, FormEvent } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  project: any | null;
  handleAddProject: (title: string, description: string) => Promise<void>;
  handleEditProject: (
    title: string,
    description: string,
    projectId: number
  ) => Promise<void>;
};

export default function AddEditProjectModal({
  isOpen,
  onClose,
  project,
  handleAddProject,
  handleEditProject,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = Boolean(project);

  // Fill fields when editing
  useEffect(() => {
    if (isOpen && project) {
      setTitle(project.title ?? "");
      setDescription(project.description ?? "");
    }
    if (isOpen && !project) {
      setTitle("");
      setDescription("");
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      if (isEditMode) {
        await handleEditProject(title.trim(), description.trim(), project.id);
      } else {
        await handleAddProject(title.trim(), description.trim());
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      {/* Modal container */}
      <div className="w-full max-w-xl rounded-[24px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] dark:bg-[#1C252E] dark:shadow-none">
        <form onSubmit={onSubmit}>
          {/* Header */}
          <div className="px-8 py-6">
            <h2 className="text-[20px] font-semibold leading-[28px] text-ink dark:text-white">
              {isEditMode ? "Edit Project" : "Add New Project"}
            </h2>
          </div>

          {/* Body */}
          <div className="space-y-4 px-8 pb-2">
            {/* Title field with floating label */}
            <div className="relative">
              <label className="pointer-events-none absolute -top-2 left-3 inline-flex bg-white px-1 text-[13px] font-medium text-[#637381] dark:bg-[#1C252E] dark:text-slate500_80">
                Add Title
                <span className="ml-0.5 text-[#FF5630]">*</span>
              </label>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="--"
                className="h-[56px] w-full rounded-[12px] border border-slate500_12 bg-white px-3 pt-3 text-[14px] text-ink outline-none transition focus:border-[#1D7BF5] focus:ring-2 focus:ring-[#1D7BF5]/20 dark:border-slate500_20 dark:bg-[#1C252E] dark:text-slate500_80"
              />
            </div>

            {/* Description field with floating label */}
            <div className="relative">
              <label className="pointer-events-none absolute -top-2 left-3 inline-flex bg-white px-1 text-[13px] font-medium text-[#637381] dark:bg-[#1C252E] dark:text-slate500_80">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="--"
                rows={4}
                className="w-full rounded-[12px] border border-slate500_12 bg-white px-3 pt-3 text-[14px] text-ink outline-none transition focus:border-[#1D7BF5] focus:ring-2 focus:ring-[#1D7BF5]/20 dark:border-slate500_20 dark:bg-[#1C252E] dark:text-slate500_80"
              />
            </div>
          </div>

          {/* Footer / actions */}
          <div className="flex items-center justify-end gap-3 px-8 py-5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-slate500_20 px-4 text-[14px] font-semibold text-[#1C252E] hover:bg-slate500_08 dark:border-[#919EAB52] dark:text-white dark:hover:bg-[#232C36]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="h-10 rounded-[10px] bg-[#1C252E] px-5 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-[#1C252E]"
            >
              {submitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                ? "Save"
                : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// src/components/modal/AddEditBoardModal.tsx
import { useEffect, useState, FormEvent } from "react";

type Board = {
  boardId: number;
  title: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  board: Board | null;
  handleAddBoardClick: (title: string) => Promise<void> | void;
  handleEditTitle: (title: string, boardId: number) => Promise<void> | void;
};

export default function AddEditBoardModal({
  isOpen,
  onClose,
  board,
  handleAddBoardClick,
  handleEditTitle,
}: Props) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = Boolean(board);

  // fill/reset when open
  useEffect(() => {
    if (isOpen && board) {
      setTitle(board.title ?? "");
    }
    if (isOpen && !board) {
      setTitle("");
    }
  }, [isOpen, board]);

  if (!isOpen) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    try {
      setSubmitting(true);
      if (isEditMode && board) {
        // parent decides when to close on success
        await handleEditTitle(trimmed, board.boardId);
      } else {
        await handleAddBoardClick(trimmed);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      {/* Modal container – same style as AddEditProjectModal */}
      <div className="w-full max-w-xl rounded-[24px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] dark:bg-[#1C252E] dark:shadow-none">
        <form onSubmit={onSubmit}>
          {/* Header */}
          <div className="px-8 py-6">
            <h2 className="text-[20px] font-semibold leading-[28px] text-ink dark:text-white">
              {isEditMode ? "Edit Board Title" : "Add New Board"}
            </h2>
          </div>

          {/* Body – single Title field with floating label */}
          <div className="px-8 pb-4">
            <div className="relative">
              <label className="pointer-events-none absolute -top-2 left-3 inline-flex bg-white px-1 text-[13px] font-medium text-[#637381] dark:bg-[#1C252E] dark:text-slate500_80">
                Add Title
                <span className="ml-0.5 text-[#FF5630]">*</span>
              </label>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="--"
                className="h-[56px] w-full rounded-[12px] border border-[#919EAB33] bg-white px-3 pt-3 text-[14px] text-[#1C252E] outline-none transition focus:border-[#1D7BF5] focus:ring-2 focus:ring-[#1D7BF5]/20 dark:border-slate500_20 dark:bg-[#1C252E] dark:text-white"
              />
            </div>
          </div>

          {/* Footer / actions */}
          <div className="flex items-center justify-end gap-3 px-8 py-5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-slate500_20 px-4 text-[14px] font-semibold text-[#1C252E] hover:bg-slate500_08 dark:border-slate500_20 dark:text-slate500_80 dark:hover:bg-[#232C36]"
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

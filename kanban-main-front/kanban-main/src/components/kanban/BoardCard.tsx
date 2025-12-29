// src/components/kanban/BoardCard.tsx
import { useEffect, useRef, useState } from "react";
import { MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";

type Tag = {
  label: string;
};

type Props = {
  idLabel: string; // e.g. "001"
  title: string; // board name
  taskCount: string; // e.g. "20+"
  tags: Tag[];
  onAdd: () => void; // "Add" button (go to kanban list)
  onEdit: () => void; // open edit modal
  onDelete: () => void; // delete this board
};

export default function BoardCard({
  idLabel,
  title,
  taskCount,
  tags,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ outside click close
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (!menuRef.current) return;

      // if click is OUTSIDE the menu container => close
      if (!menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleEditClick = () => {
    setMenuOpen(false);
    onEdit();
  };

  const handleDeleteClick = () => {
    setMenuOpen(false);
    onDelete();
  };

  return (
    <article
      className="
        flex h-full flex-col
        rounded-[24px] bg-white
        shadow-[0_20px_60px_rgba(15,23,42,0.04)]
        dark:bg-[#1C252E]
        dark:shadow-[0_10px_24px_rgba(0,0,0,0.35)]
      "
    >
      <div className="flex-1 px-2 pt-2 pb-2">
        <div className="h-full rounded-[20px] bg-white px-4 pt-5 pb-4 dark:bg-[#141A21] dark:border dark:border-[#141A21]">
          <div className="mb-3 flex items-start justify-between">
            <span className="inline-flex rounded-[6px] bg-[#FFE2DC] px-2 py-[4px] text-[12px] font-bold leading-[14px] text-[#B71D18] dark:bg-[#FF563029] dark:text-[#FFAC82]">
              ID : {idLabel}
            </span>

            {/* ✅ menu wrapper has ref */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="rounded-full p-1.5 hover:bg-slate500_08 dark:hover:bg-slate500_20"
                aria-label="More"
              >
                <MoreVertical className="h-4 w-4 text-[#637381] dark:text-slate500_80" />
              </button>

              {menuOpen && (
                <div
                  className="
                    absolute right-0 mt-2 w-32 rounded-2xl
                    bg-white py-2 text-sm text-black
                    shadow-[0_10px_24px_rgba(15,23,42,0.18)]
                    dark:bg-[#232C36] dark:text-white
                  "
                >
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate500_08 dark:hover:bg-white/10"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate500_08 dark:hover:bg-white/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <h3 className="mb-3 text-[16px] font-semibold leading-[24px] text-ink dark:text-white">
            {title}
          </h3>

          <div className="mb-3 flex items-center gap-2 text-[13px] leading-[18px]">
            <span className="text-[#919EAB] dark:text-slate500_80">Task</span>
            <span className="font-semibold text-[#637381] dark:text-white">
              {taskCount}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className="
                  inline-flex items-center rounded-[999px]
                  border border-slate500_20 px-3 py-1
                  text-[12px] font-medium text-slate700
                  dark:border-[#374151] dark:text-slate300 dark:bg-transparent
                "
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-b-[24px] px-6 pb-5 pt-3 dark:bg-[#1C252E]">
        <button
          type="button"
          onClick={onAdd}
          className="
            inline-flex items-center gap-2
            rounded-[10px] bg-[#1C252E] px-4 py-2
            text-[13px] font-semibold text-white
            shadow-[0_10px_25px_rgba(15,23,42,0.18)]
            hover:opacity-95
            dark:bg-white dark:text-[#1C252E] dark:shadow-none
          "
        >
          <Plus className="h-5 w-5" />
          Add
        </button>
      </div>
    </article>
  );
}

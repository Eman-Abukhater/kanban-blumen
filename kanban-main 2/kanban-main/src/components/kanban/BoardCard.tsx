// src/components/kanban/BoardCard.tsx
import { MoreVertical, Plus } from "lucide-react";

type Tag = {
  label: string;
};

type Props = {
  idLabel: string;        // e.g. "001"
  title: string;          // board name
  taskCount: string;      // e.g. "20+"
  tags: Tag[];
  onAdd: () => void;
  onMore: () => void;
};

export default function BoardCard({
  idLabel,
  title,
  taskCount,
  tags,
  onAdd,
  onMore,
}: Props) {
  return (
    <article className="flex h-full flex-col rounded-[20px] border border-slate500_08 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
      <div className="flex-1 px-6 pt-5 pb-4">
        {/* ID + menu */}
        <div className="mb-3 flex items-start justify-between">
          <span className="inline-flex rounded-[6px] bg-[#FF563029] px-2 py-[3px] text-[12px] font-bold leading-[14px] text-[#B71D18]">
            ID : {idLabel}
          </span>

          <button
            type="button"
            onClick={onMore}
            className="rounded-full p-1.5 hover:bg-slate500_08"
          >
            <MoreVertical className="h-4 w-4 text-[#637381]" />
          </button>
        </div>

        {/* Title */}
        <h3 className="mb-3 text-[16px] font-semibold leading-[24px] text-ink">
          {title}
        </h3>

        {/* Task row */}
        <div className="mb-3 flex items-center gap-2 text-[13px] leading-[18px]">
          <span className="text-[#919EAB]">Task</span>
          <span className="font-semibold text-[#637381]">{taskCount}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.label}
              className="inline-flex items-center rounded-[999px] border border-slate500_20 px-3 py-1 text-[12px] font-medium text-slate700"
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* Footer: Add button */}
      <div className="px-4 pb-5 pt-3">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-[10px] bg-[#1C252E] px-2 py-1.5 text-[13px] font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] hover:opacity-95"
        >
          <Plus className="h-5 w-5" />
          Add
        </button>
      </div>
    </article>
  );
}

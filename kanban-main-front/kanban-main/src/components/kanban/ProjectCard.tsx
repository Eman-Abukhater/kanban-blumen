import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

type Props = {
  project: any;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function MemberIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 10C14.2091 10 16 8.20914 16 6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6C8 8.20914 9.79086 10 12 10Z"
        fill="currentColor"
      />
      <path
        d="M12 21C15.866 21 19 19.2091 19 17C19 14.7909 15.866 13 12 13C8.13401 13 5 14.7909 5 17C5 19.2091 8.13401 21 12 21Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ProjectCard({
  project,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const artboardCount = project?.artboardCount ?? "20+";
  const rawCreatedBy = project?.createdBy?.username ?? "Admin";
  const createdBy =
    rawCreatedBy.charAt(0).toUpperCase() + rawCreatedBy.slice(1);

  const handleEditClick = () => {
    setMenuOpen(false);
    onEdit();
  };

  const handleDeleteClick = () => {
    setMenuOpen(false);
    onDelete();
  };

  return (
    <article className="flex h-full flex-col rounded-[20px] border border-slate500_08 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.04)] dark:border-slate500_20 dark:bg-[#1B232D] dark:shadow-none">
      {/* Top content */}
      <div className="flex-1 px-4 pt-3 pb-4">
        {/* ID + menu */}
        <div className="flex items-start justify-between">
          <span className="inline-flex rounded-[6px] border-[3px] border-[#8E33FF]  px-1 py-[3px] text-[12px] font-bold leading-[14px] text-[#A855F7]">
            ID : {String(project?.id ?? "1").padStart(3, "0")}
          </span>

          {/* Three-dots + menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-full p-1.5 hover:bg-slate500_08 dark:hover:bg-slate500_20"
            >
              <MoreVertical className="h-5 w-5 text-[#637381] dark:text-slate500_80" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-2xl bg-white py-2 text-sm text-black shadow-[0_18px_45px_rgba(15,23,42,0.40)] dark:bg-[#232C36] dark:text-white">
                {/* Edit */}
                <button
                  type="button"
                  onClick={handleEditClick}
 className="
    flex w-full items-center gap-2 px-4 py-2 text-left
    rounded-2xl
    border border-transparent
    hover:bg-white/5
    hover:border-white/20
  "

                >
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={handleDeleteClick}
 className="
    flex w-full items-center gap-2 px-4 py-2 text-left
    rounded-2xl
    border border-transparent
    hover:bg-white/5
    hover:border-white/20
  "
>
                
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-1 text-[16px] font-semibold leading-[24px] text-ink dark:text-white">
          {project?.title || "Need to collect all employee NID"}
        </h3>

        {/* Meta rows */}
        <div className="mt-3 space-y-2.5 text-[13px] leading-[18px]">
          {/* Created By */}
          <div className="flex items-center gap-2">
            <span className="text-[#919EAB] dark:text-slate500_80">
              Created By
            </span>
            <span className="font-semibold text-[#637381] dark:text-slate500_80">
              {createdBy}
            </span>
          </div>

          {/* Member(s) */}
          <div className="flex items-center gap-2">
            <span className="text-[#919EAB] dark:text-slate500_80">
              Member(s)
            </span>

            <div className="flex items-center">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EFD6FF] text-[#C684FF] shadow-[0_0_0_3px_#FFFFFF] dark:shadow-[0_0_0_2px_#1B232D]">
                <MemberIcon className="h-4 w-4" />
              </div>
              <div className="-ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFE1CC] text-[#F3A56B] shadow-[0_0_0_2px_#FFFFFF] dark:shadow-[0_0_0_2px_#1B232D]">
                <MemberIcon className="h-4 w-4" />
              </div>
              <div className="-ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#C7F5FF] text-[#08B4E0] shadow-[0_0_0_2px_#FFFFFF] dark:shadow-[0_0_0_2px_#1B232D]">
                <MemberIcon className="h-4 w-4" />
              </div>
              <div className="-ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFEFAF] text-[11px] font-semibold text-[#D7941B] shadow-[0_0_0_2px_#FFFFFF] dark:shadow-[0_0_0_2px_#1B232D]">
                +2
              </div>
            </div>
          </div>

          {/* Artboard */}
          <div className="flex items-center gap-2">
            <span className="text-[#919EAB] dark:text-slate500_80">
              Artboard
            </span>
            <span className="text-[14px] font-bold text-[#637381] dark:text-slate500_80">
              {artboardCount}
            </span>
          </div>
        </div>
      </div>

      {/* Dotted divider like Figma */}
      <div className="w-full border-t border-dashed border-[#E5EAF1] dark:border-[#232C36]" />

      {/* Footer / View button */}
      <div className="px-4 py-4">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[#1C252E] px-5 text-[12px] font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] hover:opacity-95 dark:bg-white dark:text-[#1C252E] dark:shadow-none"
        >
          View
        </button>
      </div>
    </article>
  );
}

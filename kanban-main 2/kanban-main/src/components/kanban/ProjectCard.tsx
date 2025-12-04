import { MoreVertical } from "lucide-react";

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
  const artboardCount = project?.artboardCount ?? "20+";
  const rawCreatedBy = project?.createdBy?.username ?? "Admin";
  const createdBy =
    rawCreatedBy.charAt(0).toUpperCase() + rawCreatedBy.slice(1);

  return (
    <article className="flex h-full flex-col rounded-[20px] border border-slate500_08 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
      {/* Top content */}
      <div className="flex-1 px-4 pt-3 pb-4">
        {/* ID + menu */}
        <div className="flex items-start justify-between">
          <span className="inline-flex rounded-[6px] border-[3px] border-[#8E33FF]  px-1 py-[3px] text-[12px] font-bold leading-[14px] text-[#A855F7]">
            ID : {String(project?.id ?? "1").padStart(3, "0")}
          </span>

          <button className="rounded-full p-1.5 hover:bg-slate500_08">
            <MoreVertical className="h-5 w-5 text-[#637381]" />
          </button>
        </div>

        {/* Title */}
        <h3 className="mt-1 text-[16px] font-semibold leading-[24px] text-ink">
          {project?.title || "Need to collect all employee NID"}
        </h3>

        {/* Meta rows */}
        <div className="mt-3 space-y-2.5 text-[13px] leading-[18px]">
          {/* Created By */}
          <div className="flex items-center gap-2">
            <span className="text-[#919EAB]">Created By</span>
            <span className="font-semibold text-[#637381]">{createdBy}</span>
          </div>

          {/* Member(s) */}
          <div className="flex items-center gap-2">
            <span className="text-[#919EAB]">Member(s)</span>

            <div className="flex items-center">
              {/* avatar 1 */}
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EFD6FF] text-[#C684FF] shadow-[0_0_0_3px_#FFFFFF]">
                <MemberIcon className="h-4 w-4" />
              </div>

              {/* avatar 2 */}
              <div className="-ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFE1CC] text-[#F3A56B] shadow-[0_0_0_2px_#FFFFFF]">
                <MemberIcon className="h-4 w-4" />
              </div>

              {/* avatar 3 */}
              <div className="-ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#C7F5FF] text-[#08B4E0] shadow-[0_0_0_2px_#FFFFFF]">
                <MemberIcon className="h-4 w-4" />
              </div>

              {/* +2 */}
              <div className="-ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFEFAF] text-[11px] font-semibold text-[#D7941B] shadow-[0_0_0_2px_#FFFFFF]">
                +2
              </div>
            </div>
          </div>

          {/* Artboard */}
          <div className="flex items-center gap-2">
            <span className="text-[#919EAB]">Artboard</span>
            <span className="font-bold text-[#637381] text-[14px]">{artboardCount}</span>
          </div>
        </div>
      </div>

      {/* Dotted divider like Figma */}
      <div className="w-full border-t border-dashed border-[#E5EAF1]" />

      {/* Footer / View button */}
      <div className="px-4 py-4">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[#1C252E] px-5 text-[12px] font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] hover:opacity-95"
        >
          View
        </button>
      </div>
    </article>
  );
}

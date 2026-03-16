import { useEffect, useRef, useState } from "react";
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

export default function ProjectCard({ project, onView, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ ref for outside click detection
  const menuRef = useRef<HTMLDivElement | null>(null);

  const artboardCount = project?.artboardCount ?? "20+";
  const rawCreatedBy = project?.createdBy?.username ?? "Admin";
  const createdBy = rawCreatedBy.charAt(0).toUpperCase() + rawCreatedBy.slice(1);

  // ✅ close menu on outside click + ESC
  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return; // click inside menu
      setMenuOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
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

  const handleViewClick = () => {
    setMenuOpen(false);
    onView();
  };

  return (
    <article className="flex h-full flex-col rounded-[20px] border border-slate500_08 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.04)] dark:border-slate500_20 dark:bg-[#1B232D] dark:shadow-none">
      {/* Top content */}
      <div className="flex-1 px-4 pt-3 pb-4">
        {/* ID + menu */}
        <div className="flex items-start justify-between">
          <span className="inline-flex rounded-[6px] bg-[#8E33FF29]  p-1 text-[12px] font-bold leading-[14px] text-[#5119B7]  dark:text-[#C684FF]">
            ID : {String(project?.id ?? "1").padStart(3, "0")}
          </span>

          {/* Three-dots + menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-full p-1.5 hover:bg-slate500_08 dark:hover:bg-slate500_20"
              aria-label="More"
            >
              <MoreVertical className="h-5 w-5 text-[#637381] dark:text-slate500_80" />
            </button>

          {menuOpen && (
  <div
    className="
      absolute right-0 mt-2 w-36 rounded-[16px]
      border border-slate500_12 bg-white p-2 text-black
      dark:border-slate500_20 dark:bg-[#1B232D] dark:text-white
      shadow-[0_18px_45px_rgba(15,23,42,0.24)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.42)]
    "
  >
    <button
      type="button"
      onClick={handleEditClick}
      className="
        flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-[14px]
        text-[#637381] dark:text-[#919EAB]
        hover:bg-slate-100 hover:text-black
        dark:hover:bg-slate500_20 dark:hover:text-white
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFAB00]/40
      "
    >
      <svg
        className="h-5 w-5 text-current"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11.4 18.1511L18.796 10.7551C17.5517 10.2356 16.4216 9.47656 15.47 8.52114C14.5142 7.56935 13.7547 6.43891 13.235 5.19414L5.83902 12.5901C5.26202 13.1671 4.97302 13.4561 4.72502 13.7741C4.43213 14.1494 4.18098 14.5555 3.97602 14.9851C3.80302 15.3491 3.67402 15.7371 3.41602 16.5111L2.05402 20.5941C1.99133 20.7811 1.98203 20.9818 2.02716 21.1738C2.07229 21.3657 2.17007 21.5412 2.30949 21.6807C2.44891 21.8201 2.62446 21.9179 2.81641 21.963C3.00835 22.0081 3.20907 21.9988 3.39602 21.9361L7.47902 20.5741C8.25402 20.3161 8.64102 20.1871 9.00502 20.0141C9.43502 19.8091 9.84102 19.5581 10.216 19.2651C10.534 19.0171 10.823 18.7281 11.4 18.1511ZM20.848 8.70314C21.5855 7.9657 21.9997 6.96553 21.9997 5.92264C21.9997 4.87975 21.5855 3.87957 20.848 3.14214C20.1106 2.4047 19.1104 1.99042 18.0675 1.99042C17.0246 1.99042 16.0245 2.4047 15.287 3.14214L14.4 4.02914L14.438 4.14014C14.8751 5.39086 15.5904 6.52604 16.53 7.46014C17.492 8.42784 18.667 9.15725 19.961 9.59014L20.848 8.70314Z"
          fill="currentColor"
        />
      </svg>
      <span>Edit</span>
    </button>

    <button
      type="button"
      onClick={handleDeleteClick}
      className="
        flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-[14px]
        text-[#637381] dark:text-[#919EAB]
        hover:bg-red-50 hover:text-red-600
        dark:hover:bg-red-500/10 dark:hover:text-red-400
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFAB00]/40
      "
    >
      <svg
        className="h-5 w-5 text-current"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 6.37611C3 5.89211 3.345 5.49911 3.771 5.49911H6.436C6.965 5.48311 7.432 5.10011 7.612 4.53411L7.642 4.43411L7.757 4.04311C7.827 3.80311 7.888 3.59311 7.974 3.40611C8.312 2.66711 8.938 2.15411 9.661 2.02311C9.845 1.99011 10.039 1.99011 10.261 1.99011H13.739C13.962 1.99011 14.156 1.99011 14.339 2.02311C15.062 2.15411 15.689 2.66711 16.026 3.40611C16.112 3.59311 16.173 3.80211 16.244 4.04311L16.358 4.43411L16.388 4.53411C16.568 5.10011 17.128 5.48411 17.658 5.49911H20.228C20.655 5.49911 21 5.89211 21 6.37611C21 6.86011 20.655 7.25311 20.229 7.25311H3.77C3.345 7.25311 3 6.86011 3 6.37611Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.596 21.9901H12.404C15.187 21.9901 16.578 21.9901 17.484 21.1041C18.388 20.2181 18.48 18.7651 18.665 15.8591L18.932 11.6711C19.032 10.0941 19.082 9.30511 18.629 8.80611C18.175 8.30611 17.409 8.30611 15.876 8.30611H8.124C6.591 8.30611 5.824 8.30611 5.371 8.80611C4.917 9.30611 4.967 10.0941 5.068 11.6711L5.335 15.8591C5.52 18.7651 5.612 20.2191 6.517 21.1041C7.422 21.9901 8.813 21.9901 11.596 21.9901ZM10.246 12.1791C10.206 11.7451 9.838 11.4291 9.426 11.4721C9.013 11.5151 8.713 11.9021 8.754 12.3361L9.254 17.5991C9.294 18.0331 9.662 18.3491 10.074 18.3061C10.487 18.2631 10.787 17.8761 10.746 17.4421L10.246 12.1791ZM14.575 11.4721C14.987 11.5151 15.288 11.9021 15.246 12.3361L14.746 17.5991C14.706 18.0331 14.337 18.3491 13.926 18.3061C13.513 18.2631 13.213 17.8761 13.254 17.4421L13.754 12.1791C13.794 11.7451 14.164 11.4291 14.575 11.4721Z"
          fill="currentColor"
        />
      </svg>
      <span>Delete</span>
    </button>
  </div>
)}
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-1 min-w-0 text-[16px] font-semibold leading-[24px] text-ink dark:text-white whitespace-normal break-all">
          {project?.title || "Need to collect all employee NID"}
        </h3>

        {/* Meta rows */}
        <div className="mt-3 space-y-2.5 text-[13px] leading-[18px]">
          {/* Created By */}
          <div className="flex items-center gap-2">
            <span className="text-[#919EAB] dark:text-slate500_80">Created By</span>
            <span className="font-semibold text-[#637381] dark:text-slate500_80">
              {createdBy}
            </span>
          </div>

          {/* Member(s) */}
          <div className="flex items-center gap-2">
            <span className="text-[#919EAB] dark:text-slate500_80">Member(s)</span>

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
            <span className="text-[#919EAB] dark:text-slate500_80">Artboard</span>
            <span className="text-[14px] font-bold text-[#637381] dark:text-slate500_80">
              {artboardCount}
            </span>
          </div>
        </div>
      </div>

      {/* Dotted divider */}
      <div className="w-full border-t border-dashed border-[#E5EAF1] dark:border-[#232C36]" />

      {/* Footer / View button */}
      <div className="px-4 py-4">
        <button
          type="button"
          onClick={handleViewClick}
          className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[#1C252E] px-5 text-[12px] font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] hover:opacity-95 dark:bg-white dark:text-[#1C252E] dark:shadow-none"
        >
          View
        </button>
      </div>
    </article>
  );
}

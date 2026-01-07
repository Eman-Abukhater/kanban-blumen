// src/components/layout/SectionHeader.tsx
import { Search } from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";

type Props = {
  search?: string;
  setSearch?: (v: string) => void;
  onCreate?: () => void;
  /** Text of the primary button (default: "Create Project") */
  createLabel?: string;

  /** ✅ Board List view mode (true = table/rows, false = cards) */
  isTableView?: boolean;
  /** Called when user clicks column / grid icon */
  onChangeViewMode?: (mode: "cards" | "table") => void;
};

export default function SectionHeader({
  search = "",
  setSearch,
  onCreate,
  createLabel = "Create Project",
  isTableView = false,
  onChangeViewMode,
}: Props) {
  const router = useRouter();
  const path = router.pathname.split("/").filter(Boolean); // ["projects"], ["boardList","[id]"], ["kanbanList","[id]"]

  /** 🔗 Build breadcrumb items based on route */
  const breadcrumb: { label: string; href?: string }[] = [];

  if (path[0] === "projects") {
    // /projects  → Project • Project List
    breadcrumb.push({ label: "Project" });
    breadcrumb.push({ label: "Project List" });
  } else if (path[0] === "boardList") {
    // /boardList/[id] → Project • Project List • Board List
    breadcrumb.push({ label: "Project", href: "/projects" });
    breadcrumb.push({ label: "Project List", href: "/projects" });
    breadcrumb.push({ label: "Board List" });
  } else if (path[0] === "kanbanList") {
    // /kanbanList/[id] → Project • Project List • Board List • kanban
    breadcrumb.push({ label: "Project", href: "/projects" });
    breadcrumb.push({ label: "Project List", href: "/projects" });
    breadcrumb.push({ label: "Board List" });
    breadcrumb.push({ label: "kanban" });
  } else {
    // Fallback – treat like /projects
    breadcrumb.push({ label: "Project" });
    breadcrumb.push({ label: "Project List" });
  }

  // Page title
  let currentTitle = "Project List";
  if (path[0] === "boardList") currentTitle = "Board List";
  if (path[0] === "kanbanList") currentTitle = "Kanban";

  const isBoardListPage = path[0] === "boardList";

  return (
<div className=" w-full bg-white px-5 pt-8 dark:bg-[#141A21]">
      {/* Top Row: Title + Button */}
      <div className="flex items-center justify-between">
        <div>
          {/* Page title (H1) */}
          <h1 className="pb-3 text-[26px] font-semibold leading-[28px] text-ink dark:text-white">
            {currentTitle}
          </h1>

          {/* BREADCRUMB */}
          <div className="mt-1 flex items-center gap-1.5 text-[13px]">
            {breadcrumb.map((item, i) => {
              const isLast = i === breadcrumb.length - 1;

              return (
                <div key={i} className="flex items-center">
                  {isLast ? (
                    // ⭐ current page = grey
                    <span className="text-slate500 dark:text-slate500_80">
                      {item.label}
                    </span>
                  ) : item.href ? (
                    // previous crumbs with link → white in dark mode
                    <Link href={item.href}>
                      <span className="cursor-pointer font-medium text-ink hover:underline dark:text-white">
                        {item.label}
                      </span>
                    </Link>
                  ) : (
                    // previous crumbs without link → also white in dark
                    <span className="font-medium text-ink dark:text-white">
                      {item.label}
                    </span>
                  )}

                  {/* Dot separator except last */}
                  {!isLast && (
                    <span className="mx-1 text-slate500 dark:text-slate500_80">
                      •
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Primary button (Create Project / Create Board) */}
        {onCreate && (
          <button
            onClick={onCreate}
            className="h-10 rounded-[10px] bg-ink px-5 text-[14px] font-semibold text-white transition-colors hover:opacity-90 dark:bg-white dark:text-[#141A21]"
          >
            {createLabel}
          </button>
        )}
      </div>

      {/* Second Row: Search + icons
          ❗ Hidden when isTableView = true (because in table view they move inside the card) */}
      {setSearch && !isTableView && (
        <div className="mt-6 flex items-center justify-between">
          {/* Search */}
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

          {/* Icons */}
          <div className="flex items-center gap-3">
            {/* Filter icon (no logic yet) */}
            <button className="rounded-[10px] p-2 hover:bg-slate500_12 dark:hover:bg-slate500_20">
              <Image
                src="/icons/filter-icon.svg"
                alt="filter"
                width={20}
                height={20}
                className="opacity-80"
              />
            </button>

            {/* Column view = cards */}
            <button
              type="button"
              onClick={() => onChangeViewMode?.("cards")}
              className={
                "rounded-[10px] p-2 hover:bg-slate500_12 dark:hover:bg-slate500_20" +
                (isBoardListPage && !isTableView
                  ? " bg-slate500_08 dark:bg-slate500_20"
                  : "")
              }
            >
              <Image
                src="/icons/column.svg"
                alt="column"
                width={20}
                height={20}
                className="opacity-80"
              />
            </button>

            {/* Grid icon = TABLE / ROWS view for Board List */}
            <button
              type="button"
              onClick={() => onChangeViewMode?.("table")}
              className={
                "rounded-[10px] p-2 hover:bg-slate500_12 dark:hover:bg-slate500_20" +
                (isBoardListPage && isTableView
                  ? " bg-slate500_08 dark:bg-slate500_20"
                  : "")
              }
            >
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
      )}
    </div>
  );
}

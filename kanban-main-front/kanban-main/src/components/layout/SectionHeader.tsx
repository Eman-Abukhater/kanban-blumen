// src/components/layout/SectionHeader.tsx
import { Search, Plus } from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";

type Props = {
  search?: string;
  setSearch?: (v: string) => void;
  onCreate?: () => void;
  createLabel?: string;

  isTableView?: boolean;
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
  const path = router.pathname.split("/").filter(Boolean);

  const breadcrumb: { label: string; href?: string }[] = [];

  if (path[0] === "projects") {
    breadcrumb.push({ label: "Project" });
    breadcrumb.push({ label: "Project List" });
  } else if (path[0] === "boardList") {
    breadcrumb.push({ label: "Project", href: "/projects" });
    breadcrumb.push({ label: "Project List", href: "/projects" });
    breadcrumb.push({ label: "Board List" });
  } else if (path[0] === "kanbanList") {
    breadcrumb.push({ label: "Project", href: "/projects" });
    breadcrumb.push({ label: "Project List", href: "/projects" });
    breadcrumb.push({ label: "Board List" });
    breadcrumb.push({ label: "kanban" });
  } else {
    breadcrumb.push({ label: "Project" });
    breadcrumb.push({ label: "Project List" });
  }

  let currentTitle = "Project List";
  if (path[0] === "boardList") currentTitle = "Board List";
  if (path[0] === "kanbanList") currentTitle = "Kanban";

  return (
    <div className="w-full bg-white px-5 pt-8 dark:bg-[#141A21]">
      {/* ✅ Row 1: Title */}
      <div className="flex items-start justify-between">
        <h1 className="text-[26px] font-semibold leading-[28px] text-ink dark:text-white">
          {currentTitle}
        </h1>
      </div>

      {/* ✅ Row 2: Breadcrumb + Create button */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Breadcrumb */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
            {breadcrumb.map((item, i) => {
              const isLast = i === breadcrumb.length - 1;

              return (
                <div key={i} className="flex items-center">
                  {isLast ? (
                    <span className="text-slate500 dark:text-slate500_80">
                      {item.label}
                    </span>
                  ) : item.href ? (
                    <Link href={item.href}>
                      <span className="cursor-pointer font-medium text-ink hover:underline dark:text-white">
                        {item.label}
                      </span>
                    </Link>
                  ) : (
                    <span className="font-medium text-ink dark:text-white">
                      {item.label}
                    </span>
                  )}

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

        {/* Create button */}
        {onCreate && (
          <button
            onClick={onCreate}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-[10px] bg-ink px-4 text-[14px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-[#141A21] self-end sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            {createLabel}
          </button>
        )}
      </div>

      {/* ✅ Row 3: Search + Icons (only when NOT table view) */}
      {setSearch && !isTableView && (
        <div className="mt-6 flex items-center justify-between gap-3">
          {/* Search */}
          <div className="min-w-0 flex-1">
            <div className="relative w-full max-w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate500 dark:text-slate500_80" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-12 w-full rounded-[12px] border border-slate500_20 bg-white pl-9 pr-3 text-[14px] text-ink placeholder-slate500 outline-none focus:ring-2 focus:ring-brand/40 dark:border-slate500_20 dark:bg-[#1B232D] dark:text-slate500_80 dark:placeholder-slate500_80"
              />
            </div>
          </div>

          {/* Icons */}
          <div className="flex shrink-0 items-center gap-3">
            <button className="rounded-[10px] p-2 hover:bg-slate500_12 dark:hover:bg-slate500_20">
              <Image
                src="/icons/filter-icon.svg"
                alt="filter"
                width={20}
                height={20}
                className="opacity-80"
              />
            </button>

            <button
              type="button"
              onClick={() => onChangeViewMode?.("cards")}
              className={
                "rounded-[10px] p-2 hover:bg-slate500_12 dark:hover:bg-slate500_20" +
                (!isTableView ? " bg-slate500_08 dark:bg-slate500_20" : "")
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

            <button
              type="button"
              onClick={() => onChangeViewMode?.("table")}
              className={
                "rounded-[10px] p-2 hover:bg-slate500_12 dark:hover:bg-slate500_20" +
                (isTableView ? " bg-slate500_08 dark:bg-slate500_20" : "")
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

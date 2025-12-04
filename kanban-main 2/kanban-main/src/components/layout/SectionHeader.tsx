// src/components/layout/SectionHeader.tsx
import { Filter, List, Grid, Search } from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";

type Props = {
  search?: string;
  setSearch?: (v: string) => void;
  onCreate?: () => void;
};

export default function SectionHeader({ search = "", setSearch, onCreate }: Props) {
  const router = useRouter();
  const path = router.pathname.split("/").filter(Boolean);  // ["projects"] or ["boardList", "12"]

  /** 🔥 Build breadcrumb items based on route */
  const breadcrumb = [];

  // Always first item
  breadcrumb.push({
    label: "Project",
    href: "/projects",
  });

  if (path[0] === "projects") {
    breadcrumb.push({
      label: "Project List",
      href: "/projects",
    });
  }

  if (path[0] === "boardList") {
    breadcrumb.push({
      label: "Project List",
      href: "/projects",
    });
    breadcrumb.push({
      label: "Board List",
      href: router.asPath,
    });
  }

  return (
    <div className="mx-auto max-w-[1120px] bg-white px-0 pt-8">
      {/* Top Row: Title + Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-[28px] text-ink pb-3">
            {breadcrumb[breadcrumb.length - 1].label}
          </h1>

          {/* BREADCRUMB */}
          <div className="mt-1 flex items-center text-[13px] gap-1.5">

            {breadcrumb.map((item, i) => {
              const isLast = i === breadcrumb.length - 1;

              return (
                <div key={i} className="flex items-center">
                  {!isLast ? (
                    <Link href={item.href}>
                      <span className="text-ink font-medium cursor-pointer hover:underline">
                        {item.label}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-slate500">{item.label}</span>
                  )}

                  {/* • dot separator except last */}
                  {!isLast && <span className="mx-1 text-slate500">•</span>}
                </div>
              );
            })}

          </div>
        </div>

        {onCreate && (
          <button
            onClick={onCreate}
            className="h-10 rounded-[10px] bg-ink px-5 text-[14px] font-semibold text-white hover:opacity-90"
          >
            Create Project
          </button>
        )}
      </div>

      {/* Second Row */}
      {setSearch && (
        <div className="mt-6 flex items-center justify-between">
          {/* Search */}
          <div className="w-[320px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-10 w-full rounded-[12px] border border-slate500_20 bg-white pl-9 pr-3 text-[14px] text-ink placeholder-slate500 outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-5">
            <button className="rounded-[10px] p-2 hover:bg-slate500_12"><Filter className="h-4 w-4 text-slate500" /></button>
            <button className="rounded-[10px] p-2 hover:bg-slate500_12"><List className="h-4 w-4 text-slate500" /></button>
            <button className="rounded-[10px] p-2 hover:bg-slate500_12"><Grid className="h-4 w-4 text-slate500" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// src/components/layout/SectionHeader.tsx
import { Filter, List, Grid, Search } from "lucide-react";

type Props = {
  search: string;
  setSearch: (v: string) => void;
  onCreate: () => void;
};

export default function SectionHeader({ search, setSearch, onCreate }: Props) {
  return (
    <div className="mx-auto max-w-[1120px] bg-white px-6 pt-8">
      {/* Top row: Title + Create button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold leading-[28px] text-ink">
            Project
          </h1>

          {/* Breadcrumb under title */}
          <div className="mt-1 flex items-center text-[13px]">
            <span className="text-slate500">Project</span>
            <span className="mx-1.5 text-slate500">•</span>
            <span className="text-slate500">Project List</span>
          </div>
        </div>

        {/* Create Project button (aligned with title) */}
        <button
          onClick={onCreate}
          className="h-10 rounded-[10px] bg-ink px-5 text-[14px] font-semibold text-white hover:opacity-90"
        >
          Create Project
        </button>
      </div>

      {/* Second row: Search (left) + view icons (right) */}
      <div className="mt-6 flex items-center justify-between">
        {/* Search input */}
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

        {/* Right icons */}
        <div className="flex items-center gap-5">
          <button
            className="rounded-[10px] p-2 hover:bg-slate500_12"
            title="Filter"
          >
            <Filter className="h-4 w-4 text-slate500" />
          </button>
          <button
            className="rounded-[10px] p-2 hover:bg-slate500_12"
            title="List view"
          >
            <List className="h-4 w-4 text-slate500" />
          </button>
          <button
            className="rounded-[10px] p-2 hover:bg-slate500_12"
            title="Grid view"
          >
            <Grid className="h-4 w-4 text-slate500" />
          </button>
        </div>
      </div>
    </div>
  );
}

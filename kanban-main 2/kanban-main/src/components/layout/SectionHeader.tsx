// src/components/layout/SectionHeader.tsx
import { Filter, List, Grid, Search } from "lucide-react";

type Props = {
  search: string;
  setSearch: (v: string) => void;
  onCreate: () => void;
};

export default function SectionHeader({ search, setSearch, onCreate }: Props) {
  return (
    <div className="mx-auto max-w-[1120px] px-6 pt-6">
      {/* Title */}
      <div className="flex justify-between ">
        <h1 className="text-[22px] font-bold leading-[30px] text-ink">
          Project
        </h1>
        {/* Create Project button */}
        <button
          onClick={onCreate}
          className="ml-2 h-10 rounded-[10px] bg-ink px-4 text-[14px] font-semibold text-white hover:opacity-90"
        >
          Create Project
        </button>
      </div>

      {/* Breadcrumb ONLY */}
      <div className="mt-1 flex items-center">
        <span className="text-[14px] text-ink">Project</span>
        <span className="mx-2 text-slate500">•</span>
        <span className="text-[14px] text-slate500">Project List</span>
      </div>

      {/* Row: Search (left) + view icons (right) */}
      <div className="mt-5 flex items-center justify-between">
        {/* Search input */}
        <div className="w-[280px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="h-10 w-full rounded-[10px] border border-slate500_20 bg-white pl-9 pr-3 text-[14px] text-ink placeholder-slate500 outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-4">
          <button
            className="rounded-[10px] p-2 hover:bg-slate500_12"
            title="Filter"
          >
            <Filter className="h-5 w-5 text-slate600" />
          </button>
          <button
            className="rounded-[10px] p-2 hover:bg-slate500_12"
            title="List view"
          >
            <List className="h-5 w-5 text-slate600" />
          </button>
          <button
            className="rounded-[10px] p-2 hover:bg-slate500_12"
            title="Grid view"
          >
            <Grid className="h-5 w-5 text-slate600" />
          </button>
        </div>
      </div>
    </div>
  );
}

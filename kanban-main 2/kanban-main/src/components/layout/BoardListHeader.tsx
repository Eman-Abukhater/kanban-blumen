// src/components/layout/BoardListHeader.tsx
import { Filter, List, Grid, Search } from "lucide-react";

type Props = {
  search: string;
  setSearch: (v: string) => void;
  onCreate: () => void;
};

export default function BoardListHeader({ search, setSearch, onCreate }: Props) {
  return (
    <div className="mx-auto max-w-[1120px] bg-white px-0 pt-8">
      {/* Top row: Title + Create button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="pb-3 text-[26px] font-semibold leading-[28px] text-ink">
            Board List
          </h1>

          {/* Breadcrumb */}
          <div className="mt-1 flex items-center text-[13px]">
            <span className="text-ink">Project</span>
            <span className="mx-1.5 text-slate500">•</span>
            <span className="text-ink">Project List</span>
            <span className="mx-1.5 text-slate500">•</span>
            <span className="text-slate500">Board List</span>
          </div>
        </div>

        {/* Create Board button */}
        <button
          onClick={onCreate}
          className="h-10 rounded-[10px] bg-[#FFAB00] px-5 text-[14px] font-semibold text-[#212B36] shadow-[0_8px_18px_rgba(255,171,0,0.35)] hover:bg-[#FFB400]"
        >
          Create Board
        </button>
      </div>

      {/* Second row: Search + view icons */}
      <div className="mt-6 flex items-center justify-between">
        {/* Search input */}
        <div className="w-[320px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
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

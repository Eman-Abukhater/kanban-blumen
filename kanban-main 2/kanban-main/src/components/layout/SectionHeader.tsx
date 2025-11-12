// src/components/layout/SectionHeader.tsx
import { Filter, List, Grid, Search } from "lucide-react";

type Props = {
  search: string;
  setSearch: (v: string) => void;
};

export default function SectionHeader({ search, setSearch }: Props) {
  return (
    <div className="mx-auto max-w-[1120px] px-6 pt-6">
      {/* Title */}
      <h1 className="text-[22px] font-bold leading-[30px] text-ink">Project</h1>

      {/* Breadcrumb + right small icons */}
      <div className="mt-1 flex items-center">
        <span className="text-[14px] text-ink">Project</span>
        <span className="mx-2 text-slate500">•</span>
        <span className="text-[14px] text-slate500">Project List</span>

        <div className="ml-auto flex items-center gap-4">
          <button className="rounded-[10px] p-2 hover:bg-slate500_12" title="Filter">
            <Filter className="h-5 w-5 text-slate600" />
          </button>
          <button className="rounded-[10px] p-2 hover:bg-slate500_12" title="List view">
            <List className="h-5 w-5 text-slate600" />
          </button>
          <button className="rounded-[10px] p-2 hover:bg-slate500_12" title="Grid view">
            <Grid className="h-5 w-5 text-slate600" />
          </button>
        </div>
      </div>

      {/* Search input under breadcrumb (left) */}
      <div className="mt-5 w-[280px]">
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
    </div>
  );
}

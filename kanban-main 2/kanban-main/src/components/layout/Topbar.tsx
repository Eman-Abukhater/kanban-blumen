// src/components/layout/Topbar.tsx
import { Search } from "lucide-react";

type Props = {
  title: string;
  onCreate: () => void;
  search: string;
  setSearch: (v: string) => void;
};

export default function Topbar({ title, onCreate, search, setSearch }: Props) {
  return (
    <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-slate500_12">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center">
          <div>
            <h1 className="text-h4">{title}</h1>
            <div className="mt-1 flex items-center gap-2 text-[14px]">
              <span className="text-ink">Project</span>
              <span className="text-slate500">•</span>
              <span className="text-slate500">Project List</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative w-[260px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate500" />
              <input
                className="input pl-9"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-dark" onClick={onCreate}>Create Project</button>
          </div>
        </div>
      </div>
    </header>
  );
}

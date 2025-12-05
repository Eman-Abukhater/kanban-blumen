import { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#ffffff] text-ink dark:bg-[#141A21] dark:text-slate500_80 transition-colors">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

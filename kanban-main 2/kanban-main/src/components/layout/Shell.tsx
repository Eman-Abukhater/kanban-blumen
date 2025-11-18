// src/components/layout/Shell.tsx
import { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#ffffff] text-ink">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

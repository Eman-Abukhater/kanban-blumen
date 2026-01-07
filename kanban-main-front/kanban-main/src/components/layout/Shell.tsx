import { ReactNode } from "react";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-ink dark:bg-[#141A21] dark:text-slate500_80 transition-colors">
      <div className="flex w-full ">
        <div className="flex-1 min-w-0 pt-[88px]">{children}</div>
      </div>
    </div>
  );
}

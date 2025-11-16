// src/components/layout/Topbar.tsx
import Image from "next/image";
import { Bell, Settings, Users2, Search } from "lucide-react";



export default function Topbar() {
  return (
<header className="sticky top-0 z-30 bg-white">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-6">
        {/* left side empty to match figma spacing */}
        <div className="w-[180px]" />

        {/* right controls */}
        <div className="flex items-center gap-3">
          {/* mini search chip (⌘K style) */}
          <div className="flex h-9 items-center rounded-[10px] border border-slate500_20 bg-white px-3 text-[13px] text-slate600">
          <Search className="mr-2 h-4 w-4" />
            <span className="opacity-80">⌘K</span>
          </div>

          {/* flags (placeholder images in /public) */}
          <Image src="/flag-uk.png" width={20} height={14} alt="UK" className="rounded-sm" />

          {/* bell with badge */}
          <button className="relative rounded-full p-2 hover:bg-slate500_12">
            <Bell className="h-5 w-5 text-slate600" />
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF5630] px-1 text-[10px] font-bold text-white">
              1
            </span>
          </button>

          {/* users icon */}
          <button className="rounded-full p-2 hover:bg-slate500_12">
            <Users2 className="h-5 w-5 text-slate600" />
          </button>

          {/* settings */}
          <button className="rounded-full p-2 hover:bg-slate500_12">
            <Settings className="h-5 w-5 text-slate600" />
          </button>

          {/* avatar (place your avatar in /public/avatar.png) */}
          <div className="relative h-9 w-9">
            <Image
              src="/avatar.png"
              alt="profile"
              fill
              className="rounded-full ring-2 ring-[#FFAB00]"
            />
          </div>

        </div>
      </div>
    </header>
  );
}

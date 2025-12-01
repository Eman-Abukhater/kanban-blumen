// src/components/layout/Topbar.tsx
import Image from "next/image";
import { Bell, Settings, Users2, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 bg-white">
      <div className="mx-auto flex max-w-[1120px] items-center justify-end px-6 py-4">
        <div className="flex items-center gap-3">
          {/* mini search chip */}
          <div className="flex h-9 items-center rounded-full border border-slate500_20 bg-[#F9FAFB] px-3 text-[13px] text-slate600">
            <Search className="mr-2 h-4 w-4 text-slate500" />
            <span className="opacity-80">⌘K</span>
          </div>

          {/* flags */}

          <Image
            src="/flag-uk.png"
            width={25}
            height={25}
            alt="UK"
            className="rounded-sm"
          />
          {/* bell with badge */}
          <button className="relative rounded-full p-2 hover:bg-slate500_12">
            <Image
              src="/icons/notification.png"
              alt="notifications"
              width={20}
              height={20}
              className="opacity-80"
            />
            <span className="min-w-4 absolute -right-0.5 -top-0.5 inline-flex h-4 items-center justify-center rounded-full bg-[#FF5630] px-1 text-[10px] font-bold text-white">
              1
            </span>
          </button>

          {/* users icon (KEEP THIS THE SAME for now) */}
          <button className="rounded-full p-2 hover:bg-slate500_12">
            <Users2 className="h-5 w-5 text-slate500" />
          </button>

          {/* settings */}
          <button className="rounded-full p-2 hover:bg-slate500_12">
            <Image
              src="/icons/settings.png"
              alt="settings"
              width={20}
              height={20}
              className="opacity-80"
            />
          </button>

          {/* avatar */}
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

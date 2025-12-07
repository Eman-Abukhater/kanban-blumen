// src/components/layout/Topbar.tsx
import { useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import SettingsPanel from "./SettingsPanel";

export default function Topbar() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-[#141A21]">
      <div className="relative mx-auto flex max-w-[1120px] items-center justify-end px-0 py-4">
        <div className="flex items-center gap-3">
          {/* mini search chip */}
          <div className="flex h-9 items-center rounded-full border border-slate500_20 bg-[#F9FAFB] px-3 text-[13px] text-slate600 dark:border-slate500_20 dark:bg-[#020617] dark:text-slate500_80">
            <Search className="mr-2 h-4 w-4 text-slate500" />
            <span className="opacity-80">⌘K</span>
          </div>

          {/* flag */}
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
              width={25}
              height={25}
              className="opacity-80"
            />
            <span className="absolute -right-0.4 -top-0.5 inline-flex h-5 min-w-4 items-center justify-center rounded-full bg-[#FF5630] px-2 text-[10px] font-bold text-white">
              1
            </span>
          </button>

          {/* users icon */}
          <button className="rounded-full p-2 hover:bg-slate500_12">
            <Image
              src="/icons/user-icon.svg"
              alt="user icon"
              width={25}
              height={25}
              className="opacity-80"
            />
          </button>

          {/* settings – opens panel */}
          <button
            className="rounded-full p-2 hover:bg-slate500_12"
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
          >
            <Image
              src="/icons/settings.png"
              alt="settings"
              width={25}
              height={25}
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

        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </div>
    </header>
  );
}

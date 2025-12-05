// src/components/layout/SettingsPanel.tsx
import ThemeSwitch from "./ThemeSwitch";
import { X } from "lucide-react";

type SettingsPanelProps = {
  onClose: () => void;
};

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  return (
    <div className="absolute right-4 top-16 z-40 w-80 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate500_12 dark:bg-[#020617] dark:ring-slate500_20">
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink dark:text-slate500_80">
          Settings
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 hover:bg-slate500_12"
        >
          <X className="h-4 w-4 text-slate500" />
        </button>
      </div>

      {/* grid of tiles */}
      <div className="grid grid-cols-2 gap-3">
        {/* Dark mode tile (WORKING) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate500_12 bg-[#F9FAFB] p-3 dark:border-slate500_20 dark:bg-[#020617]">
          <div className="mb-3 flex flex-col gap-1">
            {/* you can replace this emoji with an icon later */}
            <span className="text-lg">🌙</span>
            <span className="text-xs font-medium text-ink dark:text-slate500_80">
              Dark mode
            </span>
          </div>
          <div className="flex justify-end">
            <ThemeSwitch />
          </div>
        </div>

        {/* Contrast (dummy – just UI for now) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate500_12 bg-[#F9FAFB] p-3 dark:border-slate500_20 dark:bg-[#020617]">
          <div className="mb-3 flex flex-col gap-1">
            <span className="text-lg">⚪</span>
            <span className="text-xs font-medium text-ink dark:text-slate500_80">
              Contrast
            </span>
          </div>
          <div className="flex justify-end">
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate500_20 opacity-50" />
          </div>
        </div>

        {/* Right to left (dummy) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate500_12 bg-[#F9FAFB] p-3 dark:border-slate500_20 dark:bg-[#020617]">
          <div className="mb-3 flex flex-col gap-1">
            <span className="text-lg">↔️</span>
            <span className="text-xs font-medium text-ink dark:text-slate500_80">
              Right to left
            </span>
          </div>
          <div className="flex justify-end">
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate500_20 opacity-50" />
          </div>
        </div>

        {/* Compact (dummy) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate500_12 bg-[#F9FAFB] p-3 dark:border-slate500_20 dark:bg-[#020617]">
          <div className="mb-3 flex flex-col gap-1">
            <span className="text-lg">📏</span>
            <span className="text-xs font-medium text-ink dark:text-slate500_80">
              Compact
            </span>
          </div>
          <div className="flex justify-end">
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate500_20 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";

interface BoardCardSkeletonProps {
  count?: number;
}

function BoardCardSkeleton({ count = 1 }: BoardCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={`skeleton-${index}`}
          className="
            flex h-full flex-col animate-pulse
            rounded-[20px] border border-slate500_08 bg-white
            shadow-[0_20px_60px_rgba(15,23,42,0.04)]
            dark:border-slate500_20 dark:bg-[#1B232D] dark:shadow-none
          "
        >
          {/* Top content */}
          <div className="flex-1 px-6 pt-5 pb-4">
            {/* ID + menu row */}
            <div className="mb-3 flex items-start justify-between">
              {/* ID badge skeleton */}
              <div className="h-6 w-24 rounded-[6px] bg-gray-200 dark:bg-slate500_48" />

              {/* menu button skeleton */}
            </div>

            {/* Title skeleton */}
            <div className="mb-3 h-5 w-3/4 rounded bg-gray-300 dark:bg-slate500_48" />

            {/* Task row skeleton */}
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-slate500_48" />
              <div className="h-3 w-10 rounded bg-gray-300 dark:bg-slate500_48" />
            </div>

            {/* Tags skeleton */}
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-16 rounded-full bg-gray-200 dark:bg-slate500_48" />
              <div className="h-7 w-20 rounded-full bg-gray-200 dark:bg-slate500_48" />
              <div className="h-7 w-12 rounded-full bg-gray-200 dark:bg-slate500_48" />
            </div>
          </div>

          {/* Footer: Add button skeleton */}
          <div className="px-4 pb-5 pt-3">
            <div className="h-9 w-24 rounded-[10px] bg-gray-300 dark:bg-slate500_48" />
          </div>
        </article>
      ))}
    </>
  );
}

export default BoardCardSkeleton;

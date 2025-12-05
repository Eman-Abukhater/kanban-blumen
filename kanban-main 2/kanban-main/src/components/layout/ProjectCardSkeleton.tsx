import React from "react";

interface ProjectCardSkeletonProps {
  count?: number;
}

function ProjectCardSkeleton({ count = 1 }: ProjectCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={`skeleton-${index}`}
          className="flex h-full flex-col rounded-[20px] border border-slate500_08 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.04)] dark:border-slate500_20 dark:bg-[#1B232D] dark:shadow-none"
        >
          {/* Top content */}
          <div className="flex-1 px-4 pt-3 pb-4 animate-pulse">
            {/* ID + menu */}
            <div className="flex items-start justify-between">
              {/* badge placeholder */}
              <div className="h-6 w-24 rounded-[6px] border-[3px] border-[#8E33FF33] bg-gray-200 dark:bg-slate500_48" />

              {/* menu icon placeholder */}
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-slate500_48" />
            </div>

            {/* Title */}
            <div className="mt-2 h-5 w-2/3 rounded bg-gray-300 dark:bg-slate500_48" />

            {/* Meta rows */}
            <div className="mt-4 space-y-3 text-[13px] leading-[18px]">
              {/* Created By */}
              <div className="flex items-center gap-2">
                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-slate500_48" />
                <div className="h-3 w-16 rounded bg-gray-300 dark:bg-slate500_48" />
              </div>

              {/* Member(s) */}
              <div className="flex items-center gap-2">
                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-slate500_48" />
                <div className="flex items-center gap-1">
                  <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-slate500_48" />
                  <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-slate500_48" />
                  <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-slate500_48" />
                  <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-slate500_48" />
                </div>
              </div>

              {/* Artboard */}
              <div className="flex items-center gap-2">
                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-slate500_48" />
                <div className="h-3 w-10 rounded bg-gray-300 dark:bg-slate500_48" />
              </div>
            </div>
          </div>

          {/* Dotted divider like Figma */}
          <div className="w-full border-t border-dashed border-[#E5EAF1] dark:border-[#232C36]" />

          {/* Footer / View button placeholder */}
          <div className="px-4 py-4">
            <div className="h-9 w-20 rounded-[10px] bg-gray-300 dark:bg-slate500_48" />
          </div>
        </article>
      ))}
    </>
  );
}

export default ProjectCardSkeleton;

// src/components/layout/KanbanBoardSkeleton.tsx
import React from "react";

function KanbanBoardSkeleton() {
  return (
    <div className="kanban-scroll flex h-full flex-row items-start gap-6 overflow-x-auto px-6 pb-10 pt-6">
      {/* Skeleton for 3 lists */}
      {[1, 2, 3].map((_, index) => (
        <div
          key={index}
          className="min-w-[340px] animate-pulse rounded-[24px] border border-[#E5EAF1] bg-[#F4F6F8] shadow-soft dark:border-slate500_20 dark:bg-[#1B232D]"
        >
          {/* LIST HEADER */}
          <div className="flex items-center justify-between rounded-t-[24px] px-5 pt-4 pb-3">
            <div className="flex items-center gap-3">
              {/* count bubble */}
              <div className="h-7 w-7 rounded-full bg-[#E5EAF1] dark:bg-[#232C36]" />

              {/* list title */}
              <div className="h-4 w-24 rounded-full bg-slate500_12 dark:bg-slate500_20" />
            </div>

            {/* right: + button + menu */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-black/10 dark:bg-white/10" />
              <div className="h-8 w-8 rounded-full bg-slate500_12 dark:bg-slate500_20" />
            </div>
          </div>

          {/* LIST BODY (cards) */}
          <div className="px-4 pb-4 pt-1 space-y-3">
            {[1, 2, 3].map((cardIndex) => (
              <div
                key={cardIndex}
                className="rounded-[16px] border border-slate500_08 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-slate500_20 dark:bg-[#1B232D]"
              >
                {/* title line */}
                <div className="mb-2 h-4 w-3/4 rounded-full bg-slate500_12 dark:bg-slate500_20" />

                {/* description lines */}
                <div className="h-3 w-full rounded-full bg-slate500_08 dark:bg-slate500_20" />
                <div className="mt-2 h-3 w-2/3 rounded-full bg-slate500_08 dark:bg-slate500_20" />

                {/* footer: comments / attachments / avatars */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-10 rounded-full bg-slate500_08 dark:bg-slate500_20" />
                    <div className="h-3 w-12 rounded-full bg-slate500_08 dark:bg-slate500_20" />
                  </div>
                  <div className="flex -space-x-2">
                    <div className="h-7 w-7 rounded-full bg-[#E5EAF1] dark:bg-[#232C36]" />
                    <div className="h-7 w-7 rounded-full bg-[#E5EAF1] dark:bg-[#232C36]" />
                    <div className="h-7 w-7 rounded-full bg-[#FFEFAF] dark:bg-[#3A2C12]" />
                  </div>
                </div>
              </div>
            ))}

            {/* Add card button skeleton */}
            <div className="mt-1 h-10 w-full rounded-[16px] bg-slate500_08 dark:bg-slate500_20" />
          </div>
        </div>
      ))}

      {/* "Add list" skeleton card */}
      <div className="min-w-[340px] animate-pulse">
        <div className="mt-6 h-[60px] rounded-[24px] border border-dashed border-slate500_20 bg-transparent dark:border-slate500_48" />
      </div>
    </div>
  );
}

export default KanbanBoardSkeleton;

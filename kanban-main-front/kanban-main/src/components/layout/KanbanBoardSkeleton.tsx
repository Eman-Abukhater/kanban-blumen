import React from "react";

function KanbanBoardSkeleton() {
  return (
    <div className="flex h-full flex-1 flex-row items-start gap-4 overflow-x-auto p-4 pb-10">
      {/* Skeleton for 3 lists */}
      {[1, 2, 3].map((_, index) => (
        <div
          key={index}
          className="min-w-[256px] animate-pulse rounded-lg border border-slate-300 bg-slate-100 p-4"
        >
          {/* List header skeleton */}
          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-32 rounded bg-slate-300"></div>
            <div className="h-6 w-6 rounded bg-slate-300"></div>
          </div>

          {/* Card skeletons */}
          {[1, 2, 3].map((cardIndex) => (
            <div
              key={cardIndex}
              className="mb-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="mb-2 h-4 w-3/4 rounded bg-slate-200"></div>
              <div className="h-3 w-full rounded bg-slate-200"></div>
              <div className="mt-2 h-3 w-2/3 rounded bg-slate-200"></div>
            </div>
          ))}

          {/* Add card button skeleton */}
          <div className="mt-3 h-10 w-full rounded-lg bg-slate-200"></div>
        </div>
      ))}

      {/* Add list button skeleton */}
      <div className="min-w-[256px] animate-pulse">
        <div className="h-12 w-full rounded-lg bg-slate-200"></div>
      </div>
    </div>
  );
}

export default KanbanBoardSkeleton;

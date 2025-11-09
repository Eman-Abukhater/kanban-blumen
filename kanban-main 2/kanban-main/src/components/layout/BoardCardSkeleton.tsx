import React from "react";

interface BoardCardSkeletonProps {
  count?: number;
}

function BoardCardSkeleton({ count = 1 }: BoardCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="relative flex animate-pulse items-center justify-between rounded-md bg-white p-4 shadow-md"
        >
          <div className="flex-1">
            {/* Board ID skeleton */}
            <div className="mb-1 h-3 w-12 rounded bg-gray-200"></div>
            {/* Board title skeleton */}
            <div className="h-5 w-3/4 rounded bg-gray-300"></div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-300"></div>
            <div className="h-10 w-10 rounded-full bg-gray-300"></div>
          </div>
        </div>
      ))}
    </>
  );
}

export default BoardCardSkeleton;

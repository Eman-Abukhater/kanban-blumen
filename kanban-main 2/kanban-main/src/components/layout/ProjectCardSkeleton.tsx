import React from "react";

interface ProjectCardSkeletonProps {
  count?: number;
}

function ProjectCardSkeleton({ count = 1 }: ProjectCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="relative flex animate-pulse flex-col justify-between rounded-md bg-white p-4 shadow-md"
        >
          <div>
            {/* Project ID skeleton */}
            <div className="mb-2">
              <div className="mb-1 h-3 w-12 rounded bg-gray-200"></div>
              {/* Project title skeleton */}
              <div className="h-5 w-3/4 rounded bg-gray-300"></div>
            </div>

            {/* Description skeleton */}
            <div className="mb-3 space-y-2">
              <div className="h-3 w-full rounded bg-gray-200"></div>
              <div className="h-3 w-5/6 rounded bg-gray-200"></div>
            </div>

            {/* Created by skeleton */}
            <div className="mb-3">
              <div className="h-3 w-32 rounded bg-gray-200"></div>
            </div>

            {/* Boards count skeleton */}
            <div className="mb-3">
              <div className="h-3 w-24 rounded bg-gray-200"></div>
            </div>

            {/* Members count skeleton */}
            <div className="mb-3">
              <div className="h-3 w-28 rounded bg-gray-200"></div>
            </div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex items-center justify-end space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-300"></div>
            <div className="h-10 w-10 rounded-full bg-gray-300"></div>
            <div className="h-10 w-10 rounded-full bg-gray-300"></div>
          </div>
        </div>
      ))}
    </>
  );
}

export default ProjectCardSkeleton;

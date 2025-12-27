// src/components/layout/KanbanBoardSkeleton.tsx
import React from "react";

const LIST_SKELETON: { cards: string[] }[] = [
  // List 1: big + 3 smaller
  { cards: ["h-[210px]", "h-[150px]", "h-[110px]", "h-[110px]"] },
  // List 2: big + 2 smaller
  { cards: ["h-[210px]", "h-[110px]", "h-[110px]"] },
  // List 3: big + 1 smaller
  { cards: ["h-[210px]", "h-[110px]"] },
];

function KanbanBoardSkeleton() {
  return (
    <div className="kanban-scroll flex h-full flex-row items-start gap-6 overflow-x-auto px-3 pb-10 ">
      {LIST_SKELETON.map((list, index) => (
        <div
          key={index}
          className="
            min-w-[340px]
            rounded-[24px]
            border border-[#E5EAF1]
            bg-white
            shadow-soft
            dark:border-slate500_20
            dark:bg-[#1B232D]
          "
        >
          {/* HEADER (count + title pill) */}
          <div className="flex items-center justify-between rounded-t-[24px] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-[#DFE3E8] dark:bg-[#232C36]" />
              <div className="h-7 w-[110px] rounded-[12px] bg-[#DFE3E8] dark:bg-[#232C36]" />
            </div>

           
          </div>

          {/* BODY (big blocks like design) */}
          <div className="space-y-4 px-4 pb-5">
            {list.cards.map((h, i) => (
              <div
                key={i}
                className={`
                  ${h}
                  animate-pulse
                  rounded-[18px]
                  bg-[#F4F6F8]
                  dark:bg-[#2A333D]
                `}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default KanbanBoardSkeleton;

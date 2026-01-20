// src/components/kanban/KanbanBoard.tsx
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  DragDropContext,
  Droppable,
  DropResult,
  ResponderProvided,
} from "react-beautiful-dnd";
import KanbanContext from "../../context/kanbanContext";
import { AddForm } from "./AddForm";
import KanbanListComponent from "./KanbanListComponent";

export function KanbanBoard() {
  const { kanbanState, handleDragEnd, handleCreateList, userInfo } =
    useContext(KanbanContext);

  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const stickyBarRef = useRef<HTMLDivElement | null>(null);

  const [scrollWidth, setScrollWidth] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  // ✅ No pagination: show all lists
  const visibleLists = useMemo(() => kanbanState, [kanbanState]);

  // measure overflow for sticky bar
  useEffect(() => {
    const el = contentScrollRef.current;
    if (!el) return;

    const update = () => {
      const sw = el.scrollWidth;
      const cw = el.clientWidth;
      setScrollWidth(sw);
      setHasOverflow(sw > cw + 1);
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [visibleLists.length]);

  // sync sticky scrollbar
  useEffect(() => {
    const content = contentScrollRef.current;
    const bar = stickyBarRef.current;
    if (!content || !bar) return;

    let syncing = false;

    const onContentScroll = () => {
      if (syncing) return;
      syncing = true;
      bar.scrollLeft = content.scrollLeft;
      syncing = false;
    };

    const onBarScroll = () => {
      if (syncing) return;
      syncing = true;
      content.scrollLeft = bar.scrollLeft;
      syncing = false;
    };

    content.addEventListener("scroll", onContentScroll, { passive: true });
    bar.addEventListener("scroll", onBarScroll, { passive: true });

    return () => {
      content.removeEventListener("scroll", onContentScroll);
      bar.removeEventListener("scroll", onBarScroll);
    };
  }, [hasOverflow]);

  const onDragEnd = (result: DropResult, _provided: ResponderProvided) => {
    if (!result.destination) return;
    // ✅ No pagination mapping needed anymore
    handleDragEnd(result);
  };

  // column width
  const columnShellClass =
    "shrink-0 w-[calc(100vw-32px)] max-w-[340px] sm:w-[340px]";

  return (
    <>
      {/* =======================
          COLUMNS
         ======================= */}
      <div
        ref={contentScrollRef}
        className={[
          "w-full min-w-0",
          "overflow-x-auto kanban-scroll-hidden",
          "overflow-y-hidden",
          "px-4 pb-6",
        ].join(" ")}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable
            droppableId="all-lists"
            direction="horizontal"
            type="all-lists"
          >
            {(provided) => (
              <div
                className={[
                  "flex min-w-max flex-nowrap",
                  "gap-4 sm:gap-6",
                  "items-start",
                ].join(" ")}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {visibleLists.map((list, index) => (
                  <div key={list.id} className={columnShellClass}>
                    <KanbanListComponent
                      listIndex={index}
                      dragIndex={index}
                      list={list}
                      dense={false} // ✅ dense removed (always normal)
                    />
                  </div>
                ))}

                {provided.placeholder}

                {/* Add column */}
                <div className={columnShellClass}>
                  <div className="shrink-0 p-4">
                    <AddForm
                      text="Add column"
                      placeholder="Untitled"
                      onSubmit={handleCreateList}
                      userInfo={userInfo}
                    />
                  </div>
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Sticky horizontal scrollbar (desktop only) */}
      {hasOverflow && (
        <div className="fixed bottom-0 left-0 right-0 z-50 hidden sm:block">
          <div
            ref={stickyBarRef}
            className="kanban-scroll overflow-x-auto px-2 py-2"
          >
            <div style={{ width: scrollWidth, height: 1 }} />
          </div>
        </div>
      )}
    </>
  );
}

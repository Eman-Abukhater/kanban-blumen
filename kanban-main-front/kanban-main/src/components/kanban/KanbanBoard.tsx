// src/components/kanban/KanbanBoard.tsx
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  DragDropContext,
  Droppable,
  DropResult,
  ResponderProvided,
} from "react-beautiful-dnd";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import KanbanContext from "../../context/kanbanContext";
import { AddForm } from "./AddForm";
import KanbanListComponent from "./KanbanListComponent";

type PageLock = {
  htmlOverflowY: string;
  bodyOverflowY: string;
  htmlOverscroll: string;
  bodyOverscroll: string;
};

export function KanbanBoard() {
  const { kanbanState, handleDragEnd, handleCreateList, userInfo } =
    useContext(KanbanContext);

  // Dense = fixed columns height, only cards scroll inside
  const [dense, setDense] = useState(false);

  // pagination
  const [columnsPerPage, setColumnsPerPage] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsMenuOpen, setRowsMenuOpen] = useState(false);

  const total = kanbanState.length;
  const effectiveColumnsPerPage = columnsPerPage || total || 1;

  const startIndex = page * effectiveColumnsPerPage;
  const endIndex = Math.min(startIndex + effectiveColumnsPerPage, total);

  const canPrev = page > 0;
  const canNext = endIndex < total;

  const prevTotalRef = useRef(total);

  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const stickyBarRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);

  const [scrollWidth, setScrollWidth] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  // measured height for dense
  const [columnHeight, setColumnHeight] = useState<number>(0);

  // lock page scroll in dense (only html/body to avoid breaking inner scroll)
  const pageLockRef = useRef<PageLock | null>(null);

  const visibleLists = useMemo(() => {
    return kanbanState.slice(startIndex, endIndex);
  }, [kanbanState, startIndex, endIndex]);

  // keep pagination behavior
  useEffect(() => {
    if (total <= 0) return;

    if (columnsPerPage === 0) {
      setColumnsPerPage(total);
      setPage(0);
      prevTotalRef.current = total;
      return;
    }

    const prevTotal = prevTotalRef.current;

    if (total > prevTotal) {
      if (columnsPerPage === prevTotal) {
        setColumnsPerPage(total);
        setPage(0);
      } else {
        const cpp = Math.max(1, columnsPerPage);
        const lastPage = Math.max(0, Math.ceil(total / cpp) - 1);
        setPage(lastPage);
      }
    }

    const cpp = Math.max(1, columnsPerPage || total || 1);
    const maxPage = Math.max(0, Math.ceil(total / cpp) - 1);
    if (page > maxPage) setPage(maxPage);

    prevTotalRef.current = total;
  }, [total, columnsPerPage, page]);

  // reset horizontal scroll on page change
  useEffect(() => {
    const content = contentScrollRef.current;
    const bar = stickyBarRef.current;
    if (!content) return;

    content.scrollLeft = 0;
    if (bar) bar.scrollLeft = 0;
  }, [page, effectiveColumnsPerPage]);

  const handlePrev = () => {
    if (canPrev) setPage((p) => p - 1);
  };

  const handleNext = () => {
    if (canNext) setPage((p) => p + 1);
  };

  const handleChangeColumnsPerPage = (value: number) => {
    setColumnsPerPage(value);
    setPage(0);
    setRowsMenuOpen(false);
  };

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
  }, [visibleLists.length, dense, columnHeight]);

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

  // DnD index mapping
  const onDragEnd = (result: DropResult, _provided: ResponderProvided) => {
    if (!result.destination) return;

    const mapped: DropResult = {
      ...result,
      source: {
        ...result.source,
        index: startIndex + result.source.index,
      },
      destination: result.destination
        ? {
            ...result.destination,
            index: startIndex + result.destination.index,
          }
        : null,
    };

    handleDragEnd(mapped);
  };

  // ✅ Dense: compute available height for columns (fit viewport)
  useEffect(() => {
    const updateHeight = () => {
      if (!dense) {
        setColumnHeight(0);
        return;
      }

      const content = contentScrollRef.current;
      if (!content) return;

      const viewportH = window.visualViewport?.height ?? window.innerHeight;
      const top = content.getBoundingClientRect().top;
      const footerH = footerRef.current?.getBoundingClientRect().height ?? 0;

      // if you have any fixed bottom bars (chat widget etc) add here:
      const bottomSafety = 12;

      const h = Math.floor(viewportH - top - footerH - bottomSafety);
      setColumnHeight(Math.max(280, h));
    };

    // run after layout settles
    const raf = requestAnimationFrame(updateHeight);

    window.addEventListener("resize", updateHeight);
    window.visualViewport?.addEventListener("resize", updateHeight);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateHeight);
      window.visualViewport?.removeEventListener("resize", updateHeight);
    };
  }, [dense, rowsMenuOpen, total, page, effectiveColumnsPerPage]);

  // ✅ Dense: lock PAGE vertical scroll (but keep list scroll working)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const restore = () => {
      const prev = pageLockRef.current;
      if (!prev) return;

      html.style.overflowY = prev.htmlOverflowY;
      body.style.overflowY = prev.bodyOverflowY;
      (html.style as any).overscrollBehaviorY = prev.htmlOverscroll;
      (body.style as any).overscrollBehaviorY = prev.bodyOverscroll;

      pageLockRef.current = null;
    };

    if (!dense) {
      restore();
      return;
    }

    // save
    pageLockRef.current = {
      htmlOverflowY: html.style.overflowY,
      bodyOverflowY: body.style.overflowY,
      htmlOverscroll: (html.style as any).overscrollBehaviorY ?? "",
      bodyOverscroll: (body.style as any).overscrollBehaviorY ?? "",
    };

    // lock
    html.style.overflowY = "hidden";
    body.style.overflowY = "hidden";
    (html.style as any).overscrollBehaviorY = "none";
    (body.style as any).overscrollBehaviorY = "none";

    return () => restore();
  }, [dense]);

  // ✅ IMPORTANT: never pass 0 height to lists in dense
  const denseHeight = dense ? Math.max(280, columnHeight || 0) : 0;

  // column width:
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
          dense ? "overflow-y-hidden" : "",
          "px-4",
          dense ? "pb-0" : "pb-6",
        ].join(" ")}
        style={dense ? { height: denseHeight } : undefined}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="all-lists" direction="horizontal" type="all-lists">
            {(provided) => (
              <div
                className={[
                  "flex min-w-max flex-nowrap",
                  "gap-4 sm:gap-6",
                  // ✅ stretch so columns fill the available height
                  dense ? "h-full items-stretch" : "items-start",
                ].join(" ")}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {visibleLists.map((list, visibleIdx) => {
                  const globalIndex = startIndex + visibleIdx;

                  return (
                    <div
                      key={list.id}
                      className={[columnShellClass, dense ? "h-full" : ""].join(" ")}
                    >
                      <KanbanListComponent
                        listIndex={globalIndex}
                        dragIndex={visibleIdx}
                        list={list}
                        dense={dense}
                        // ✅ always give it a real height in dense
                        columnHeight={dense ? denseHeight : undefined}
                      />
                    </div>
                  );
                })}

                {provided.placeholder}

                {/* Add column */}
                <div className={[columnShellClass, dense ? "h-full" : ""].join(" ")}>
                 
                    <div className="shrink-0 p-4">
                      <AddForm
                        text="Add column"
                        placeholder="Untitled"
                        onSubmit={handleCreateList}
                        userInfo={userInfo}
                      />
                    <div className="flex-1 min-h-0" />
                  </div>
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* =======================
          FOOTER
         ======================= */}
      {total > 0 && (
        <div
          ref={footerRef}
          className="
            mx-auto flex w-full items-center justify-between gap-3
            px-4 pb-6 pt-4 text-[13px]
            text-[#212B36] dark:text-slate500_80
          "
        >
          {/* LEFT */}
          <button
            type="button"
            onClick={() => setDense((d) => !d)}
            className="flex shrink-0 items-center gap-2"
          >
            <span
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                ${dense ? "bg-ink dark:bg-ink" : "bg-slate500_20 dark:bg-[#919EAB7A]"}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 rounded-full bg-white shadow-soft transform transition-transform
                  ${dense ? "translate-x-[18px]" : "translate-x-[2px]"}
                `}
              />
            </span>

            <span className="whitespace-nowrap text-[#212B36] dark:text-[#E5EAF1]">
              Dense
            </span>
          </button>

          {/* RIGHT */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-5">
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-5 gap-y-2">
              {/* Columns per page */}
              <div className="flex items-center gap-2">
                <span className="hidden whitespace-nowrap text-[#637381] dark:text-slate500_80 sm:inline">
                  Columns per page:
                </span>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRowsMenuOpen((o) => !o)}
                    className="flex items-center gap-1 whitespace-nowrap text-[13px] text-[#111827] dark:text-[#F9FAFB]"
                  >
                    {effectiveColumnsPerPage}
                    <ChevronDown className="h-4 w-4 text-slate500 dark:text-slate500_80" />
                  </button>

                  {rowsMenuOpen && (
                    <div className="absolute right-0 mt-1 w-20 rounded-[12px] border border-slate500_20 bg-white/98 shadow-[0_18px_45px_rgba(145,158,171,0.24)] dark:border-[#1F2937] dark:bg-[#050B14]">
                      {[2, 3, 4, 5].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleChangeColumnsPerPage(option)}
                          className={`
                            flex w-full items-center justify-between px-3 py-1 text-left text-[13px]
                            hover:bg-slate500_12 dark:hover:bg-white/5
                            ${
                              effectiveColumnsPerPage === option
                                ? "font-semibold text-[#111827] dark:text-white"
                                : "text-[#637381] dark:text-slate500_80"
                            }
                          `}
                        >
                          <span>{option}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Range */}
              <span className="whitespace-nowrap text-[#212B36] dark:text-slate500_80">
                {total === 0
                  ? "0-0 of 0"
                  : `${startIndex + 1}-${endIndex} of ${total}`}
              </span>

              {/* Pagination */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!canPrev}
                  className={`flex h-5 w-5 items-center justify-center ${
                    !canPrev
                      ? "cursor-default text-slate300 dark:text-slate600"
                      : "text-slate500 hover:text-slate900 dark:text-slate500_80 dark:hover:text-white"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canNext}
                  className={`flex h-5 w-5 items-center justify-center ${
                    !canNext
                      ? "cursor-default text-slate300 dark:text-slate600"
                      : "text-slate500 hover:text-slate900 dark:text-slate500_80 dark:hover:text-white"
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

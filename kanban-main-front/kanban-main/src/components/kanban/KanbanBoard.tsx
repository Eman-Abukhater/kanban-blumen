// src/components/kanban/KanbanBoard.tsx
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import KanbanContext from "../../context/kanbanContext";
import { AddForm } from "./AddForm";
import KanbanListComponent from "./KanbanListComponent";

export function KanbanBoard() {
  const { kanbanState, handleDragEnd, handleCreateList, userInfo } =
    useContext(KanbanContext);

  const [dense, setDense] = useState(false);

  // 0 means "not decided yet"
  const [columnsPerPage, setColumnsPerPage] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsMenuOpen, setRowsMenuOpen] = useState(false);

  const total = kanbanState.length;

  const effectiveColumnsPerPage = columnsPerPage || total || 1;

  const startIndex = page * effectiveColumnsPerPage;
  const endIndex = Math.min(startIndex + effectiveColumnsPerPage, total);

  const canPrev = page > 0;
  const canNext = endIndex < total;

  // track previous total to know when a new column was added
  const prevTotalRef = useRef(total);

  useEffect(() => {
    // initial set: show all columns
    if (columnsPerPage === 0 && total > 0) {
      setColumnsPerPage(total);
      setPage(0);
      prevTotalRef.current = total;
      return;
    }

    const prevTotal = prevTotalRef.current;

    // if a new column is added and user was viewing "all columns",
    // expand columnsPerPage so the new column appears instantly.
    if (total > prevTotal && columnsPerPage === prevTotal) {
      setColumnsPerPage(total);
    }

    // clamp page if it becomes invalid
    const cpp = columnsPerPage || total || 1;
    const maxPage = Math.max(0, Math.ceil(total / cpp) - 1);
    if (page > maxPage) setPage(maxPage);

    prevTotalRef.current = total;
  }, [total, columnsPerPage, page]);

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

  const isVisible = useMemo(() => {
    return (idx: number) => idx >= startIndex && idx < endIndex;
  }, [startIndex, endIndex]);

  return (
    <>
      {/* SCROLLABLE COLUMNS AREA */}
      <div className="kanban-scroll overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="all-lists" direction="horizontal" type="all-lists">
            {(provided) => (
              <div
                className="flex h-full min-w-max flex-row flex-nowrap items-start gap-6 pb-10"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {/* Render ALL columns so scrollbar width always grows */}
                {kanbanState.map((list, idx) => (
                  <div
                    key={list.id}
                    className={
                      isVisible(idx)
                        ? "opacity-100"
                        : "pointer-events-none select-none opacity-30"
                    }
                  >
                    <KanbanListComponent
                      listIndex={idx}   // global index for your handlers
                      dragIndex={idx}   // DnD index must match kanbanState order
                      list={list}
                      dense={dense}
                    />
                  </div>
                ))}

                {provided.placeholder}

                {/* ✅ Add column ALWAYS visible */}
                <div className="w-[340px]">
                  <AddForm
                    text="Add column"
                    placeholder="Untitled"
                    onSubmit={handleCreateList}
                    userInfo={userInfo}
                  />
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* FOOTER */}
      {total > 0 && (
        <div className="mx-auto flex max-w-[1120px] items-center justify-between pb-6 pt-4 text-[13px]">
          {/* Dense toggle */}
          <button
            type="button"
            onClick={() => setDense((d) => !d)}
            className="flex items-center gap-2 text-ink dark:text-slate500_80"
          >
            <span
              className={`relative flex h-5 w-9 items-center rounded-full ${
                dense ? "bg-[#111827]" : "bg-slate500_20"
              } transition`}
            >
              <span
                className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  dense ? "translate-x-[18px]" : "translate-x-[2px]"
                }`}
              />
            </span>
            <span className="text-[#212B36] dark:text-slate500_80">Dense</span>
          </button>

          <div className="flex items-center gap-5 text-black dark:text-slate500_80">
            {/* Columns per page */}
            <div className="flex items-center gap-2">
              <span>Columns per page:</span>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRowsMenuOpen((o) => !o)}
                  className="flex items-center gap-1 text-[13px] text-[#111827] dark:text-slate500_80"
                >
                  {effectiveColumnsPerPage}
                  <ChevronDown className="h-4 w-4 text-slate500 dark:text-slate500_80" />
                </button>

                {rowsMenuOpen && (
                  <div className="absolute right-0 mt-1 w-20 rounded-[10px] border border-slate500_20 bg-white py-1 shadow-lg dark:border-slate500_20 dark:bg-[#1B232D]">
                    {[2, 3, 4, 5].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleChangeColumnsPerPage(option)}
                        className={`flex w-full items-center justify-between px-3 py-1 text-left text-[13px] hover:bg-slate500_08 dark:hover:bg-slate500_20 ${
                          effectiveColumnsPerPage === option
                            ? "font-semibold text-[#111827] dark:text-white"
                            : "text-[#637381] dark:text-slate500_80"
                        }`}
                      >
                        <span>{option}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Range */}
            <span className="text-[#212B36] dark:text-slate500_80">
              {total === 0 ? "0-0 of 0" : `${startIndex + 1}-${endIndex} of ${total}`}
            </span>

            {/* Arrows */}
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
      )}
    </>
  );
}

import { useContext } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import KanbanContext from "../../context/kanbanContext";
import { classNames } from "../../utility/css";
import { AddForm } from "./AddForm";
import KanbanListComponent from "./KanbanListComponent";

export interface IKanbanBoardProps {}

export function KanbanBoard(props: IKanbanBoardProps) {
  const { kanbanState, handleDragEnd, handleCreateList, userInfo } =
    useContext(KanbanContext);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable
        droppableId="all-lists"
        direction="horizontal"
        type="all-lists"
      >
        {(provided) => (
          <div
            className="flex h-full flex-1 flex-row items-start gap-6 pb-10"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {/* Columns */}
            {kanbanState.map((list, index) => (
              <KanbanListComponent
                key={list.id}
                listIndex={index}
                list={list}
              />
            ))}

            {provided.placeholder}

            {/* Add column card – styled like Figma “Add column” */}
            {kanbanState.length < 6 && (
              <div
                className={classNames(
                  "flex h-full min-h-[260px] w-[340px] items-center justify-center rounded-[24px] border border-dashed border-slate500_20 bg-[#F4F6F8] px-6 py-5 text-center text-[15px] font-semibold text-slate600 shadow-soft dark:border-slate500_20 dark:bg-[#1B232D] dark:text-slate500_80"
                )}
              >
                <AddForm
                  text="Add column"
                  placeholder="New column name..."
                  onSubmit={handleCreateList}
                  userInfo={userInfo}
                />
              </div>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

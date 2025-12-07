// src/components/kanban/KanbanBoard.tsx
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
            // ⬇️ added flex-wrap + w-full so columns go to a new line instead of overflowing
            className="flex h-full w-full flex-1 flex-row flex-wrap items-start gap-6 pb-10"
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
  <div className="w-[340px] ">
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

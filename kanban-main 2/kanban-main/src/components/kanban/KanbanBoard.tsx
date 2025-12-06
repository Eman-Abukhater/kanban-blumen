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
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="
              flex h-full flex-1 flex-row items-start
              gap-6
              overflow-x-auto
              px-1 pb-10 pt-2
              scrollbar-thin scrollbar-thumb-slate500_20 scrollbar-track-transparent
              dark:scrollbar-thumb-slate500_48
            "
          >
            {kanbanState.map((list, index) => (
              <KanbanListComponent
                key={list.id}
                listIndex={index}
                list={list}
              />
            ))}

            {provided.placeholder}

            {/* Add new list column */}
            <div
              className={classNames(
                "flex-shrink-0",
                kanbanState.length > 0 ? "ml-2" : ""
              )}
            >
              {kanbanState.length < 6 && (
                <AddForm
                  text="Add list"
                  placeholder="New list name..."
                  onSubmit={handleCreateList}
                  userInfo={userInfo}
                />
              )}
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

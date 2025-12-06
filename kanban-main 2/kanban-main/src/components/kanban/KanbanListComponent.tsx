import { useContext } from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { KanbanList } from "./KanbanTypes";
import { AddCardForm } from "./AddCardForm";
import KanbanContext from "../../context/kanbanContext";
import { classNames } from "../../utility/css";
import { ListMenu } from "./ListMenu";
import KanbanCardComponent from "./KanbanCardComponent";
import { Plus } from "lucide-react";

export interface IKanbanListComponentProps {
  listIndex: number;
  list: KanbanList;
}

function KanbanListComponent(props: IKanbanListComponentProps) {
  const { handleCreateCard, userInfo } = useContext(KanbanContext);
  const listNumber = props.listIndex + 1;

  return (
    <Draggable draggableId={props.list.id} index={props.listIndex}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-[300px]"
        >
          <div className="flex cursor-grab touch-manipulation flex-col">
            {/* Column container – matches Figma card */}
            <div
              className="
                flex h-full flex-col rounded-[20px]
                bg-[#F4F6F8] shadow-soft
                dark:bg-[#1B232D] dark:shadow-none
              "
            >
              {/* Header */}
              <div
                {...provided.dragHandleProps}
                className="
                  flex items-center justify-between
                  rounded-t-[20px] px-4 pt-4 pb-3
                  text-[15px] font-semibold text-ink
                  dark:text-white
                "
              >
                <div className="flex items-center gap-2">
                  {/* number badge like Figma (3, 2, …) */}
                  <span className="
                    flex h-7 w-7 items-center justify-center rounded-full
                    bg-white text-[13px] font-semibold text-[#637381]
                    shadow-[0_2px_6px_rgba(15,23,42,0.08)]
                    dark:bg-[#141A21] dark:text-slate500_80
                  ">
                    {listNumber}
                  </span>
                  <span>{props.list.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* small + button – visual only, add card is still at bottom */}
                  <button
                    type="button"
                    className="
                      flex h-7 w-7 items-center justify-center rounded-full
                      bg-white text-[#1C252E] shadow-soft
                      hover:opacity-90
                      dark:bg-[#141A21] dark:text-slate500_80
                    "
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  <ListMenu
                    listid={props.list.kanbanListId}
                    listIndex={props.listIndex}
                    title={props.list.title}
                    userInfo={userInfo}
                  />
                </div>
              </div>

              {/* Cards area */}
              <Droppable droppableId={props.list.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex min-h-[40px] flex-col gap-3 px-3 pb-4 pt-2"
                  >
                    {props.list.kanbanCards?.map((_card, index) => (
                      <KanbanCardComponent
                        key={_card.id}
                        listIndex={props.listIndex}
                        cardIndex={index}
                        card={_card}
                      />
                    ))}
                    {provided.placeholder}

                    {/* “Task name / Add card” zone (bottom) */}
                    {props.list.kanbanCards.length < 31 && (
                      <div className="mt-1">
                        <AddCardForm
                          text="Add card"
                          placeholder="New card name..."
                          onSubmit={(
                            title,
                            kanbanCardId,
                            seqNo,
                            fkKanbanListId
                          ) =>
                            handleCreateCard(
                              props.listIndex,
                              title,
                              kanbanCardId,
                              seqNo,
                              fkKanbanListId
                            )
                          }
                          userInfo={userInfo}
                          fkKanbanListId={props.list.kanbanListId}
                        />
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default KanbanListComponent;

import { useContext, useState } from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { KanbanList } from "./KanbanTypes";
import { AddCardForm } from "./AddCardForm";
import KanbanContext from "../../context/kanbanContext";
import { classNames } from "../../utility/css";
import { ListMenu } from "./ListMenu";
import KanbanCardComponent from "./KanbanCardComponent";
import { Plus } from "lucide-react";
import Image from "next/image";

export interface IKanbanListComponentProps {
  listIndex: number;
  list: KanbanList;
  dense: boolean;
}

function KanbanListComponent(props: IKanbanListComponentProps) {
  const { handleCreateCard, userInfo } = useContext(KanbanContext);

  const cardCount = props.list.kanbanCards?.length ?? 0;
  const [showAddCard, setShowAddCard] = useState(false);

  return (
    <Draggable draggableId={props.list.id} index={props.listIndex}>
      {(provided) => (
        <div
          className={classNames(
            "flex w-[340px] flex-col rounded-[24px] border border-[#E5EAF1] bg-[#F4F6F8] shadow-soft",
            "dark:border-slate500_20 dark:bg-[#1B232D]"
          )}
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <div className="flex touch-manipulation flex-col">
            {/* HEADER */}
            <div className="flex items-center justify-between rounded-t-[24px] px-5 py-4">
              {/* left: count + title */}
              <div className="flex items-center gap-3">
                {/* smaller badge like figma */}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DFE3E8] text-[11px] font-bold">
                  {cardCount}
                </span>

                <div className="text-[17px] font-semibold text-ink dark:text-white">
                  {props.list.title}
                </div>
              </div>

              {/* right: add + menu + drag */}
              <div className="flex items-center gap-1">
                {/* 1) Add */}
                <button
                  type="button"
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1C252E] text-white text-bold shadow-soft hover:opacity-90 dark:bg-white dark:text-ink"
                  onClick={() => {
                    setShowAddCard(true);
                    setTimeout(() => {
                      const el = document.getElementById(
                        `add-card-${props.list.kanbanListId}`
                      );
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                        const input = el.querySelector("input");
                        if (input) (input as HTMLInputElement).focus();
                      }
                    }, 0);
                  }}
                  title="Add"
                >
                  <Plus className="h-2 w-2 text-white text-bold" />
                </button>

                {/* 2) Three dots menu */}
                <ListMenu
                  listid={props.list.kanbanListId}
                  listIndex={props.listIndex}
                  title={props.list.title}
                  userInfo={userInfo}
                />

                {/* 3) Drag icon handle ONLY */}
                <div
                  className="cursor-grab active:cursor-grabbing"
                  {...provided.dragHandleProps}
                  title="Drag"
                >
                  <Image
                    src="/icons/drag_icon.png"
                    alt="drag"
                    width={18}
                    height={18}
                    className="opacity-80"
                  />
                </div>
              </div>
            </div>

            {/* BODY */}
            <Droppable droppableId={props.list.id}>
              {(dropProvided) => (
                <div
                  className="flex min-h-[50px] flex-col"
                  {...dropProvided.droppableProps}
                  ref={dropProvided.innerRef}
                >
                  <div className="space-y-3 px-4 pb-4 pt-3">
                    {/* Add card input */}
                    <div id={`add-card-${props.list.kanbanListId}`}>
                      {showAddCard && (
                        <AddCardForm
                          text="Add card"
                          placeholder="Task name"
                          onSubmit={(title, kanbanCardId, seqNo, fkKanbanListId) =>
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
                          onCreated={() => setShowAddCard(false)}
                        />
                      )}
                    </div>

                    {/* Cards */}
                    {props.list.kanbanCards?.map((card, index) => (
                      <KanbanCardComponent
                        key={card.id}
                        listIndex={props.listIndex}
                        cardIndex={index}
                        card={card}
                      />
                    ))}

                    {dropProvided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default KanbanListComponent;

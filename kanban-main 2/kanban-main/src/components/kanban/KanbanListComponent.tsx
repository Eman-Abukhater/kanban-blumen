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

  const cardCount = props.list.kanbanCards?.length ?? 0;

  return (
    <Draggable draggableId={props.list.id} index={props.listIndex}>
      {(provided) => (
        <div
          className={classNames(
            props.listIndex > 0 ? "ml-0" : "",
            // column container like Figma
            "flex w-[340px] flex-col rounded-[24px] border border-[#E5EAF1] bg-[#F4F6F8] shadow-soft dark:border-slate500_20 dark:bg-[#1B232D]"
          )}
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <div className="flex cursor-grab touch-manipulation flex-col">
            {/* HEADER */}
            <div
              {...provided.dragHandleProps}
              className="flex items-center justify-between rounded-t-[24px] px-5 pt-4 pb-3 focus:outline-none dark:text-white"
            >
              <div className="flex items-center gap-3">
                {/* count bubble */}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5EAF1] text-[13px] font-semibold text-slate600 dark:bg-[#232C36] dark:text-slate500_80">
                  {cardCount}
                </span>

                {/* list title */}
                <div className="text-[16px] font-semibold text-ink dark:text-white">
                  {props.list.title}
                </div>
              </div>

              {/* right icons: + and list menu */}
              <div className="flex items-center gap-2">
                {/* plus = add card (just focuses the AddCardForm area visually) */}
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-soft hover:bg-[#F4F6F8] dark:bg-[#232C36] dark:text-white dark:hover:bg-[#28313C]"
                  // we keep behaviour simple: scroll to bottom where AddCardForm is
                  onClick={() => {
                    const el = document.getElementById(
                      `add-card-${props.list.kanbanListId}`
                    );
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "end" });
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </button>

                {/* menu (three dots) */}
                <ListMenu
                  listid={props.list.kanbanListId}
                  listIndex={props.listIndex}
                  title={props.list.title}
                  userInfo={userInfo}
                />
              </div>
            </div>

            {/* BODY (cards + add card) */}
            <Droppable droppableId={props.list.id}>
              {(provided) => (
                <div
                  className="flex min-h-[50px] flex-col"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  <div className="space-y-3 px-4 pb-4 pt-1">
                    {props.list.kanbanCards?.map((card, index) => (
                      <KanbanCardComponent
                        key={card.id}
                        listIndex={props.listIndex}
                        cardIndex={index}
                        card={card}
                      />
                    ))}
                    {provided.placeholder}

                    {/* Add card area – bottom like Figma */}
                    {props.list.kanbanCards.length < 31 && (
                      <div id={`add-card-${props.list.kanbanListId}`}>
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

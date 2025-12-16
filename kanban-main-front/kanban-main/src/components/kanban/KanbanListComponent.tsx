import { useContext, useState } from "react"; // 👈 تأكدي useState موجودة
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
  dense: boolean;
}

function KanbanListComponent(props: IKanbanListComponentProps) {
  const { handleCreateCard, userInfo } = useContext(KanbanContext);

  const cardCount = props.list.kanbanCards?.length ?? 0;

  // 👇 هل نظهر input إضافة الكارد؟
  const [showAddCard, setShowAddCard] = useState(false);

  return (
    <Draggable draggableId={props.list.id} index={props.listIndex}>
      {(provided) => (
        <div
          className={classNames(
            props.listIndex > 0 ? "ml-0" : "",
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
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5EAF1] text-[13px] font-semibold text-slate600 dark:bg-[#232C36] dark:text-slate500_80">
                  {cardCount}
                </span>

                <div className="text-[16px] font-semibold text-ink dark:text-white">
                  {props.list.title}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* زر + يفتح input إضافة الكارد */}
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-soft dark:bg-white dark:text-black"
                  onClick={() => {
                    setShowAddCard(true);
                    setTimeout(() => {
                      const el = document.getElementById(
                        `add-card-${props.list.kanbanListId}`
                      );
                      if (el) {
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                        const input = el.querySelector("input");
                        if (input) (input as HTMLInputElement).focus();
                      }
                    }, 0);
                  }}
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

            {/* BODY */}
            <Droppable droppableId={props.list.id}>
              {(provided) => (
                <div
                  className="flex min-h-[50px] flex-col"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  <div className="space-y-3 px-4 pb-4 pt-3">
                    {/* input Add card يظهر فقط عند showAddCard */}
                    <div id={`add-card-${props.list.kanbanListId}`}>
                      {showAddCard && (
                        <AddCardForm
                          text="Add card"
                          placeholder="Task name"
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
                          onCreated={() => setShowAddCard(false)} // 👈 أخفيه بعد الإنشاء
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

                    {provided.placeholder}
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

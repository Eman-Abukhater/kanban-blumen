// src/components/kanban/KanbanListComponent.tsx
import { useContext, useEffect, useRef, useState } from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { KanbanList } from "./KanbanTypes";
import { AddCardForm } from "./AddCardForm";
import KanbanContext from "../../context/kanbanContext";
import { classNames } from "../../utility/css";
import { ListMenu } from "./ListMenu";
import KanbanCardComponent from "./KanbanCardComponent";
import { Plus } from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";

export interface IKanbanListComponentProps {
  listIndex: number; // ✅ global index
  dragIndex: number; // ✅ visible index for DnD
  list: KanbanList;
  dense: boolean;
}

function KanbanListComponent(props: IKanbanListComponentProps) {
  const { handleCreateCard, handleRenameList, userInfo } = useContext(KanbanContext);

  const cardCount = props.list.kanbanCards?.length ?? 0;
  const [showAddCard, setShowAddCard] = useState(false);

  // ✅ Inline rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(props.list.title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // keep input synced when list title changes (but not while editing)
  useEffect(() => {
    if (!isRenaming) setRenameValue(props.list.title);
  }, [props.list.title, isRenaming]);

  const startRename = () => {
    setIsRenaming(true);
    // focus & select
    setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 0);
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setRenameValue(props.list.title);
  };

  const commitRename = () => {
    const next = renameValue.trim();

    if (!next) {
      toast.error("List title cannot be empty", { position: toast.POSITION.TOP_CENTER });
      cancelRename();
      return;
    }

    if (next === props.list.title.trim()) {
      setIsRenaming(false);
      return;
    }

    // ✅ update local state via context
    handleRenameList(props.listIndex, next);


    setIsRenaming(false);
    toast.success("List renamed", { position: toast.POSITION.TOP_CENTER });
  };

  return (
    <Draggable draggableId={props.list.id} index={props.dragIndex}>
      {(provided) => (
        <div
          className={classNames(
            "flex w-[340px] flex-col rounded-[24px] border border-[#E5EAF1] bg-[#F4F6F8] shadow-soft",
            "dark:border-slate500_20 dark:bg-[#1B232D]"
          )}
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={provided.draggableProps.style} // ✅ important for smooth drag
        >
          <div className="flex touch-manipulation flex-col">
            <div className="flex items-center justify-between rounded-t-[24px] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DFE3E8] text-[11px] font-bold">
                  {cardCount}
                </span>

                {/* ✅ Title / Inline rename */}
                {!isRenaming ? (
                  <div className="text-[17px] font-semibold text-ink dark:text-white">
                    {props.list.title}
                  </div>
                ) : (
                 <input
  ref={renameInputRef}
  value={renameValue}
  onChange={(e) => setRenameValue(e.target.value)}
  onBlur={commitRename}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelRename();
    }
  }}
  className="
                      h-10 w-[170px] max-w-[170px]
                      rounded-[10px] border-2 border-[#1C252E] bg-white
                      px-3 text-[16px] font-semibold text-ink
                      outline-none
                      focus:outline-none focus:ring-0 focus:ring-offset-0
                      focus:border-[#1C252E]
                      focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0
                      dark:bg-[#1C252E] dark:text-white dark:border-white
                    "


/>

                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1C252E] text-white shadow-soft hover:opacity-90 dark:bg-white dark:text-ink"
                  onClick={() => {
                    setShowAddCard(true);
                    setTimeout(() => {
                      const el = document.getElementById(`add-card-${props.list.kanbanListId}`);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                        const input = el.querySelector("input");
                        if (input) (input as HTMLInputElement).focus();
                      }
                    }, 0);
                  }}
                  title="Add"
                >
                  <Plus className="h-3 w-3" />
                </button>

                {/* ✅ Menu: rename now inline */}
                <ListMenu
                  listid={props.list.kanbanListId}
                  listIndex={props.listIndex}
                  title={props.list.title}
                  userInfo={userInfo}
                  onRename={startRename}
                />

                {/* ✅ drag handle only */}
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

            <Droppable droppableId={props.list.id}>
              {(dropProvided) => (
                <div
                  className="flex min-h-[50px] flex-col"
                  {...dropProvided.droppableProps}
                  ref={dropProvided.innerRef}
                >
                  <div className="space-y-3 px-4 pb-4 pt-3">
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

import { useContext } from "react";
import { Draggable } from "react-beautiful-dnd";
import KanbanContext from "../../context/kanbanContext";
import { classNames } from "../../utility/css";
import { KanbanCard } from "./KanbanTypes";
import { GetCardImagePath } from "@/utility/baseUrl";
import { MessageCircle, Paperclip } from "lucide-react";

export interface IKanbanCardComponentProps {
  listIndex: number;
  cardIndex: number;
  card: KanbanCard;
}

/** helper types – keep them optional so nothing breaks if backend doesn't send them */
type Assignee = {
  id?: string | number;
  name?: string;
  avatarUrl?: string;
};

export default function KanbanCardComponent(props: IKanbanCardComponentProps) {
  const { handleOpenModal } = useContext(KanbanContext);

  const calculateTaskCompleted = () => {
    let completedTask = 0;
    for (let i = 0; i < props.card.kanbanTasks.length; i++) {
      if (props.card.kanbanTasks[i].completed) {
        completedTask++;
      }
    }
    return completedTask;
  };

  const CardImagePath = GetCardImagePath();

  const isCloudinaryUrl = (url: string) => {
    return url && (url.startsWith("http://") || url.startsWith("https://"));
  };

  const getImageUrl = () => {
    if (!props.card.imageUrl) return "";
    if (isCloudinaryUrl(props.card.imageUrl)) return props.card.imageUrl;
    return `${CardImagePath}/${props.card.kanbanCardId}/${props.card.imageUrl}`;
  };

  // Figma footer data (all optional, so UI never crashes)
  const commentCount =
    (props.card as any).commentCount ??
    (props.card as any).commentsCount ??
    0;
  const attachmentCount =
    (props.card as any).attachmentCount ??
    (props.card as any).attachmentsCount ??
    0;
  const assignees: Assignee[] =
    ((props.card as any).assignees as Assignee[]) ??
    ((props.card as any).members as Assignee[]) ??
    [];

  const visibleAssignees = assignees.slice(0, 3);
  const extraAssignees = assignees.length - visibleAssignees.length;

  return (
    <Draggable draggableId={props.card.id} index={props.cardIndex}>
      {(provided) => (
        <div
          className="w-full rounded-[16px] border border-slate500_08 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition-shadow duration-200 ease-in-out hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)] focus:outline-none dark:border-slate500_20 dark:bg-[#1B232D] dark:text-white dark:hover:shadow-none"
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          onClick={() =>
            handleOpenModal({
              type: "UPDATE_CARD",
              modalProps: {
                listIndex: props.listIndex,
                cardIndex: props.cardIndex,
                card: props.card,
              },
            })
          }
        >
        {props.card.imageUrl && (
  <div
   className={classNames(
  props.card.completed ? "opacity-50" : "opacity-100",
  "p-2"
)}

  >
    <div className="h-50 overflow-hidden rounded-[16px] border border-slate500_12 bg-white dark:border-slate500_20 dark:bg-[#1B232D]">
      <img
        src={getImageUrl()}
        alt="task banner"
        className="h-full w-full object-cover"
        onError={({ currentTarget }) => {
          currentTarget.onerror = null;
          currentTarget.src = `/static/kanbanDefaultBanner.jpg`;
        }}
      />
    </div>
  </div>
)}

          {/* Card body */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span
             className="truncate text-[15px] font-semibold text-ink dark:text-white"

              >
                {props.card.title}
              </span>

            {/* tasks count badge (small, upper-right) */}
              {!props.card.completed && props.card.kanbanTasks.length > 0 && (
                <div className="text-[12px] font-medium text-slate600 dark:text-slate500_80">
                  {calculateTaskCompleted()}/{props.card.kanbanTasks.length}
                </div>
              )}

             
            </div>

          <>
  {props.card.desc && (
    <div className="mb-1 mt-2">
      <p className="truncate text-[13px] text-slate500 dark:text-slate400">
        {props.card.desc}
      </p>
    </div>
  )}

  {props.card.kanbanTags.length > 0 && (
    <div className="mt-1 flex flex-wrap gap-1">
      {props.card.kanbanTags.map((tag, index) => (
        <span
          key={index}
          className={classNames(
            "rounded-[999px] px-3 py-1 text-[12px] font-semibold",
            tag.color
          )}
        >
          {tag.title}
        </span>
      ))}
    </div>
  )}
</>


            {/* FOOTER: comments + attachments + assignees (Figma style) */}
            <div className="mt-3 flex items-center justify-between">
              {/* left: comments + attachments */}
             

              {/* right: avatars */}
              {assignees.length > 0 && (
                <div className="flex items-center">
                  {visibleAssignees.map((user, idx) => {
                    const initials =
                      user.name
                        ?.split(" ")
                        .map((p) => p[0])
                        .join("")
                        .toUpperCase() || "?";

                    return (
                      <div
                        key={user.id ?? idx}
                        className={classNames(
                          idx > 0 ? "-ml-2" : "",
                          "flex h-7 w-7 items-center justify-center rounded-full bg-[#E5EAF1] text-[11px] font-semibold text-slate700 shadow-[0_0_0_2px_#FFFFFF] dark:bg-[#232C36] dark:text-white dark:shadow-[0_0_0_2px_#1B232D]"
                        )}
                      >
                        {user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatarUrl}
                            alt={user.name || "user"}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                    );
                  })}

                  {extraAssignees > 0 && (
                    <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#FFEFAF] text-[11px] font-semibold text-[#D7941B] shadow-[0_0_0_2px_#FFFFFF] dark:shadow-[0_0_0_2px_#1B232D]">
                      +{extraAssignees}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

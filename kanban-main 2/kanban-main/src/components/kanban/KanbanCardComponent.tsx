import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useContext } from "react";
import { Draggable } from "react-beautiful-dnd";
import KanbanContext from "../../context/kanbanContext";
import { classNames } from "../../utility/css";
import { KanbanCard } from "./KanbanTypes";
import { GetCardImagePath } from "@/utility/baseUrl";

export interface IKanbanCardComponentProps {
  listIndex: number;
  cardIndex: number;
  card: KanbanCard;
}

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

  const isCloudinaryUrl = (url: string) =>
    url && (url.startsWith("http://") || url.startsWith("https://"));

  const getImageUrl = () => {
    if (!props.card.imageUrl) return "";
    if (isCloudinaryUrl(props.card.imageUrl)) return props.card.imageUrl;
    return `${CardImagePath}/${props.card.kanbanCardId}/${props.card.imageUrl}`;
  };

  const handleClick = () =>
    handleOpenModal({
      type: "UPDATE_CARD",
      modalProps: {
        listIndex: props.listIndex,
        cardIndex: props.cardIndex,
        card: props.card,
      },
    });

  return (
    <Draggable draggableId={props.card.id} index={props.cardIndex}>
      {(provided) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={handleClick}
          className="
            w-[272px] cursor-pointer rounded-[18px]
            border border-slate500_08 bg-white
            shadow-[0_12px_30px_rgba(15,23,42,0.08)]
            transition-transform duration-150 ease-out
            hover:-translate-y-[1px] hover:shadow-[0_18px_45px_rgba(15,23,42,0.18)]
            dark:border-slate500_20 dark:bg-[#1B232D] dark:shadow-none
          "
        >
          {/* Optional banner image */}
          {props.card.imageUrl && (
            <div
              className={classNames(
                props.card.completed ? "opacity-60" : "opacity-100",
                "h-[160px] overflow-hidden rounded-t-[18px]"
              )}
            >
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
          )}

          {/* Content */}
          <div className="px-4 py-3">
            {/* Title + status */}
            <div className="mb-1 flex items-center justify-between gap-3">
              <span
                className={classNames(
                  props.card.completed
                    ? "text-slate-400 dark:text-slate500_80"
                    : "text-ink dark:text-white",
                  "truncate text-[14px] font-semibold leading-[20px]"
                )}
              >
                {props.card.title}
              </span>

              {!props.card.completed && props.card.kanbanTasks.length > 0 && (
                <span className="text-[12px] font-medium text-[#637381] dark:text-slate500_80">
                  {calculateTaskCompleted()}/{props.card.kanbanTasks.length}
                </span>
              )}

              {props.card.completed && (
                <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
              )}
            </div>

            {/* Description */}
            {props.card.completed === false && props.card.desc && (
              <p className="mb-2 truncate text-[12px] text-[#919EAB] dark:text-slate500_80">
                {props.card.desc}
              </p>
            )}

            {/* Tags row */}
            {props.card.completed === false && (
              <div className="flex flex-wrap gap-1.5">
                {props.card.kanbanTags.map((_tag, index) => (
                  <span
                    key={index}
                    className={classNames(
                      props.card.kanbanTags.length > 0 ? "mt-1" : "",
                      "rounded-full px-3 py-[3px] text-[11px] font-semibold",
                      _tag.color // your color classes (bg-*)
                    )}
                  >
                    {_tag.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>
      )}
    </Draggable>
  );
}

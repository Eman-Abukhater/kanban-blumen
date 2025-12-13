import { AddCard } from "@/services/kanbanApi";
import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useState,
} from "react";
import { toast } from "react-toastify";

export interface IAddFormProps {
  text: string;
  placeholder: string;
  onSubmit: (
    name: string,
    kanbanCardId: number,
    seqNo: number,
    fkKanbanListId: number
  ) => void;
    userInfo: any;
  fkKanbanListId: number;
}

export function AddCardForm(props: IAddFormProps) {
  const [name, setName] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const createCard = async () => {
    const trimmed = name.trim();
    if (!trimmed || isCreating) return;

    setIsCreating(true);

    // add new card in db (same logic as before)
    const customResponse = await AddCard(
      trimmed,
      props.fkKanbanListId,
      props.userInfo.username,
      props.userInfo.id,
      props.userInfo.fkboardid,
      props.userInfo.fkpoid
    );

    setIsCreating(false);

    if (customResponse?.status === 200 && customResponse.data) {
      props.onSubmit(
        trimmed,
        customResponse.data.kanbanCardId,
        customResponse.data.seqNo,
        props.fkKanbanListId
      );
      toast.success(
        `Card ID: ${customResponse.data.kanbanCardId} Created Successfully`,
        { position: toast.POSITION.TOP_CENTER }
      );
      setName("");
    } else {
      toast.error(
        "Something went wrong, could not add the card. Please try again later.",
        { position: toast.POSITION.TOP_CENTER }
      );
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void createCard();
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void createCard();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        {/* White card: Task name input (Figma) */}
        <div className="w-full rounded-[16px] border border-[#E5EAF1] bg-white px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-slate500_20 dark:bg-[#1B232D]">
          {isCreating ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-3/4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
              <div className="h-3 w-1/2 rounded-full bg-slate500_08 dark:bg-slate500_20" />
            </div>
          ) : (
            <input
              className="w-full border-none bg-transparent text-[14px] text-ink placeholder:text-slate500 outline-none dark:text-white dark:placeholder:text-slate500_80"
              placeholder={props.placeholder || "Task name"}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          )}
        </div>

        {/* Helper text under input */}
        <p className="mt-1 px-1 text-[12px] text-slate500 dark:text-slate500_80">
          Press Enter to create the task.
        </p>
      </div>
    </form>
  );
}

import { AddCard } from "@/services/kanbanApi";
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useInvalidateKanban } from "@/hooks/useKanbanMutations";

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
  onCreated?: () => void; // 👈 New
}

export function AddCardForm(props: IAddFormProps) {
  const [name, setName] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);
  const invalidateKanban = useInvalidateKanban();

  // Handle creating a new task
  const createCard = async () => {
    let trimmed = name.trim();
    if (!trimmed || isCreating) return;

    // If the task name exceeds 100 characters, trim it and show a toast
    if (trimmed.length > 100) {
      trimmed = trimmed.slice(0, 100);
      toast.warning("Task title has been shortened to 100 characters", {
        position: toast.POSITION.TOP_CENTER,
      });
    }

    setIsCreating(true);

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

      setName("");
      props.onCreated?.();

      toast.success(
        `Card ID: ${customResponse.data.kanbanCardId} Created Successfully`,
        { position: toast.POSITION.TOP_CENTER }
      );

      invalidateKanban(); // Invalidate in background
      return;
    } else {
      toast.error(
        "Something went wrong, could not add the card. Please try again later.",
        { position: toast.POSITION.TOP_CENTER }
      );
    }
  };

  // Handle keydown for Enter key
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void createCard();
    }
  };

  // Handle form submission
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void createCard();
  };

  // Handle closing the form when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        props.onCreated?.(); // Close form if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div className="mb-3">
        <div className="w-full rounded-[16px] border border-[#E5EAF1] bg-white px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-slate500_20 dark:bg-[#1B232D]">
          {isCreating ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-3/4 rounded-full bg-slate500_12 dark:bg-slate500_20" />
              <div className="h-3 w-1/2 rounded-full bg-slate500_08 dark:bg-slate500_20" />
            </div>
          ) : (
           <input
  className="w-full border-none bg-transparent text-[14px] text-ink placeholder:text-slate500 
    outline-none focus:outline-none focus-visible:outline-none focus:ring-0
    dark:text-white dark:placeholder:text-slate500_80"
  placeholder={props.placeholder || 'Task name'}
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  onKeyDown={handleKeyDown}
/>
          )}
        </div>

        <p className="mt-1 px-1 text-[12px] text-slate500 dark:text-slate500_80">
          Press Enter to create the task.
        </p>
      </div>
    </form>
  );
}
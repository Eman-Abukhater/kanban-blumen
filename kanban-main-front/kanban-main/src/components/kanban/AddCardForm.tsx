import { AddCard } from "@/services/kanbanApi";
import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
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
  onCreated?: () => void;
}

export function AddCardForm(props: IAddFormProps) {
  const [name, setName] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);
  const invalidateKanban = useInvalidateKanban();

  const createCard = async () => {
    let trimmed = name.trim();
    if (!trimmed || isCreating) return;

    if (trimmed.length > 100) {
      trimmed = trimmed.slice(0, 100);
      toast.warning("Task title has been shortened to 100 characters", {
        position: toast.POSITION.TOP_CENTER,
      });
    }

    // ✅ 1) Optimistic UI FIRST (instant)
    const tempCardId = -Date.now(); // negative = temp
    const tempSeqNo = Date.now(); // any big unique number so it goes to bottom safely
    props.onSubmit(trimmed, tempCardId, tempSeqNo, props.fkKanbanListId);

    setName("");
    props.onCreated?.();

    // ✅ 2) Instant toast (don’t wait network)
    const toastId = toast.loading("Creating task...", {
      position: toast.POSITION.TOP_CENTER,
    });

    setIsCreating(true);

    try {
      const customResponse = await AddCard(
        trimmed,
        props.fkKanbanListId,
        props.userInfo.username,
        props.userInfo.id,
        props.userInfo.fkboardid,
        props.userInfo.fkpoid
      );

      if (customResponse?.status === 200 && customResponse.data) {
        toast.update(toastId, {
          render: `Task created (#${customResponse.data.kanbanCardId})`,
          type: "success",
          isLoading: false,
          autoClose: 1800,
        });

        void invalidateKanban();
        return;
      }

      throw new Error(
        "Something went wrong, could not add the card. Please try again later."
      );
    } catch (err: any) {
      toast.update(toastId, {
        render: err?.message || "Failed to create task.",
        type: "error",
        isLoading: false,
        autoClose: 2500,
      });

      // ✅ refetch to clean temp optimistic card if backend failed
     void invalidateKanban();
    } finally {
      setIsCreating(false);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        props.onCreated?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              className="
                no-global-focus w-full border-none bg-transparent text-[14px] text-ink placeholder:text-slate500
                outline-none focus:outline-none focus-visible:outline-none focus:ring-0
                dark:text-white dark:placeholder:text-slate500_80
              "
              placeholder={props.placeholder || "Task name"}
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
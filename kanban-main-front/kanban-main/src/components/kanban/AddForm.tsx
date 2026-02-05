import { AddKanbanList } from "@/services/kanbanApi";
import { PlusIcon } from "@heroicons/react/24/outline";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useInvalidateKanban } from "@/hooks/useKanbanMutations";

export interface IAddFormProps {
  text: string;
  placeholder: string;
  onSubmit: (
    name: string,
    kanbanListId: number,
    seqNo: number,
    fkboardid: number
  ) => void;
  userInfo: any;
}

export function AddForm(props: IAddFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const invalidateKanban = useInvalidateKanban();

  const [name, setName] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const closeForm = () => {
    setShowForm(false);
    setName("");
  };

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeForm();
      }
    };

    const node = formRef.current;
    node?.addEventListener("keydown", handleKeyDown);

    return () => {
      node?.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (showForm) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [showForm]);

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) return;

    // Validate input length (max 100 characters)
    if (trimmed.length > 100) {
      toast.error("Column name cannot exceed 100 characters.", {
        position: toast.POSITION.TOP_CENTER,
      });
      return;
    }

    try {
      setIsCreating(true);

      const customResponse = await AddKanbanList(
        trimmed,
        props.userInfo.fkboardid,
        props.userInfo.username,
        props.userInfo.id,
        props.userInfo.fkpoid
      );

      if (customResponse?.status === 200 && customResponse?.data) {
        props.onSubmit(
          trimmed,
          customResponse.data.kanbanListId,
          customResponse.data.seqNo,
          props.userInfo.fkboardid
        );
        await invalidateKanban();

        toast.success(
          `List "${trimmed}" created successfully`,
          { position: toast.POSITION.TOP_CENTER }
        );

        closeForm();
        return;
      }

      toast.error(
        `Something went wrong. Could not add the list, please try again later.`,
        { position: toast.POSITION.TOP_CENTER }
      );
    } catch (e: any) {
      toast.error(e?.message || "Failed to create list.", {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      {isCreating ? (
        // Skeleton while creating
        <div className="min-w-[256px] animate-pulse rounded-[16px] border border-slate500_12 bg-white p-4 dark:border-slate500_20 dark:bg-[#1B232D]">
          <div className="mb-3 h-6 w-32 rounded bg-slate500_12 dark:bg-slate500_20"></div>
          <div className="space-y-2">
            <div className="h-12 w-full rounded-[12px] bg-slate500_12 dark:bg-slate500_20"></div>
            <div className="h-4 w-52 rounded bg-slate500_12 dark:bg-slate500_20"></div>
          </div>
        </div>
      ) : showForm ? (
        <form
          ref={formRef}
          autoComplete="off"
          onSubmit={handleSubmit}
          onBlur={() => {
            if (!name.trim()) closeForm();
          }}
        >
          <div className="min-w-[256px] rounded-[16px] border border-slate500_12 bg-white p-4 dark:border-slate500_20 dark:bg-[#1B232D]">
       <input
  ref={inputRef}
  className="
    h-12 w-full
    max-w-full
    rounded-[12px]
    border-2 border-slate500_20 bg-white px-4
    text-[16px] font-medium text-ink
    placeholder:text-slate500
    outline-none
    focus:outline-none
    focus:ring-0 focus:ring-offset-0
    focus:border-ink
    dark:border-slate500_20 dark:bg-[#141A21]
    dark:text-white dark:placeholder:text-slate500_80
    dark:focus:border-white
  "
  placeholder={props.placeholder}
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  maxLength={100}  // Limit input to 100 characters
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }}
/>


            <p className="mt-2 text-[13px] text-slate600 dark:text-slate500_80">
              Press Enter to create the column.
            </p>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="
            flex min-w-[256px] items-center justify-center gap-2
            rounded-[16px] border border-slate500_12 bg-white px-4 py-3
            text-[14px] font-semibold text-ink
            hover:bg-slate500_08
            dark:border-slate500_20 dark:bg-[#1B232D] dark:text-white dark:hover:bg-slate500_20
          "
        >
          <PlusIcon className="h-4 w-4 text-slate500 dark:text-slate500_80" />
          {props.text}
        </button>
      )}
    </div>
  );
}

import { AddKanbanList } from "@/services/kanbanApi";
import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

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
  const [name, setName] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowForm(false);
        setName("");
      }
    };
    formRef.current?.addEventListener("keydown", handleKeyDown);
    return () => {
      formRef.current?.removeEventListener("keydown", handleKeyDown);
    };
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (name) {
      setIsCreating(true);
      setShowForm(false);

      //add new list in db
      const customResponse = await AddKanbanList(
        name,
        props.userInfo.fkboardid,
        props.userInfo.username,
        props.userInfo.id,
        props.userInfo.fkpoid
      );

      setIsCreating(false);

      if (customResponse?.status === 200) {
        props.onSubmit(
          name,
          customResponse.data.kanbanListId,
          customResponse.data.seqNo,
          props.userInfo.fkboardid
        );
        toast.success(
          `List ID: ${customResponse.data?.kanbanListId} Created Successfully`,
          {
            position: toast.POSITION.TOP_CENTER,
          }
        );
      }

      if (customResponse?.status != 200 || customResponse?.data == null) {
        toast.error(
          `something went wrong could not add the list, please try again later` +
            customResponse,
          {
            position: toast.POSITION.TOP_CENTER,
          }
        );
      }
      console.log(
        "🚀 ~ file: AddForm.tsx:49 ~ handleSubmit ~ customResponse:",
        customResponse
      );
      setName("");
    } else return;
  };

  return (
    <>
      <div>
        {isCreating ? (
          // Show skeleton while creating
          <div className="min-w-[256px] animate-pulse rounded-lg border border-slate-300 bg-slate-100 p-4">
            <div className="mb-3 h-6 w-32 rounded bg-slate-300"></div>
            <div className="space-y-2">
              <div className="h-20 w-full rounded-lg bg-slate-200"></div>
              <div className="h-20 w-full rounded-lg bg-slate-200"></div>
            </div>
          </div>
        ) : showForm ? (
          <form
            ref={formRef}
            autoComplete="off"
            onSubmit={handleSubmit}
            onBlur={() => {
              if (name) return;
              setShowForm(false);
            }}
          >
            <div className="w-64 appearance-none rounded-lg border border-slate-300 bg-slate-200 p-3   dark:border-slate-700 dark:bg-slate-900">
              <input
                className="w-full rounded-lg dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                placeholder={props.placeholder}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={15}
                minLength={5}
              />
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-sm text-white transition-colors duration-150 ease-in-out hover:bg-emerald-500"
                >
                  <CheckIcon className="h-5 w-5" />
                  Add
                </button>
                <button
                  onClick={() => {
                    setName("");
                    setShowForm(false);
                  }}
                  className="rounded-md p-2 text-red-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="flex min-w-[256px] items-center justify-center gap-1 rounded-lg border border-slate-300 bg-slate-200 px-3 py-2 text-sm font-semibold transition-colors duration-200 focus:border-none focus:border-indigo-600 focus:outline-none focus:ring focus:ring-indigo-600 hover:border-indigo-600 hover:bg-indigo-100/50 dark:border-slate-500 dark:bg-slate-600 dark:text-white dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20"
          >
            <PlusIcon className="h-4 w-5" />
            {props.text}
          </button>
        )}
      </div>
    </>
  );
}

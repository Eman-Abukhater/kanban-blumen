import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useState } from "react";
import KanbanContext from "../../context/kanbanContext";
import { toast } from "react-toastify";

export interface ClearListModalProps {
  title: string;
  listIndex: number;
  listId: number;
}

export function ClearListModal(props: ClearListModalProps) {
  const { handleCloseModal, handleClearList } = useContext(KanbanContext);
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);

      // ✅ clear UI (and your function can later call backend if needed)
      handleClearList(props.listId, null);

      toast.success("Column cleared successfully", {
        position: toast.POSITION.TOP_CENTER,
      });

      handleCloseModal();
    } catch (e: any) {
      toast.error(e?.message || "Failed to clear column", {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={handleCloseModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-[420px] rounded-[18px] bg-white px-6 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.15)] dark:bg-[#1C252E]">
                <Dialog.Title className="text-[19px] font-semibold text-[#111827] dark:text-white">
                  Clear column
                </Dialog.Title>

                <p className="mt-3 text-[13px] text-[#374151] dark:text-white">
                  Are you sure you want to clear all tasks in this column?
                </p>

                <p className="mt-4 text-[12px] text-[#FF5630]">
                  <span className="font-bold">NOTE:</span> This will remove all tasks inside this column.
                </p>

                <div className="mt-8 flex justify-end gap-4">
                  <button
                    onClick={onConfirm}
                    disabled={submitting}
                    type="button"
                    className="rounded-[10px] bg-[#FF5630] px-3 py-2 text-[12px] font-bold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? "Clearing..." : "Clear"}
                  </button>

                  <button
                    onClick={handleCloseModal}
                    type="button"
                    className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-bold text-[#111827] hover:bg-[#F9FAFB] dark:bg-[#1C252E] dark:text-white dark:border-[#919EAB52]"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useState } from "react";
import KanbanContext from "../../context/kanbanContext";
import { toast } from "react-toastify";
import { useInvalidateKanban } from "@/hooks/useKanbanMutations";
import { deleteList } from "@/services/kanbanApi";

export interface DeleteListModalProps {
  title: string;
  listIndex: number;
  listId: number; // ✅ IMPORTANT: backend id (list_id)
}

export function DeleteListModal(props: DeleteListModalProps) {
  const { handleDeleteList, handleCloseModal, modalState } =
    useContext(KanbanContext);

  const invalidateKanban = useInvalidateKanban();
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      const res = await deleteList(props.listId);

      if (res?.status === 200) {
        // ✅ update UI immediately (optimistic)
        handleDeleteList(props.listIndex);

        // ✅ refresh react-query cache (don’t await)
        void invalidateKanban();

        toast.success("Column deleted successfully", {
          position: toast.POSITION.TOP_CENTER,
        });

        handleCloseModal();
        return;
      }

      toast.error("Could not delete the column. Please try again.", {
        position: toast.POSITION.TOP_CENTER,
      });
    } catch (e: any) {
      toast.error(e?.message || "Delete failed.", {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition appear show={modalState.isOpen} as={Fragment}>
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
              <Dialog.Panel className="w-full max-w-[420px] rounded-[18px] bg-white px-6 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.15)]">
                <Dialog.Title className="text-[19px] font-semibold text-[#111827]">
                  Delete
                </Dialog.Title>

                <p className="mt-3 text-[13px] text-[#374151]">
                  Are you sure you want to delete this column?
                </p>

                <p className="mt-4 text-[12px] text-[#FF5630]">
                  <span className="font-bold">NOTE:</span> All tasks in this column will also be deleted.
                </p>

                <div className="mt-8 flex justify-end gap-4">
                  <button
                    onClick={handleDelete}
                    disabled={submitting}
                    type="button"
                    className="rounded-[10px] bg-[#FF5630] px-3 py-2 text-[12px] font-bold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? "Deleting..." : "Delete"}
                  </button>

                  <button
                    onClick={handleCloseModal}
                    type="button"
                    className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-bold text-[#111827] hover:bg-[#F9FAFB]"
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

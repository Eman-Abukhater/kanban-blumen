// src/components/modal/RenameListModal.tsx
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useEffect, useState } from "react";
import KanbanContext from "../../context/kanbanContext";
import { EditListName } from "@/services/kanbanApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export interface RenameListModalProps {
  listIndex: number;
  title: string;
  listid: number;
  userInfo: any;
}

export default function RenameListModal(props: RenameListModalProps) {
  const { modalState, handleCloseModal, handleRenameList } =
    useContext(KanbanContext);

  const [title, setTitle] = useState<string>(props.title ?? "");
  const [submitting, setSubmitting] = useState(false);

  // ✅ keep input synced when modal opens or title changes
  useEffect(() => {
    if (modalState.isOpen) setTitle(props.title ?? "");
  }, [modalState.isOpen, props.title]);

  const handleRename = async () => {
    const newTitle = title.trim();
    if (!newTitle || submitting) return;

    try {
      setSubmitting(true);

      const customResponse = await EditListName(
        newTitle,
        props.listid,
        props.userInfo.username,
        props.userInfo.fkboardid,
        props.userInfo.fkpoid
      );

      if (customResponse?.status === 200) {
        toast.success(`${customResponse?.data}`, {
          position: toast.POSITION.TOP_CENTER,
        });

        // ✅ update local state
        handleRenameList(props.listIndex, newTitle);
        handleCloseModal();
        return;
      }

      toast.error(
        `Something went wrong. Could not edit the title, please try again later.`,
        { position: toast.POSITION.TOP_CENTER }
      );
    } catch (e: any) {
      toast.error(e?.message || "Rename failed.", {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition appear show={modalState.isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleCloseModal}>
        {/* overlay */}
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

        {/* content */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 scale-[0.98]"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-2 scale-[0.98]"
            >
              <Dialog.Panel className="w-full max-w-xl rounded-[24px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] dark:bg-[#1C252E] dark:shadow-none">
                {/* Header */}
                <div className="px-8 py-6">
                  <Dialog.Title className="text-[20px] font-semibold leading-[28px] text-ink dark:text-white">
                    Edit List Name
                  </Dialog.Title>
                </div>

                {/* Body */}
                <div className="space-y-4 px-8 pb-2">
                  <div className="relative">
                    <label className="pointer-events-none absolute -top-2 left-3 inline-flex bg-white px-1 text-[13px] font-medium text-[#637381] dark:bg-[#1C252E] dark:text-slate500_80">
                      List Title
                      <span className="ml-0.5 text-[#FF5630]">*</span>
                    </label>

                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="--"
                      className="h-[56px] w-full rounded-[12px] border border-slate500_12 bg-white px-3 pt-3 text-[14px] text-ink outline-none transition focus:border-[#1D7BF5] focus:ring-2 focus:ring-[#1D7BF5]/20 dark:border-slate500_20 dark:bg-[#1C252E] dark:text-slate500_80"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-8 py-5">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="h-10 rounded-[10px] border border-slate500_20 px-4 text-[14px] font-semibold text-[#1C252E] hover:bg-slate500_08 dark:border-[#919EAB52] dark:text-white dark:hover:bg-[#232C36]"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleRename}
                    disabled={submitting || !title.trim()}
                    className="h-10 rounded-[10px] bg-[#1C252E] px-5 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-[#1C252E]"
                  >
                    {submitting ? "Saving..." : "Save"}
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

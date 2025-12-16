// src/components/kanban/DueDateModal.tsx
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Datepicker from "react-tailwindcss-datepicker";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";

export interface DueDateModalProps {
  open: boolean;
  value: DateValueType | null;
  onChange: (newValue: DateValueType) => void;
  onClose: () => void;
  onApply: () => void;
}

export function DueDateModal({
  open,
  value,
  onChange,
  onClose,
  onApply,
}: DueDateModalProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[70]" // أعلى من card modal
        onClose={onClose}
      >
        {/* الخلفية */}
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

        {/* محتوى المودال */}
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95 translate-y-2"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-2"
          >
            <Dialog.Panel className="w-full max-w-[880px] rounded-[24px] bg-white shadow-xl dark:bg-[#1B232D]">
              {/* العنوان */}
              <div className="border-b border-slate500_12 px-8 py-6 text-[18px] font-semibold text-ink dark:border-slate500_20 dark:text-white">
                Choose due date
              </div>

              {/* الـ Datepicker */}
              <div className="px-8 py-6">
                <Datepicker
                  value={value}
                  onChange={onChange}
                  useRange
                  displayFormat="DD MMM YYYY"
                  showShortcuts={false}
                  showFooter={false}
                  primaryColor="emerald"
                  inputClassName="w-full rounded-[14px] border border-slate500_20 bg-white px-4 py-3 text-[14px] text-ink outline-none focus:ring-2 focus:ring-[#00A76F] dark:border-slate500_20 dark:bg-[#141A21] dark:text-white"
                  containerClassName="w-full"
                />
                {/* مهم: لازم تضغطي على حقل التاريخ عشان يظهر الكالندر */}
              </div>

              {/* الأزرار */}
              <div className="flex justify-end gap-3 border-t border-slate500_12 px-8 py-4 dark:border-slate500_20">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-[12px] border border-slate500_20 bg-white px-5 py-2 text-[14px] font-semibold text-ink hover:bg-slate500_08 dark:bg-transparent dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onApply}
                  className="inline-flex items-center justify-center rounded-[12px] bg-[#1C252E] px-6 py-2 text-[14px] font-semibold text-white hover:opacity-90"
                >
                  Apply
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

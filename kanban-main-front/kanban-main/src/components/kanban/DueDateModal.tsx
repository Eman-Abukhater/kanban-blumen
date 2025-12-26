import { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Datepicker from "react-tailwindcss-datepicker";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";
import dayjs from "dayjs";

type SafeDateValue = {
  startDate: Date | string | null;
  endDate: Date | string | null;
};

export interface DueDateModalProps {
  open: boolean;
  value: DateValueType | null;
  onChange: (newValue: DateValueType | null) => void; // only on Apply
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
  // local temp state (Cancel shouldn't change anything)
  const [temp, setTemp] = useState<SafeDateValue>({
    startDate: null,
    endDate: null,
  });

  // reset temp when opening
  useEffect(() => {
    if (open) {
      setTemp({
        startDate: (value as any)?.startDate ?? null,
        endDate: (value as any)?.endDate ?? null,
      });
    }
  }, [open, value]);

  // Datepicker (asSingle) expects DateValueType-like object
  const startValue = useMemo<SafeDateValue>(
    () => ({ startDate: temp.startDate, endDate: temp.startDate }),
    [temp.startDate]
  );

  const endValue = useMemo<SafeDateValue>(
    () => ({ startDate: temp.endDate, endDate: temp.endDate }),
    [temp.endDate]
  );

  // Datepicker onChange may return null
  const setStart = (nv: DateValueType | null) => {
    const newStart = (nv as any)?.startDate ?? null;

    setTemp((prev) => {
      const end = prev.endDate;

      // if end before start, shift end to start
      if (newStart && end && dayjs(end).isBefore(dayjs(newStart), "day")) {
        return { startDate: newStart, endDate: newStart };
      }
      return { ...prev, startDate: newStart };
    });
  };

  const setEnd = (nv: DateValueType | null) => {
    const newEnd = (nv as any)?.startDate ?? null;

    setTemp((prev) => {
      const start = prev.startDate;

      // if end before start, clamp end to start
      if (start && newEnd && dayjs(newEnd).isBefore(dayjs(start), "day")) {
        return { ...prev, endDate: start };
      }
      return { ...prev, endDate: newEnd };
    });
  };

  const handleApply = () => {
    onChange({
      startDate: temp.startDate,
      endDate: temp.endDate,
    } as any);

    onApply();
  };

  // same floating label style as AddEditProjectModal
  const labelCls =
    "pointer-events-none absolute -top-2 left-3 inline-flex bg-white px-1 text-[13px] font-medium text-[#637381] z-20 " +
    "dark:bg-[#1B232D] dark:text-slate500_80";

  const inputCls =
    "h-[56px] w-full rounded-[12px] border border-slate500_12 bg-white px-3 pt-3 text-[14px] text-ink outline-none transition " +
    "focus:border-[#1D7BF5] focus:ring-2 focus:ring-[#1D7BF5]/20 " +
    "dark:border-slate500_20 dark:bg-[#1B232D] dark:text-slate500_80";

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={onClose}>
        {/* Overlay */}
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

        {/* Modal */}
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
            <Dialog.Panel className="w-full max-w-[420px] overflow-hidden rounded-[24px] bg-white shadow-xl dark:bg-[#1B232D]">
              {/* Title */}
              <div className="px-8 py-6 text-[20px] font-semibold text-ink dark:text-white">
                Choose due date
              </div>

              {/* Body */}
              <div className="space-y-4 px-8 pb-2">
                {/* Start date */}
                <div className="relative">
                  <label className={labelCls}>
                    Start date 
                  </label>

                  <Datepicker
                    value={startValue as any}
                    onChange={setStart as any}
                    asSingle
                    useRange={false}
                    displayFormat="MM/DD/YYYY"
                    showShortcuts={false}
                    showFooter={false}
                    inputClassName={inputCls}
                    containerClassName="w-full"
                  />
                </div>

                {/* End date */}
                <div className="relative">
                  <label className={labelCls}>
                    End date 
                  </label>

                  <Datepicker
                    value={endValue as any}
                    onChange={setEnd as any}
                    asSingle
                    useRange={false}
                    displayFormat="MM/DD/YYYY"
                    showShortcuts={false}
                    showFooter={false}
                    inputClassName={inputCls}
                    containerClassName="w-full"
                  />
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 px-8 py-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 rounded-[10px] border border-slate500_20 px-4 text-[14px] font-semibold text-[#1C252E] hover:bg-slate500_08 dark:border-[#919EAB52] dark:text-white dark:hover:bg-[#232C36]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="py-2 rounded-[10px] bg-[#1C252E] px-4 text-[14px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-[#1C252E]"
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

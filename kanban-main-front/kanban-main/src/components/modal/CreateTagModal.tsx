import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useMemo, useState } from "react";

export interface ITagsProps {
  show: boolean;
  handleClose: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmit: (tagName: string, colorIndex: number) => void;
}

export function CreateTagModal(props: ITagsProps) {
  const [name, setName] = useState<string>("");

  // ✅ inline validation
  const [touched, setTouched] = useState(false);

  const trimmed = useMemo(() => name.trim(), [name]);
  const showError = touched && trimmed.length === 0;

  // ✅ Always BLUE (based on your old tagColors list: Blue was index 1)
  const BLUE_COLOR_INDEX = 1;

  const closeAndReset = () => {
    props.handleClose(false);
    setName("");
    setTouched(false);
  };

  const handleCreate = () => {
    setTouched(true);
    if (!trimmed) return;

    props.handleSubmit(trimmed, BLUE_COLOR_INDEX);
    closeAndReset();
  };

  return (
    <Transition appear show={props.show} as={Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={props.handleClose}>
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

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="
                  w-full max-w-[420px]
                  transform overflow-hidden
                  rounded-[24px]
                  border border-[#E5EAF1]
                  bg-white
                  p-6
                  text-left align-middle
                  shadow-soft
                  transition-all
                  dark:border-slate500_20
                  dark:bg-[#1C252E]
                "
              >
                <Dialog.Title
                  as="h3"
                  className="text-[18px] font-semibold text-ink dark:text-white"
                >
                  Create Tag
                </Dialog.Title>

                {/* Input */}
                <div className="mt-4">
               
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="Tag name..."
                    className={`
                      w-full
                      rounded-[12px]
                      border
                      px-3 py-2
                      text-[14px] font-semibold
                      outline-none
                      focus:outline-none focus:ring-0
                      focus-visible:outline-none focus-visible:ring-0
                      bg-white/70 text-ink placeholder:text-slate500
                      dark:bg-white/5 dark:text-white dark:placeholder:text-slate500_80
                      ${
                        showError
                          ? "border-red-500 focus:border-red-500 dark:border-red-500"
                          : "border-slate500_20 focus:border-ink dark:border-slate500_20 dark:focus:border-white"
                      }
                    `}
                  />

                  {/* ✅ redline warning */}
                  {showError && (
                    <p className="mt-2 text-[12px] font-medium text-red-500">
                      Please enter a tag name.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeAndReset}
                    className="
                      inline-flex items-center justify-center
                      rounded-[10px]
                      border border-slate500_20
                      bg-transparent
                      px-4 py-2
                      text-[13px] font-semibold
                      text-ink
                      hover:bg-slate500_12
                      dark:text-white
                      dark:hover:bg-white/5
                      outline-none focus:outline-none focus:ring-0
                    "
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleCreate}
                    className="
                      inline-flex items-center justify-center
                      rounded-[10px]
                      bg-ink
                      px-4 py-2
                      text-[13px] font-semibold
                      text-white
                      hover:opacity-90
                      dark:bg-white dark:text-ink
                      outline-none focus:outline-none focus:ring-0
                    "
                  >
                    Create
                  </button>
                </div>

                {/* Optional: tiny hint (remove if you don’t want it) */}
                {/* <p className="mt-3 text-[12px] text-slate500 dark:text-slate500_80">
                  Color: Blue (default)
                </p> */}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

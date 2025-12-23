import { Menu, Transition } from "@headlessui/react";
import { Fragment, useContext } from "react";
import KanbanContext from "../../context/kanbanContext";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { MoreHorizontal, Eraser } from "lucide-react";

export interface IListMenuProps {
  title: string;
  listIndex: number;
  listid: number;
  userInfo: any;
}

export function ListMenu(props: IListMenuProps) {
  const { handleOpenModal } = useContext(KanbanContext);

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        aria-label="Show menu"
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate500_12 dark:hover:bg-slate500_20"
        title="Menu"
      >
        {/* horizontal dots like figma */}
        <MoreHorizontal className="h-5 w-5 text-[#637381] dark:text-slate500_80" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className="
            absolute right-0 mt-2 w-[170px] origin-top-right overflow-hidden
            rounded-[16px] border border-slate500_12 bg-white shadow-[0_18px_45px_rgba(145,158,171,0.24)]
            focus:outline-none
            dark:border-slate500_20 dark:bg-[#1B232D]
          "
        >
          <div className="p-2">
            {/* Rename */}
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`
                    flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-[14px]
                    ${active ? "bg-slate500_08 dark:bg-white/5" : ""}
                    text-ink dark:text-white
                  `}
                  onClick={() =>
                    handleOpenModal({
                      type: "RENAME_LIST",
                      modalProps: {
                        listIndex: props.listIndex,
                        title: props.title,
                        listid: props.listid,
                        userInfo: props.userInfo,
                      },
                    })
                  }
                >
                  <PencilIcon className="h-5 w-5" />
                  <span>Rename</span>
                </button>
              )}
            </Menu.Item>

            {/* Clear (if you have modal/action for it) */}
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`
                    flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-[14px]
                    ${active ? "bg-slate500_08 dark:bg-white/5" : ""}
                    text-ink dark:text-white
                  `}
                  onClick={() =>
                    handleOpenModal({
                      type: "CLEAR_LIST", // adjust to your real modal type
                      modalProps: {
                        listIndex: props.listIndex,
                        listid: props.listid,
                        title: props.title,
                        userInfo: props.userInfo,
                      },
                    })
                  }
                >
                  <Eraser className="h-5 w-5" />
                  <span>Clear</span>
                </button>
              )}
            </Menu.Item>

            {/* Delete */}
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`
                    flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-[14px]
                    ${active ? "bg-red-50 dark:bg-red-500/10" : ""}
                    text-[#FF5630]
                  `}
                  onClick={() =>
                   handleOpenModal({
          type: "DELETE_LIST",
          modalProps: {
            listIndex: props.listIndex,
            title: props.title,
          },
        })
                  }
                >
                  <TrashIcon className="h-5 w-5" />
                  <span>Delete</span>
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

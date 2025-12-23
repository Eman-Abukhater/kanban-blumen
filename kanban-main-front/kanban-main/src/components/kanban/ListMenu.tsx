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
        <Menu.Item>
  {({ active }) => (
    <button
      className={`${
        active ? "bg-red-500 text-white" : "text-gray-900 dark:text-white"
      } group flex w-full items-center rounded-md px-2 py-2 text-xs font-semibold`}
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
      <TrashIcon className="mr-2 h-4 w-4" />
      Delete list
    </button>
  )}
</Menu.Item>

      </Transition>
    </Menu>
  );
}

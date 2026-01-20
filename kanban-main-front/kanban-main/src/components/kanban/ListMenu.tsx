import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import KanbanContext from "../../context/kanbanContext";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { MoreHorizontal, Eraser } from "lucide-react";

export interface IListMenuProps {
  title: string;
  listIndex: number;
  listId: number;
  userInfo: any;
  onRename: () => void;
}

type Pos = { top: number; left: number; placement: "top" | "bottom" };

export function ListMenu(props: IListMenuProps) {
  const { handleOpenModal, handleClearList } = useContext(KanbanContext);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos>({ top: 0, left: 0, placement: "bottom" });

  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const MENU_W = 170;
  const MENU_H = 150; // approx height for 3 items
  const GAP = 8;

  const updatePosition = () => {
    const btn = btnRef.current;
    if (!btn) return;

    const r = btn.getBoundingClientRect();

    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < MENU_H + GAP;

    const top = openUp ? r.top - MENU_H - GAP : r.bottom + GAP;

    // align right edge of menu with button right edge
    let left = r.right - MENU_W;

    // keep inside viewport
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8));

    setPos({ top, left, placement: openUp ? "top" : "bottom" });
  };

  // position when opening
  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    // also update after paint (safer with fonts/layout)
    const t = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // close on outside click + ESC
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onScrollOrResize = () => updatePosition();

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label="Show menu"
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate500_12 dark:hover:bg-slate500_20"
        title="Menu"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-5 w-5 text-[#637381] dark:text-slate500_80" />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{ top: pos.top, left: pos.left, width: MENU_W }}
          className="
            fixed z-[999999]
            rounded-[16px] border border-slate500_12 bg-white
            shadow-[0_18px_45px_rgba(145,158,171,0.24)]
            dark:border-slate500_20 dark:bg-[#1B232D]
            overflow-hidden
          "
        >
          <div className="p-2">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-[14px] text-ink hover:bg-slate500_08 dark:text-white dark:hover:bg-white/5"
              onClick={() => {
                setOpen(false);
                props.onRename();
              }}
            >
              <PencilIcon className="h-5 w-5" />
              <span>Rename</span>
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-[14px] text-ink hover:bg-slate500_08 dark:text-white dark:hover:bg-white/5"
              onClick={() => {
                setOpen(false);
                handleClearList(props.listId, props.userInfo);
              }}
            >
              <Eraser className="h-5 w-5" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-[14px] text-[#FF5630] hover:bg-red-50 dark:hover:bg-red-500/10"
              onClick={() => {
                setOpen(false);
                handleOpenModal({
                  type: "DELETE_LIST",
                  modalProps: {
                    listIndex: props.listIndex,
                    title: props.title,
                    listId: props.listId,
                  },
                });
              }}
            >
              <TrashIcon className="h-5 w-5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// src/components/kanban/DueDateModal.tsx
import { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import dayjs, { Dayjs } from "dayjs";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";

type Props = {
  open: boolean;
  value: DateValueType | null;
  onClose: () => void;
  onApply: (value: DateValueType | null) => void;
};

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

const toDay = (d: any): Dayjs | null => {
  if (!d) return null;
  const x = dayjs(d);
  return x.isValid() ? x.startOf("day") : null;
};

const sameDay = (a: Dayjs | null, b: Dayjs | null) =>
  !!a && !!b && a.isSame(b, "day");

const isBetweenInclusive = (d: Dayjs, start: Dayjs, end: Dayjs) =>
  (d.isAfter(start, "day") && d.isBefore(end, "day")) ||
  sameDay(d, start) ||
  sameDay(d, end);

function buildMonthGrid(month: Dayjs) {
  const start = month.startOf("month");
  const daysInMonth = month.daysInMonth();
  const firstDow = start.day();

  const cells: Array<Dayjs | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(month.date(d));

  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);

  const weeks: Array<Array<Dayjs | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function DueDateModal({ open, value, onClose, onApply }: Props) {
  const [leftMonth, setLeftMonth] = useState(() => dayjs().startOf("month"));

  const [start, setStart] = useState<Dayjs | null>(null);
  const [end, setEnd] = useState<Dayjs | null>(null);

  // today ring
  const today = useMemo(() => dayjs().startOf("day"), []);

  useEffect(() => {
    if (!open) return;

    const s = toDay(value?.startDate);
    const e = toDay(value?.endDate);

    setStart(s);
    setEnd(e);

    if (s) setLeftMonth(s.startOf("month"));
  }, [open, value?.startDate, value?.endDate]);

  const rightMonth = useMemo(() => leftMonth.add(1, "month"), [leftMonth]);

  const leftWeeks = useMemo(() => buildMonthGrid(leftMonth), [leftMonth]);
  const rightWeeks = useMemo(() => buildMonthGrid(rightMonth), [rightMonth]);

  // ✅ Re-pick logic (always can change later)
  const handlePick = (d: Dayjs) => {
    if (!start) {
      setStart(d);
      setEnd(null);
      return;
    }

    if (start && end) {
      setStart(d);
      setEnd(null);
      return;
    }

    if (d.isBefore(start, "day")) {
      setEnd(start);
      setStart(d);
      return;
    }

    setEnd(d);
  };

  const apply = () => {
    onApply({
      startDate: start ? start.toDate() : null,
      endDate: end ? end.toDate() : null,
    } as DateValueType);
  };

  const renderCalendar = (
    month: Dayjs,
    weeks: Array<Array<Dayjs | null>>,
    side: "left" | "right"
  ) => {
    const showPrev = side === "left";
    const showNext = side === "right";

    return (
      <div
        className="
          w-full rounded-[20px] p-6
          border border-dashed
          border-slate500_20 bg-white
          dark:border-white/10 dark:bg-[#1C252E]
        "
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-[18px] font-semibold text-[#1C252E] dark:text-white">
            {month.format("MMMM YYYY")}
            <svg
              className="h-4 w-4 opacity-70"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            {showPrev ? (
              <button
                type="button"
                onClick={() => setLeftMonth((m) => m.subtract(1, "month"))}
                className="
                  h-9 w-9 rounded-full
                  text-[#637381] hover:bg-slate500_08
                  dark:text-white/70 dark:hover:bg-white/10
                "
                aria-label="Previous month"
              >
                ‹
              </button>
            ) : (
              <div className="h-9 w-9" />
            )}

            {showNext ? (
              <button
                type="button"
                onClick={() => setLeftMonth((m) => m.add(1, "month"))}
                className="
                  h-9 w-9 rounded-full
                  text-[#637381] hover:bg-slate500_08
                  dark:text-white/70 dark:hover:bg-white/10
                "
                aria-label="Next month"
              >
                ›
              </button>
            ) : (
              <div className="h-9 w-9" />
            )}
          </div>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 text-center text-[12px] font-medium text-[#637381] dark:text-white/50">
          {WEEK.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {weeks.flat().map((cell, idx) => {
            if (!cell) return <div key={idx} className="h-10" />;

            const d = cell.startOf("day");

            const isStart = sameDay(d, start);
            const isEnd = sameDay(d, end);
            const hasRange = !!start && !!end;
            const inRange =
              hasRange && start && end ? isBetweenInclusive(d, start, end) : false;

            const isToday = sameDay(d, today);
            const showTodayRing = isToday && !(isStart || isEnd);

            const base =
              "mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold transition outline-none";

            // ✅ colors that always show (fixes your “empty” dark mode issue)
            let styles =
              "text-slate700 hover:bg-slate500_08 " +
              "dark:text-white dark:hover:bg-white/10";

            if (inRange)
              styles =
                "bg-emerald-500/10 text-slate700 " +
                "dark:bg-emerald-500/15 dark:text-white";

            if (isStart || isEnd) styles = "bg-emerald-500 text-white";

            if (showTodayRing)
              styles =
                "ring-1 ring-slate500 text-slate700 " +
                "dark:ring-white dark:text-white";

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePick(d)}
                className={`${base} ${styles}`}
              >
                {d.date()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-[0.98]"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-[0.98]"
          >
            <Dialog.Panel
              className="
                w-full max-w-[920px] rounded-[24px] p-6
                bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)]
                dark:bg-[#1C252E] dark:shadow-[0_30px_80px_rgba(0,0,0,0.55)]
              "
            >
              <Dialog.Title className="text-[20px] font-bold text-[#1C252E] dark:text-white">
                Choose due date
              </Dialog.Title>

              <div className="mt-6 flex flex-col gap-4 md:flex-row">
                {renderCalendar(leftMonth, leftWeeks, "left")}
                {renderCalendar(rightMonth, rightWeeks, "right")}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="
                    rounded-[12px] px-5 py-2 text-[14px] font-semibold
                    border border-slate500_20 text-[#1C252E] hover:bg-slate500_08
                    dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={apply}
                  className="
                    rounded-[12px] px-5 py-2 text-[14px] font-semibold
                    bg-[#1C252E] text-white hover:opacity-90
                    dark:bg-white dark:text-[#1C252E]
                  "
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

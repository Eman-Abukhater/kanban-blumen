// src/components/kanban/DueDateModal.tsx
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [leftMonth, setLeftMonth] = useState(() => dayjs().startOf("month"));

  const [start, setStart] = useState<Dayjs | null>(null);
  const [end, setEnd] = useState<Dayjs | null>(null);

  // today ring
  const today = useMemo(() => dayjs().startOf("day"), []);

  // ===== MOBILE: switch view inside same Dialog (NO nested Dialog) =====
  const [mobileStep, setMobileStep] = useState<"form" | "picker">("form");
  const [activeField, setActiveField] = useState<"start" | "end">("start");

  const [pickMonth, setPickMonth] = useState(() => dayjs().startOf("month"));
  const pickWeeks = useMemo(() => buildMonthGrid(pickMonth), [pickMonth]);

  // temp selected inside picker (only commits on OK)
  const [tempPick, setTempPick] = useState<Dayjs | null>(null);

  const closeAll = () => {
    setMobileStep("form");
    onClose();
  };

  // ✅ hard “outside click” close (works 100% even if Dialog outside detection fails)
  useEffect(() => {
    if (!open) return;

    const handler = (e: MouseEvent | TouchEvent) => {
      const el = panelRef.current;
      if (!el) return;

      const target = e.target as Node | null;
      if (target && !el.contains(target)) {
        closeAll();
      }
    };

    // capture = true so it runs before anything stops propagation
    document.addEventListener("mousedown", handler, true);
    document.addEventListener("touchstart", handler, true);

    return () => {
      document.removeEventListener("mousedown", handler, true);
      document.removeEventListener("touchstart", handler, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setMobileStep("form"); // reset mobile view when opening

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

  const openMobilePicker = (field: "start" | "end") => {
    setActiveField(field);

    const current = field === "start" ? start : end;
    const base = current || (field === "end" ? start : null) || today;

    setPickMonth(base.startOf("month"));
    setTempPick(current || null);
    setMobileStep("picker");
  };

  const cancelMobilePicker = () => {
    setMobileStep("form");
  };

  const commitMobilePick = () => {
    const chosen = tempPick;
    if (!chosen) {
      setMobileStep("form");
      return;
    }

    if (activeField === "start") {
      const newStart = chosen;
      if (end && end.isBefore(newStart, "day")) {
        setStart(newStart);
        setEnd(newStart);
      } else {
        setStart(newStart);
      }
    } else {
      const newEnd = chosen;

      if (!start) {
        setStart(newEnd);
        setEnd(null);
      } else if (newEnd.isBefore(start, "day")) {
        setEnd(start);
        setStart(newEnd);
      } else {
        setEnd(newEnd);
      }
    }

    setMobileStep("form");
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
            <svg className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
            const inRange = hasRange && start && end ? isBetweenInclusive(d, start, end) : false;

            const isToday = sameDay(d, today);
            const showTodayRing = isToday && !(isStart || isEnd);

            const base =
              "mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold transition outline-none";

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
      {/* onClose should still work on ESC */}
      <Dialog as="div" className="relative z-[9999]" onClose={closeAll}>
        {/* Overlay (also closes on click) */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" onClick={closeAll} />
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
              ref={panelRef}
              className="
                w-full max-w-[920px] rounded-[24px] p-6
                bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)]
                dark:bg-[#1C252E] dark:shadow-[0_30px_80px_rgba(0,0,0,0.55)]
              "
            >
              <Dialog.Title className="text-[20px] font-bold text-[#1C252E] dark:text-white">
                Choose due date
              </Dialog.Title>

              {/* ===== DESKTOP (two months) ===== */}
              <div className="mt-6 hidden flex-col gap-4 md:flex md:flex-row">
                {renderCalendar(leftMonth, leftWeeks, "left")}
                {renderCalendar(rightMonth, rightWeeks, "right")}
              </div>

              {/* ===== MOBILE (form -> picker) ===== */}
              <div className="mt-6 md:hidden">
                {mobileStep === "form" ? (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 text-[14px] font-semibold text-[#637381] dark:text-white/70">
                        Start date
                      </div>

                      <button
                        type="button"
                        onClick={() => openMobilePicker("start")}
                        className="
                          flex w-full items-center justify-between
                          rounded-[14px] border border-slate500_20 bg-white px-4 py-4
                          text-[16px] font-semibold text-[#1C252E]
                          dark:border-white/10 dark:bg-[#1C252E] dark:text-white
                        "
                      >
                        <span>{start ? start.format("MM/DD/YYYY") : "—"}</span>
                        <span className="opacity-70">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v13A2.5 2.5 0 0 1 19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-13A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm12.5 6h-15a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5Z" />
                          </svg>
                        </span>
                      </button>
                    </div>

                    <div>
                      <div className="mb-2 text-[14px] font-semibold text-[#637381] dark:text-white/70">
                        End date
                      </div>

                      <button
                        type="button"
                        onClick={() => openMobilePicker("end")}
                        className="
                          flex w-full items-center justify-between
                          rounded-[14px] border border-slate500_20 bg-white px-4 py-4
                          text-[16px] font-semibold text-[#1C252E]
                          dark:border-white/10 dark:bg-[#1C252E] dark:text-white
                        "
                      >
                        <span>{end ? end.format("MM/DD/YYYY") : "—"}</span>
                        <span className="opacity-70">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v13A2.5 2.5 0 0 1 19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-13A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm12.5 6h-15a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5Z" />
                          </svg>
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[13px] font-semibold tracking-wide text-[#637381] dark:text-white/60">
                      SELECT DATE
                    </div>

                    <div className="mt-2 text-[28px] font-bold text-[#1C252E] dark:text-white">
                      {tempPick ? tempPick.format("ddd, MMM D") : "Select date"}
                    </div>

                    <div className="mt-6 mb-2 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 text-[18px] font-semibold text-[#1C252E] dark:text-white">
                        {pickMonth.format("MMMM YYYY")}
                        <svg className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPickMonth((m) => m.subtract(1, "month"))}
                          className="h-9 w-9 rounded-full text-[#637381] hover:bg-slate500_08 dark:text-white/70 dark:hover:bg-white/10"
                        >
                          ‹
                        </button>

                        <button
                          type="button"
                          onClick={() => setPickMonth((m) => m.add(1, "month"))}
                          className="h-9 w-9 rounded-full text-[#637381] hover:bg-slate500_08 dark:text-white/70 dark:hover:bg-white/10"
                        >
                          ›
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 text-center text-[12px] font-medium text-[#637381] dark:text-white/50">
                      {WEEK.map((w) => (
                        <div key={w} className="py-2">
                          {w}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-y-1 text-center">
                      {pickWeeks.flat().map((cell, idx) => {
                        if (!cell) return <div key={idx} className="h-10" />;

                        const d = cell.startOf("day");
                        const isSelected = tempPick ? d.isSame(tempPick, "day") : false;

                        const isToday = d.isSame(today, "day");
                        const showTodayRing = isToday && !isSelected;

                        const base =
                          "mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold transition outline-none";

                        let styles =
                          "text-slate700 hover:bg-slate500_08 dark:text-white/85 dark:hover:bg-white/10";

                        if (isSelected) styles = "bg-emerald-500 text-white";

                        if (showTodayRing)
                          styles =
                            "ring-1 ring-slate500 text-slate700 dark:ring-white dark:text-white";

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTempPick(d)}
                            className={`${base} ${styles}`}
                          >
                            {d.date()}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-6">
                      <button
                        type="button"
                        onClick={cancelMobilePicker}
                        className="text-[16px] font-semibold text-[#1C252E] dark:text-white/90"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={commitMobilePick}
                        className="
                          rounded-[12px] px-6 py-3 text-[14px] font-semibold
                          bg-[#1C252E] text-white hover:opacity-90
                          dark:bg-white dark:text-[#1C252E]
                        "
                      >
                        OK
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer (desktop Apply/Cancel) */}
              <div className="mt-6 hidden items-center justify-end gap-3 md:flex">
                <button
                  type="button"
                  onClick={closeAll}
                  className="
                    rounded-[12px] px-5 py-2 text-[14px] font-semibold
                    border border-slate500_20 text-[#1C252E] hover:bg-slate500_08
                    dark:border-white/10 dark:bg-[#1C252E] dark:text-white dark:hover:bg-white/10
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

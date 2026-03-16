import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Menu } from "@headlessui/react";
import dayjs, { Dayjs } from "dayjs";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";

type Props = {
  open: boolean;
  value: DateValueType | null;
  onClose: () => void;
  onApply: (value: DateValueType | null) => void;
};

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const BRAND_YELLOW = "#FFAB00";
const RANGE_BG = "rgba(255, 171, 0, 0.40)";

const toDay = (d: any): Dayjs | null => {
  if (!d) return null;
  const x = dayjs(d);
  return x.isValid() ? x.startOf("day") : null;
};

const sameDay = (a: Dayjs | null, b: Dayjs | null) =>
  !!a && !!b && a.isSame(b, "day");

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
  const [mounted, setMounted] = useState(false);

  const [leftMonth, setLeftMonth] = useState(() => dayjs().startOf("month"));
  const [start, setStart] = useState<Dayjs | null>(null);
  const [end, setEnd] = useState<Dayjs | null>(null);

  const today = useMemo(() => dayjs().startOf("day"), []);

  const [mobileStep, setMobileStep] = useState<"form" | "picker">("form");
  const [activeField, setActiveField] = useState<"start" | "end">("start");

  const [pickMonth, setPickMonth] = useState(() => dayjs().startOf("month"));
  const pickWeeks = useMemo(() => buildMonthGrid(pickMonth), [pickMonth]);

  const [tempPick, setTempPick] = useState<Dayjs | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeAll = () => {
    setMobileStep("form");
    setTempPick(null);
    onClose();
  };

  useEffect(() => {
    if (!open) return;

    const s = toDay(value?.startDate);
    const e = toDay(value?.endDate);

    setMobileStep("form");
    setTempPick(null);
    setStart(s);
    setEnd(e);

    if (s) {
      setLeftMonth(s.startOf("month"));
      setPickMonth(s.startOf("month"));
    } else {
      const now = dayjs().startOf("month");
      setLeftMonth(now);
      setPickMonth(now);
    }
  }, [open, value?.startDate, value?.endDate]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const rightMonth = useMemo(() => leftMonth.add(1, "month"), [leftMonth]);
  const leftWeeks = useMemo(() => buildMonthGrid(leftMonth), [leftMonth]);
  const rightWeeks = useMemo(() => buildMonthGrid(rightMonth), [rightMonth]);

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

  const applyAndClose = (nextStart: Dayjs | null, nextEnd: Dayjs | null) => {
    onApply({
      startDate: nextStart ? nextStart.toDate() : null,
      endDate: nextEnd ? nextEnd.toDate() : null,
    } as DateValueType);

    closeAll();
  };

const openMobilePicker = (field: "start" | "end") => {
  setActiveField(field);

  const current = field === "start" ? start : end;
  const fallback = field === "end" ? start : null;
  const base = current || fallback || today;

  setPickMonth(base.startOf("month"));
  setTempPick(current || fallback || null);
  setMobileStep("picker");
};

  const cancelMobilePicker = () => {
    setTempPick(null);
    setMobileStep("form");
  };

  const commitMobilePick = () => {
    const chosen = tempPick;

    if (!chosen) {
      setMobileStep("form");
      return;
    }

if (activeField === "start") {
  setStart(chosen);
  setEnd(null);
  setMobileStep("form");
  return;
}

    const newEnd = chosen;

    if (!start) {
      setStart(newEnd);
      setEnd(null);
      setMobileStep("form");
      return;
    }

    if (newEnd.isBefore(start, "day")) {
      const nextStart = newEnd;
      const nextEnd = start;

      setStart(nextStart);
      setEnd(nextEnd);
      applyAndClose(nextStart, nextEnd);
      return;
    }

    setEnd(newEnd);
    applyAndClose(start, newEnd);
  };

  const MONTHS = useMemo(
    () => Array.from({ length: 12 }, (_, i) => dayjs().month(i).format("MMMM")),
    []
  );

  const setMonthForSide = (side: "left" | "right", monthIndex: number) => {
    if (side === "left") {
      setLeftMonth((m) => m.month(monthIndex).startOf("month"));
    } else {
      setLeftMonth((m) =>
        m.add(1, "month").month(monthIndex).startOf("month").subtract(1, "month")
      );
    }
  };

  const setYearForSide = (side: "left" | "right", year: number) => {
    if (side === "left") {
      setLeftMonth((m) => m.year(year).startOf("month"));
    } else {
      setLeftMonth((m) =>
        m.add(1, "month").year(year).startOf("month").subtract(1, "month")
      );
    }
  };

  const renderMonthTitle = (month: Dayjs, side: "left" | "right") => {
    return (
      <Menu as="div" className="relative">
        <Menu.Button
          type="button"
          className="inline-flex items-center gap-2 text-[18px] font-semibold text-[#1C252E] dark:text-white hover:opacity-90"
        >
          {month.format("MMMM YYYY")}
        </Menu.Button>

        <Menu.Items
          className="
            absolute left-0 z-[10001] mt-2 w-56
            rounded-[16px] border border-slate500_12 bg-white p-2
            shadow-[0_18px_45px_rgba(15,23,42,0.12)]
            dark:border-white/10 dark:bg-[#1B232D]
            dark:shadow-[0_18px_45px_rgba(0,0,0,0.55)]
          "
        >
          <div className="grid grid-cols-2 gap-1">
            {MONTHS.map((mName, idx) => (
              <Menu.Item key={mName}>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => setMonthForSide(side, idx)}
                    className={[
                      "rounded-[12px] px-3 py-2 text-left text-[13px] font-semibold",
                      active ? "bg-slate500_08 dark:bg-white/10" : "",
                      idx === month.month()
                        ? "text-[#FFAB00]"
                        : "text-[#1C252E] dark:text-white",
                    ].join(" ")}
                  >
                    {mName}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-[12px] border border-slate500_12 px-3 py-2 dark:border-white/10">
            <button
              type="button"
              onClick={() => setYearForSide(side, month.year() - 1)}
              className="h-8 w-8 rounded-full text-[#637381] hover:bg-slate500_08 dark:text-white/70 dark:hover:bg-white/10"
              aria-label="Previous year"
            >
              ‹
            </button>

            <div className="text-[13px] font-bold text-[#1C252E] dark:text-white">
              {month.year()}
            </div>

            <button
              type="button"
              onClick={() => setYearForSide(side, month.year() + 1)}
              className="h-8 w-8 rounded-full text-[#637381] hover:bg-slate500_08 dark:text-white/70 dark:hover:bg-white/10"
              aria-label="Next year"
            >
              ›
            </button>
          </div>
        </Menu.Items>
      </Menu>
    );
  };

  const renderCalendar = (
    month: Dayjs,
    weeks: Array<Array<Dayjs | null>>,
    side: "left" | "right"
  ) => {
    const showPrev = side === "left";
    const showNext = side === "right";

    return (
      <div className="w-full rounded-[20px] border border-dashed border-slate500_20 bg-white p-6 dark:border-white/10 dark:bg-[#1C252E]">
        <div className="mb-4 flex items-center justify-between">
          {renderMonthTitle(month, side)}

          <div className="flex items-center gap-2">
            {showPrev ? (
              <button
                type="button"
                onClick={() => setLeftMonth((m) => m.subtract(1, "month"))}
                className="h-9 w-9 rounded-full text-[#637381] hover:bg-slate500_08 dark:text-white/70 dark:hover:bg-white/10"
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
                className="h-9 w-9 rounded-full text-[#637381] hover:bg-slate500_08 dark:text-white/70 dark:hover:bg-white/10"
                aria-label="Next month"
              >
                ›
              </button>
            ) : (
              <div className="h-9 w-9" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-[12px] font-medium text-[#637381] dark:text-white/60">
          {WEEK.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1 text-center">
          {weeks.flat().map((cell, idx) => {
            if (!cell) return <div key={idx} className="h-10" />;

            const d = cell.startOf("day");
            const isStart = sameDay(d, start);
            const isEnd = sameDay(d, end);
            const hasRange = !!start && !!end;

            const inBetween =
              hasRange && start && end
                ? d.isAfter(start, "day") && d.isBefore(end, "day")
                : false;

            const isToday = sameDay(d, today);
            const showTodayRing = isToday && !(isStart || isEnd);

            const base =
              "mx-auto flex h-9 w-9 min-[370px]:h-10 min-[370px]:w-10 items-center justify-center rounded-full text-[13px] min-[370px]:text-[14px] font-semibold transition outline-none";

            let cls =
              "text-[#1C252E] hover:bg-slate500_08 dark:text-white dark:hover:bg-white/10";

            if (showTodayRing) {
              cls =
                "ring-1 ring-slate500 text-[#1C252E] dark:ring-white dark:text-white";
            }

            let style: React.CSSProperties | undefined;

            if (inBetween && !showTodayRing) {
              style = { backgroundColor: RANGE_BG };
              cls = "text-[#1C252E] dark:text-white";
            }

            if ((isStart || isEnd) && !showTodayRing) {
              style = { backgroundColor: BRAND_YELLOW };
              cls = "text-white";
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePick(d)}
                className={`${base} ${cls}`}
                style={style}
              >
                {d.date()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const getTempSelectedStyle = (d: Dayjs, isSelected: boolean) => {
    const day = d.startOf("day");

    const base =
      "mx-auto flex h-8 w-8 min-[370px]:h-9 min-[370px]:w-9 items-center justify-center rounded-full text-[13px] min-[370px]:text-[14px] font-semibold transition outline-none";

    let cls =
      "text-[#1C252E] hover:bg-slate500_08 dark:text-white dark:hover:bg-white/10";

    const isToday = sameDay(day, today);

    let previewA: Dayjs | null = null;
    let previewB: Dayjs | null = null;

    if (activeField === "end") {
      previewA = start;
      previewB = tempPick;
    } else {
      previewA = tempPick;
      previewB = end;
    }

    const hasPreview = !!previewA && !!previewB;

    const min =
      hasPreview && previewA && previewB
        ? previewB.isBefore(previewA, "day")
          ? previewB
          : previewA
        : null;

    const max =
      hasPreview && previewA && previewB
        ? previewB.isAfter(previewA, "day")
          ? previewB
          : previewA
        : null;

    const isPreviewStart = !!min && sameDay(day, min);
    const isPreviewEnd = !!max && sameDay(day, max);
    const previewInBetween =
      !!min && !!max ? day.isAfter(min, "day") && day.isBefore(max, "day") : false;

    const showTodayRing = isToday && !(isPreviewStart || isPreviewEnd);

    if (showTodayRing) {
      cls = "ring-1 ring-slate500 text-[#1C252E] dark:ring-white dark:text-white";
    }

    let style: React.CSSProperties | undefined;

    if (hasPreview && previewInBetween && !showTodayRing) {
      style = { backgroundColor: RANGE_BG };
      cls = "text-[#1C252E] dark:text-white";
    }

    if (hasPreview && (isPreviewStart || isPreviewEnd) && !showTodayRing) {
      style = { backgroundColor: BRAND_YELLOW };
      cls = "text-white";
    }

    if (!hasPreview && isSelected) {
      style = { backgroundColor: BRAND_YELLOW };
      cls = "text-white";
    }

    return { base, cls, style };
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999]"
      style={{ touchAction: "auto" }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
<div
  className="absolute inset-0 bg-black/50"
  onClick={closeAll}
  onMouseDown={closeAll}
  onTouchStart={closeAll}
/>
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          ref={panelRef}
          className="w-full max-w-[920px] overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)] dark:bg-[#1C252E] dark:shadow-[0_30px_80px_rgba(0,0,0,0.55)] pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div className="card-modal-scroll max-h-[90vh] overflow-y-auto p-6 pr-2 md:max-h-none md:overflow-visible">
            <div className="text-[20px] font-bold text-[#1C252E] dark:text-white">
              Choose due date
            </div>

            <div className="mt-6 hidden flex-col gap-4 md:flex md:flex-row">
              {renderCalendar(leftMonth, leftWeeks, "left")}
              {renderCalendar(rightMonth, rightWeeks, "right")}
            </div>

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
                      className="flex w-full items-center justify-between rounded-[14px] border border-slate500_20 bg-white px-4 py-4 text-[16px] font-semibold text-[#1C252E] dark:border-white/10 dark:bg-[#1C252E] dark:text-white"
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
                      className="flex w-full items-center justify-between rounded-[14px] border border-slate500_20 bg-white px-4 py-4 text-[16px] font-semibold text-[#1C252E] dark:border-white/10 dark:bg-[#1C252E] dark:text-white"
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

                  <div className="mb-2 mt-2 text-[28px] font-bold text-[#1C252E] dark:text-white">
                    {tempPick ? tempPick.format("ddd, MMM D") : "Select date"}
                  </div>

                  <div className="mb-2 mt-6 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-[18px] font-semibold text-[#1C252E] dark:text-white">
                      {pickMonth.format("MMMM YYYY")}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPickMonth((m) => m.subtract(1, "month"))}
                        className="h-9 w-9 rounded-full text-[#637381] hover:bg-slate500_08 dark:text-white/70 dark:hover:bg-white/10"
                        aria-label="Prev month"
                      >
                        ‹
                      </button>

                      <button
                        type="button"
                        onClick={() => setPickMonth((m) => m.add(1, "month"))}
                        className="h-9 w-9 rounded-full text-[#637381] hover:bg-slate500_08 dark:text-white/70 dark:hover:bg-white/10"
                        aria-label="Next month"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 text-center text-[12px] font-medium text-[#637381] dark:text-white/60">
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
                      const { base, cls, style } = getTempSelectedStyle(d, isSelected);

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTempPick(d)}
                          className={`${base} ${cls}`}
                          style={style}
                        >
                          {d.date()}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={cancelMobilePicker}
                      className="rounded-[12px] border border-slate500_20 px-6 py-3 text-[14px] font-semibold text-[#1C252E] hover:bg-slate500_08 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={commitMobilePick}
                      className="rounded-[12px] bg-[#1C252E] px-6 py-3 text-[14px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-[#1C252E]"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 hidden items-center justify-end gap-3 md:flex">
              <button
                type="button"
                onClick={closeAll}
                className="rounded-[12px] border border-slate500_20 px-5 py-2 text-[14px] font-semibold text-[#1C252E] hover:bg-slate500_08 dark:border-white/10 dark:bg-[#1C252E] dark:text-white dark:hover:bg-white/10"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  applyAndClose(start, end)
                }
                className="rounded-[12px] bg-[#1C252E] px-5 py-2 text-[14px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-[#1C252E]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
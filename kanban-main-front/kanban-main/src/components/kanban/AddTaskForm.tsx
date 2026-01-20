import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import CreatableSelect from "react-select/creatable";
import type { StylesConfig } from "react-select";

import { fetchAllMembers } from "@/services/kanbanApi";

export interface IAddFormProps {
  text: string;
  placeholder: string;
  onSubmit: (name: string, handleCreateTask: any[]) => void;
  userInfo: any;
}

type MemberOption = {
  value: string;
  label: string;
  [key: string]: any;
};

export function AddTaskForm(props: IAddFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(false);

  const [fetchedOptions, setFetchedOptions] = useState<MemberOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<MemberOption[]>([]);

  // ✅ validation states
  const [nameTouched, setNameTouched] = useState(false);
  const [assigneeTouched, setAssigneeTouched] = useState(false);

  const nameError = nameTouched && !name.trim();
  const assigneeError =
    assigneeTouched && (!selectedOptions || selectedOptions.length === 0);

  const handleOnChange = (option: any) => {
    setSelectedOptions(option || []);
    if ((option || []).length > 0) setAssigneeTouched(true);
  };

  useEffect(() => {
    async function fetchData() {
      const res = await fetchAllMembers();

      if (res?.status === 200 && Array.isArray(res.data)) {
        setFetchedOptions(res.data);
        return;
      }

      toast.error(`Something went wrong, could not get the users list`, {
        position: toast.POSITION.TOP_CENTER,
      });
    }

    fetchData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowForm(false);
        setName("");
        setSelectedOptions([]);
        setNameTouched(false);
        setAssigneeTouched(false);
      }
    };

    const el = formRef.current;
    el?.addEventListener("keydown", handleKeyDown);
    return () => el?.removeEventListener("keydown", handleKeyDown);
  }, []);

  const resetAndClose = () => {
    setName("");
    setSelectedOptions([]);
    setNameTouched(false);
    setAssigneeTouched(false);
    setShowForm(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setNameTouched(true);
    setAssigneeTouched(true);

    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Task name is required", { position: toast.POSITION.TOP_CENTER });
      return;
    }
    if (!selectedOptions || selectedOptions.length === 0) {
      toast.error("Assigned To is required", { position: toast.POSITION.TOP_CENTER });
      return;
    }

    props.onSubmit(trimmed, selectedOptions);
    resetAndClose();
  };

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const ERROR = "#FF5630";

  // ✅ Base select styles (same as yours)
  const baseSelectStyles: StylesConfig<MemberOption, true> = {
    control: (base, state) => ({
      ...base,
      minHeight: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: state.isFocused ? "#1C252E" : "rgba(145, 158, 171, 0.2)",
      boxShadow: "none",
      backgroundColor: "rgba(255,255,255,0.7)",
      cursor: "text",
      ":hover": {
        borderColor: state.isFocused ? "#1C252E" : "rgba(145, 158, 171, 0.48)",
      },
    }),
    valueContainer: (base) => ({ ...base, padding: "2px 10px" }),
    input: (base) => ({ ...base, margin: 0, padding: 0, color: "#1C252E" }),
    placeholder: (base) => ({
      ...base,
      color: "#919EAB",
      fontSize: 13,
      fontWeight: 500,
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 16,
      overflow: "hidden",
      border: "1px solid rgba(145, 158, 171, 0.2)",
      boxShadow: "0 18px 45px rgba(15,23,42,0.12)",
      backgroundColor: "#FFFFFF",
      zIndex: 9999,
    }),
    // ✅ IMPORTANT: portal fixes clipping inside modal
    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
    option: (base, state) => ({
      ...base,
      fontSize: 13,
      fontWeight: 600,
      color: "#1C252E",
      backgroundColor: state.isSelected
        ? "rgba(145, 158, 171, 0.12)"
        : state.isFocused
        ? "rgba(145, 158, 171, 0.12)"
        : "transparent",
      cursor: "pointer",
    }),
    multiValue: (base) => ({
      ...base,
      borderRadius: 9999,
      backgroundColor: "rgba(145, 158, 171, 0.12)",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#1C252E",
      fontSize: 12,
      fontWeight: 700,
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#637381",
      ":hover": { backgroundColor: "rgba(145, 158, 171, 0.12)", color: "#1C252E" },
    }),
  };

  // ✅ dark overrides + error border support
  const selectStyles: StylesConfig<MemberOption, true> = {
    ...baseSelectStyles,
    control: (base, state) => {
      const hasError = assigneeError;
      const normalBorder = isDark
        ? state.isFocused
          ? "#FFFFFF"
          : "rgba(145, 158, 171, 0.2)"
        : state.isFocused
        ? "#1C252E"
        : "rgba(145, 158, 171, 0.2)";

      return {
        ...(baseSelectStyles.control as any)(base, state),
        backgroundColor: isDark ? "rgba(28, 37, 46, 0.6)" : "rgba(255,255,255,0.7)",
        borderColor: hasError ? ERROR : normalBorder,
        borderWidth: hasError ? 2 : 1,
        ":hover": {
          borderColor: hasError ? ERROR : normalBorder,
        },
      };
    },
    input: (base) => ({ ...base, color: isDark ? "#FFFFFF" : "#1C252E" }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? "rgba(145, 158, 171, 0.8)" : "#919EAB",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? "#1B232D" : "#FFFFFF",
      border: "1px solid rgba(145, 158, 171, 0.2)",
      boxShadow: isDark
        ? "0 18px 45px rgba(0,0,0,0.45)"
        : "0 18px 45px rgba(15,23,42,0.12)",
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      color: isDark ? "#FFFFFF" : "#1C252E",
      backgroundColor: state.isSelected
        ? isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(145, 158, 171, 0.12)"
        : state.isFocused
        ? isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(145, 158, 171, 0.12)"
        : "transparent",
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(145, 158, 171, 0.12)",
    }),
    multiValueLabel: (base) => ({ ...base, color: isDark ? "#FFFFFF" : "#1C252E" }),
    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
  };

  /* =========================================================
     ✅ NEW: Dynamic menu sizing (auto sizes based on available space)
     - Works with portal + fixed position
     - Recomputes on open + resize + scroll
  ========================================================= */
  const selectWrapRef = useRef<HTMLDivElement | null>(null);
  const [menuMaxHeight, setMenuMaxHeight] = useState<number>(240);

  const computeMenuMaxHeight = () => {
    const wrap = selectWrapRef.current;
    if (!wrap) return;

    const control = wrap.querySelector(".assignTo__control") as HTMLElement | null;
    if (!control) return;

    const r = control.getBoundingClientRect();
    const viewportH = window.innerHeight;

    const spaceBelow = viewportH - r.bottom;
    const spaceAbove = r.top;

    // we allow auto flip; just cap height to the best available side
    const bestSpace = Math.max(spaceBelow, spaceAbove);

    // padding so it never touches edges
    const pad = 16;

    // clamp between 120 and 320 (tweak if you want)
    const next = Math.max(120, Math.min(320, bestSpace - pad));
    setMenuMaxHeight(next);
  };

  // When menu opens, compute
  const handleMenuOpen = () => {
    computeMenuMaxHeight();
  };

  // While open, keep it responsive to viewport changes
  useEffect(() => {
    if (!showForm) return;

    const onWin = () => computeMenuMaxHeight();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);

    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm]);

  return (
    <div>
      {showForm ? (
        <form ref={formRef} autoComplete="off" onSubmit={handleSubmit}>
          <div
            className="
              w-[340px]
              rounded-[24px]
              border border-[#E5EAF1]
              bg-[#F4F6F8]
              p-4
              shadow-soft
              dark:border-slate500_20
              dark:bg-[#1B232D]
            "
          >
            <input
              className={[
                "w-full rounded-[12px] bg-white/70 px-3 py-2 text-[14px] font-semibold text-ink placeholder:text-slate500 outline-none",
                "border",
                nameError ? "border-2 border-[#FF5630]" : "border-slate500_20",
                "focus:outline-none focus:ring-0",
                "dark:bg-[#1C252E]/60 dark:text-white dark:placeholder:text-slate500_80",
                nameError ? "dark:border-2 dark:border-[#FF5630]" : "dark:border-slate500_20",
              ].join(" ")}
              placeholder={props.placeholder}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setNameTouched(true)}
              maxLength={50}
              minLength={3}
              autoFocus
            />

            {nameError && (
              <div className="mt-2 text-[12px] font-semibold text-[#FF5630]">
                Task name is required
              </div>
            )}

            <div className="mt-3" ref={selectWrapRef}>
              <CreatableSelect
                isClearable
                closeMenuOnSelect={false}
                isMulti
                placeholder="Assigned To"
                options={fetchedOptions}
                onChange={handleOnChange}
                onBlur={() => setAssigneeTouched(true)}
                styles={selectStyles}
                classNamePrefix="assignTo"
                // ✅ THIS IS THE CORE OF “dynamic” behavior:
                menuPlacement="auto"          // flips up/down automatically
                menuPosition="fixed"          // shifts correctly in viewport/modals
                maxMenuHeight={menuMaxHeight} // sizes based on available space
                onMenuOpen={handleMenuOpen}   // recalc when opening
                menuShouldBlockScroll={false}
                // ✅ fixes cropping inside modal / scroll containers
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              />
            </div>

            {assigneeError && (
              <div className="mt-2 text-[12px] font-semibold text-[#FF5630]">
                Assigned To is required
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <button
                className="
                  inline-flex items-center gap-2
                  rounded-[10px]
                  bg-ink px-3 py-2
                  text-[13px] font-semibold text-white
                  hover:opacity-90
                  dark:bg-white dark:text-ink
                "
                type="submit"
              >
                <CheckIcon className="h-5 w-5" />
                Add
              </button>

              <button
                type="button"
                onClick={resetAndClose}
                className="
                  inline-flex h-9 w-9 items-center justify-center
                  rounded-[10px]
                  border border-slate500_20
                  bg-white
                  text-ink
                  hover:bg-slate500_12
                  dark:bg-[#1C252E]
                  dark:text-white
                  dark:hover:bg-white/5
                "
                aria-label="Cancel"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="
            inline-flex items-center gap-3
            h-[30px] px-3
            rounded-[6px]
            border border-slate500_20
            bg-white
            text-[14px] font-semibold text-black
            hover:bg-slate500_08
            transition
            dark:bg-transparent dark:text-white dark:border-slate500_48 dark:hover:bg-slate500_12
          "
        >
          <PlusIcon className="h-5 w-5 font-bold" />
          {props.text}
        </button>
      )}
    </div>
  );
}

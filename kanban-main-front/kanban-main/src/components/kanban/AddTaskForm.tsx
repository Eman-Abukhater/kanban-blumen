import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FormEvent, useEffect, useRef, useState } from "react";
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

  const handleOnChange = (option: any) => {
    setSelectedOptions(option || []);
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
      }
    };

    const el = formRef.current;
    el?.addEventListener("keydown", handleKeyDown);
    return () => el?.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) return;
    if (!selectedOptions || selectedOptions.length === 0) return;

    props.onSubmit(name.trim(), selectedOptions);
    setName("");
    setSelectedOptions([]);
    setShowForm(false);
  };

  /**
   * ✅ react-select styles aligned to Kanban theme (no new colors)
   */
  const selectStyles: StylesConfig<MemberOption, true> = {
    control: (base, state) => ({
      ...base,
      minHeight: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: state.isFocused ? "#1C252E" : "rgba(145, 158, 171, 0.2)", // ink on focus, slate500_20 normal
      boxShadow: "none",
      backgroundColor: "rgba(255,255,255,0.7)",
      cursor: "text",
      ":hover": {
        borderColor: state.isFocused ? "#1C252E" : "rgba(145, 158, 171, 0.48)",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "2px 10px",
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      color: "#1C252E",
    }),
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
      backgroundColor: "rgba(145, 158, 171, 0.12)", // slate500_12
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
      ":hover": {
        backgroundColor: "rgba(145, 158, 171, 0.12)",
        color: "#1C252E",
      },
    }),
  };

  /**
   * ✅ dark mode overrides for react-select
   * We apply via classNamePrefix + global "dark" selector below (best),
   * but for safety we also detect dark class and adjust minimal colors inline:
   */
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const selectStylesDark: StylesConfig<MemberOption, true> = {
    ...selectStyles,
    control: (base, state) => ({
      ...selectStyles.control!(base, state),
      backgroundColor: "rgba(28, 37, 46, 0.6)", // ink-ish
      borderColor: state.isFocused ? "#FFFFFF" : "rgba(145, 158, 171, 0.2)",
    }),
    input: (base) => ({
      ...base,
      color: "#FFFFFF",
    }),
    placeholder: (base) => ({
      ...base,
      color: "rgba(145, 158, 171, 0.8)",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#1B232D",
      border: "1px solid rgba(145, 158, 171, 0.2)",
      boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
    }),
    option: (base, state) => ({
      ...base,
      color: "#FFFFFF",
      backgroundColor: state.isSelected
        ? "rgba(255,255,255,0.06)"
        : state.isFocused
        ? "rgba(255,255,255,0.06)"
        : "transparent",
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "rgba(255,255,255,0.06)",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#FFFFFF",
    }),
  };

  return (
    <div>
      {showForm ? (
        <form ref={formRef} autoComplete="off" onSubmit={handleSubmit}>
          {/* ✅ Card matches Kanban UI */}
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
            {/* ✅ Input matches your theme (no blue ring) */}
            <input
              className="
                w-full
                rounded-[12px]
                border border-slate500_20
                bg-white/70
                px-3 py-2
                text-[14px] font-semibold text-ink
                placeholder:text-slate500
                outline-none
                focus:border-ink focus:outline-none focus:ring-0
                focus-visible:outline-none focus-visible:ring-0
                dark:bg-[#1C252E]/60
                dark:text-white
                dark:placeholder:text-slate500_80
                dark:focus:border-white
              "
              placeholder={props.placeholder}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              minLength={3}
              autoFocus
            />

            {/* ✅ Select matches theme */}
            <div className="mt-3">
              <CreatableSelect
                isClearable
                closeMenuOnSelect={false}
                isMulti
                placeholder="Assigned To"
                options={fetchedOptions}
                onChange={handleOnChange}
                styles={isDark ? selectStylesDark : selectStyles}
              />
            </div>

            {/* ✅ Actions (theme buttons, no emerald/red) */}
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
                onClick={() => {
                  setName("");
                  setSelectedOptions([]);
                  setShowForm(false);
                }}
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

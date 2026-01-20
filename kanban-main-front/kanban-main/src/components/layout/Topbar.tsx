// src/components/layout/Topbar.tsx
import Image from "next/image";
import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import ThemeSwitch from "./ThemeSwitch";
import { LogOut, Sun } from "lucide-react";
import { useRouter } from "next/router";
import { apiClient } from "@/services/kanbanApi";

export default function Topbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (e) {
      // ignore errors
    } finally {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("userData");
        localStorage.removeItem("token");
      }
      router.replace("/auth/1/1");
    }
  };

  return (
  <nav className="fixed left-0 right-0 top-0 z-30 bg-white dark:bg-[#141A21]">
      <div className="mx-auto w-full max-w-[1320px] px-6">
        <div className="relative flex h-[88px] items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/Logo.png"
              alt="Blumen Cafe"
              width={170}
              height={70}
              priority
            />
          </div>

        {/* Avatar dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button
            type="button"
            className="relative h-9 w-9 rounded-full outline-none ring-2 ring-[#FFAB00]"
          >
            <Image
              src="/avatar.png"
              alt="profile"
              fill
              className="rounded-full object-cover"
            />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Menu.Items
              className="
                absolute right-0 mt-3 w-[220px]
                rounded-[16px] border border-slate500_12 bg-white p-2
                shadow-[0_18px_45px_rgba(15,23,42,0.12)]
                focus:outline-none
                dark:border-slate500_20 dark:bg-[#1C252E]
                dark:shadow-[0_18px_45px_rgba(0,0,0,0.45)]
              "
            >
              {/* Theme row */}
              <div
                className="
                  flex items-center justify-between
                  rounded-[12px] px-3 py-3
                  text-[13px] font-medium text-ink
                  dark:text-white
                "
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-slate500_12 dark:bg-slate500_20">
                    <Sun size={16} />
                  </span>
                  <span>Theme</span>
                </div>

                <ThemeSwitch />
              </div>

              <div className="my-1 h-px w-full bg-slate500_12 dark:bg-slate500_20" />

              {/* Logout */}
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`
                      flex w-full items-center gap-2
                      rounded-[12px] px-3 py-3
                      text-left text-[13px] font-medium
                      outline-none
                      ${active ? "bg-slate500_12 dark:bg-white/5" : ""}
                      text-ink dark:text-white
                    `}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-slate500_12 dark:bg-slate500_20">
                      <LogOut size={16} />
                    </span>
                    Logout
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
        </div>
      </div>
    </nav>
  );
}

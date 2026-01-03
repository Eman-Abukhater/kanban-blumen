// src/components/layout/Topbar.tsx
import Image from "next/image";
import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import ThemeSwitch from "./ThemeSwitch";
import { LogOut } from "lucide-react";
import { useRouter } from "next/router";
import { apiClient } from "@/services/kanbanApi";

export default function Topbar() {
  const router = useRouter(); // ✅ inside component

  const handleLogout = async () => {
    try {
      // optional: backend logout (doesn't invalidate JWT, but fine)
      await apiClient.post("/auth/logout");
    } catch (e) {
      // ignore errors
    } finally {
      // ✅ clear auth
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("userData");
        localStorage.removeItem("token");
      }

      // ✅ go to auth page (replace so back button won’t return)
      router.replace("/auth/1/1");
    }
  };

  return (
    <nav className="sticky top-0 z-30 bg-white dark:bg-[#141A21]">
      <div className="relative mx-auto flex max-w-[1120px] items-center justify-end px-0 py-4">
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
                <span>Theme</span>
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
                      ${active ? "bg-slate500_08 dark:bg-white/5" : ""}
                      text-ink dark:text-white
                    `}
                  >
                    Logout
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </nav>
  );
}

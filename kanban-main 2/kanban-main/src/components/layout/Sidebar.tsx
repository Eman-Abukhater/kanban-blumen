// src/components/layout/Sidebar.tsx
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

type ItemProps = {
  href: string;
  icon: string;       // e.g. "dashboard", "kanban"
  label: string;
  active: boolean;
};

const Item = ({ href, icon, label, active }: ItemProps) => (
  <Link
    href={href}
    className={`flex items-center gap-3 rounded-[12px] px-3 py-2 text-[14px] transition ${
      active ? "bg-warningBg text-brand" : "hover:bg-slate500_12 text-ink"
    }`}
  >
    <Image
      src={`/icons/${icon}.svg`}     // ← clean icon path
      alt={label}
      width={20}
      height={20}
      className={`${active ? "opacity-100" : "opacity-80"} shrink-0`}
    />
    <span>{label}</span>
  </Link>
);

export default function Sidebar() {
  const { pathname } = useRouter();

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 border-r border-slate500_12 bg-surface">
      <div className="w-full p-4">

        {/* Logo */}
        <div className="mb-6 flex items-center gap-3 px-2">
          <Image src="/Logo.png" alt="Blumen Cafe" width={36} height={36} />
        </div>

        {/* SECTION: OVERVIEW */}
        <div className="mb-2 px-2 text-[12px] font-semibold text-slate500">
          OVER VIEW
        </div>

        <div className="mb-4 space-y-1">
          <Item
            href="/"
            icon="dashboard"
            label="Dashboard"
            active={pathname === "/"}
          />
        </div>

        {/* SECTION: MANAGEMENT */}
        <div className="mb-2 px-2 text-[12px] font-semibold text-slate500">
          MANAGEMENT
        </div>

        <div className="space-y-1">

          <Item href="/user"         icon="user"        label="User"             active={pathname === "/user"} />
          <Item href="/role"         icon="lock"        label="Role"             active={pathname === "/product"} />
          <Item href="/approval"     icon="label"       label="Approval"         active={pathname === "/label"} />
          <Item href="/projects"     icon="kanban"      label="Project"          active={pathname === "/projects"} />
          <Item href="/organization" icon="banking"     label="Organization"     active={pathname === "/organization"} />
          <Item href="/hr"           icon="job"         label="HR"               active={pathname === "/hr"} />
          <Item href="/category"     icon="menu-item"   label="Category"         active={pathname === "/category"} />
          <Item href="/stock"        icon="product"     label="Stock Operation"  active={pathname === "/stock"} />
          <Item href="/purchase"     icon="order"       label="Purchase"         active={pathname === "/purchase"} />
          <Item href="/logistic"     icon="tour"        label="Logistic"         active={pathname === "/logistic"} />
          <Item href="/reports"      icon="analytics"   label="Reports"          active={pathname === "/analytics"} />

        </div>
      </div>
    </aside>
  );
}

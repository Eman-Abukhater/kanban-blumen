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
    className={`
      flex items-center gap-3 rounded-[12px] px-3 py-2 text-[14px] transition

      ${
        active
          ? "bg-[#FFAB0014]"   /* ACTIVE background */
          : "hover:bg-[#FFAB0014]" /* HOVER background */
      }
    `}
  >
    {/* ICON */}
    <Image
      src={`/icons/${icon}.svg`}
      alt={label}
      width={25}
      height={25}
      className={`
        shrink-0 transition
        ${active ? "brightness-0 saturate-100" : "opacity-60"}
      `}
      style={{
        filter: active
          ? "invert(66%) sepia(96%) saturate(934%) hue-rotate(356deg) brightness(101%) contrast(102%)"
          : "none",
      }}
    />

    {/* LABEL */}
    <span
      className={`
        font-medium text-[14px] transition
        ${active ? "text-[#FFAB00]" : "text-[#637381]"}
      `}
    >
      {label}
    </span>
  </Link>
);



export default function Sidebar() {
  const { pathname } = useRouter();

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 border-r border-slate500_12">
      <div className="w-full p-4 ">

        {/* Logo */}
        <div className="mb-6 flex items-center gap-3 px-2">
<Image src="/Logo.png" alt="Blumen Cafe" width={170} height={70} />
        </div>

        {/* SECTION: OVERVIEW */}
        <div className="mb-2 px-2 text-[11px] font-semibold text-[#919EAB]">
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
        <div className="mb-2 px-2 text-[11px] font-semibold text-[#919EAB]">
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

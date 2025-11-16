// src/components/layout/Sidebar.tsx
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { FolderKanban, LayoutDashboard, User2, Shield, CheckCircle2, Building2, Users, Boxes, ShoppingCart, Truck, BarChart2, ChevronRight } from "lucide-react";
type ItemProps = {
  href: string;
  iconSrc: string; // file name from /public/icons
  label: string;
  active: boolean;
};

const Item = ({ href, iconSrc, label, active }: ItemProps) => (
  <Link
    href={href}
    className={`flex items-center gap-3 rounded-[12px] px-3 py-2 text-[14px] ${
      active ? "bg-warningBg text-brand" : "hover:bg-slate500_12 text-ink"
    }`}
  >
    <Image
      src={`/icons/${iconSrc}`}
      alt={label}
      width={20}
      height={20}
      className={active ? "opacity-100" : "opacity-80"}
    />
    <span>{label}</span>
    {/* keep chevron or replace later with Figma arrow icon */}
  </Link>
);

export default function Sidebar() {
  const { pathname } = useRouter();

  return (
    <aside className="hidden shrink-0 border-r border-slate500_12 bg-surface md:flex md:w-64">
      <div className="w-full p-4">
        {/* Logo row (we’ll refine later) */}
        <div className="mb-6 flex items-center gap-3 px-2">
          <Image src="/Logo.png" alt="Blumen Cafe" width={36} height={36} />
        </div>

        <div className="mb-2 px-2 text-[12px] font-semibold text-slate500">
          OVER VIEW
        </div>
        <div className="mb-4 space-y-1">
          <Item
            href="/"
            iconSrc="ic-dashboard.svg"
            label="Dashboard"
            active={pathname === "/"}
          />
        </div>

        <div className="mb-2 px-2 text-[12px] font-semibold text-slate500">
          MANAGEMENT
        </div>
        <div className="space-y-1">
          <Item
            href="/user"
            iconSrc="ic-user.svg"
            label="User"
            active={pathname === "/user"}
          />
          <Item
            href="/role"
            iconSrc="ic-lock.svg"         // choose the one that matches Figma
            label="Role"
            active={pathname === "/role"}
          />
          <Item
            href="/approval"
            iconSrc="ic-label.svg"
            label="Approval"
            active={pathname === "/approval"}
          />
          <Item
            href="/projects"
            iconSrc="ic-kanban.svg"
            label="Project"
            active={pathname === "/projects"}
          />
          <Item
            href="/organization"
            iconSrc="ic-banking.svg"
            label="Organization"
            active={pathname === "/organization"}
          />
          <Item
            href="/hr"
            iconSrc="ic-job.svg"
            label="HR"
            active={pathname === "/hr"}
          />
          <Item
            href="/category"
            iconSrc="ic-menu-item.svg"
            label="Category"
            active={pathname === "/category"}
          />
          <Item
            href="/stock"
            iconSrc="ic-product.svg"
            label="Stock Operation"
            active={pathname === "/stock"}
          />
          <Item
            href="/purchase"
            iconSrc="ic-order.svg"
            label="Purchase"
            active={pathname === "/purchase"}
          />
          <Item
            href="/logistic"
            iconSrc="ic-tour.svg"
            label="Logistic"
            active={pathname === "/logistic"}
          />
          <Item
            href="/reports"
            iconSrc="ic-analytics.svg"
            label="Reports"
            active={pathname === "/reports"}
          />
        </div>
      </div>
    </aside>
  );
}

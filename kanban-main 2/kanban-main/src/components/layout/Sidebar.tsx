// src/components/layout/Sidebar.tsx
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { FolderKanban, LayoutDashboard, User2, Shield, CheckCircle2, Building2, Users, Boxes, ShoppingCart, Truck, BarChart2, ChevronRight } from "lucide-react";

const Item = ({ href, icon:Icon, label, active }: any) => (
  <Link
    href={href}
    className={`flex items-center gap-3 rounded-[12px] px-3 py-2 text-[14px] ${active ? "bg-warning-bg text-brand" : "hover:bg-slate500_12 text-ink"}`}
  >
    <Icon className="h-5 w-5 text-slate600" />
    <span>{label}</span>
    <ChevronRight className="ml-auto h-4 w-4 text-slate500" />
  </Link>
);

export default function Sidebar() {
  const { pathname } = useRouter();
  return (
    <aside className="hidden md:flex md:w-64 shrink-0 border-r border-slate500_12 bg-surface">
      <div className="w-full p-4">
        <div className="mb-6 flex items-center gap-3 px-2">
          <Image src="/Logo.png" alt="Blumen Cafe" width={36} height={36} />
        </div>

        <div className="px-2 text-[12px] font-semibold text-slate500 mb-2">OVER VIEW</div>
        <div className="space-y-1 mb-4">
          <Item href="/" icon={LayoutDashboard} label="Dashboard" active={pathname==="/"} />
        </div>

        <div className="px-2 text-[12px] font-semibold text-slate500 mb-2">MANAGEMENT</div>
        <div className="space-y-1">
          <Item href="/user" icon={User2} label="User" active={pathname==="/user"} />
          <Item href="/role" icon={Shield} label="Role" active={pathname==="/role"} />
          <Item href="/approval" icon={CheckCircle2} label="Approval" active={pathname==="/approval"} />
          <Item href="/projects" icon={FolderKanban} label="Project" active={pathname==="/projects"} />
          <Item href="/organization" icon={Building2} label="Organization" active={pathname==="/organization"} />
          <Item href="/hr" icon={Users} label="HR" active={pathname==="/hr"} />
          <Item href="/category" icon={Boxes} label="Category" active={pathname==="/category"} />
          <Item href="/stock" icon={Boxes} label="Stock Operation" active={pathname==="/stock"} />
          <Item href="/purchase" icon={ShoppingCart} label="Purchase" active={pathname==="/purchase"} />
          <Item href="/logistic" icon={Truck} label="Logistic" active={pathname==="/logistic"} />
          <Item href="/reports" icon={BarChart2} label="Reports" active={pathname==="/reports"} />
        </div>
      </div>
    </aside>
  );
}

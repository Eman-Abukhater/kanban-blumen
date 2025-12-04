import Link from "next/link";
import { useRouter } from "next/router";

type Crumb = {
  label: string;
  href?: string; // If no href → it becomes the active page
};

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  const router = useRouter();

  return (
    <nav className="flex items-center gap-2 text-[13px]">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {/* Active item = dark ink */}
            {isLast ? (
              <span className="font-semibold text-ink">{item.label}</span>
            ) : (
              <Link
                href={item.href || "#"}
                className="text-slate500 hover:text-ink transition"
              >
                {item.label}
              </Link>
            )}

            {/* Dot separator except last */}
            {!isLast && (
              <span className="text-slate500 select-none">•</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

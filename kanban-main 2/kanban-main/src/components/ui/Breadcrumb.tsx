import Link from "next/link";

type Crumb = {
  label: string;
  href?: string; // If no href → it becomes the active page
};

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-2 text-[13px]">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {/* Active item = dark ink / white in dark mode */}
            {isLast ? (
              <span className="font-semibold text-ink dark:text-white">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href || "#"}
                className="text-slate500 transition hover:text-ink dark:text-slate500_80 dark:hover:text-white"
              >
                {item.label}
              </Link>
            )}

            {/* Dot separator except last */}
            {!isLast && (
              <span className="select-none text-slate500 dark:text-slate500_80">
                •
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

import Link from "next/link";
import { useRouter } from "next/router";
import { useAppSelector } from "@/store";
import { useCan } from "@/utils/permClient";
import { PAGE_PERMS } from "@/constants/pagePerm";

type ConsoleLayoutProps = {
  title: string;
  subtitle?: string;
  active: "dashboard" | "orders" | "branches" | "users";
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { key: "dashboard" as const, label: "Dashboard", href: "/console/dashboard", perms: PAGE_PERMS.DASHBOARD.anyOf },
  { key: "orders" as const, label: "Orders", href: "/console/orders", perms: PAGE_PERMS.ORDER.anyOf },
  { key: "branches" as const, label: "Branches", href: "/console/branch", perms: PAGE_PERMS.BRANCH.anyOf },
  { key: "users" as const, label: "Users", href: "/console/users", perms: PAGE_PERMS.USERS.anyOf },
];

const ConsoleLayout = ({ title, subtitle, active, children }: ConsoleLayoutProps) => {
  const router = useRouter();
  const can = useCan();
  const { user } = useAppSelector((state) => state.auth);
  const allowedNav = NAV_ITEMS.filter((item) => item.perms.some((perm) => can(perm.object, perm.action)));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Baan Admin Console</p>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {user.email}
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
        <aside className="w-full max-w-xs space-y-4 lg:w-60">
          <nav className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="px-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Navigation</p>
            <ul className="mt-3 space-y-1">
              {allowedNav.map((item) => {
                const isActive = active === item.key || router.pathname === item.href;
                const baseClasses = "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-emerald-50";
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className={`${baseClasses} ${isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600"}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.label}
                      {isActive && <span className="text-xs text-emerald-600">●</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {allowedNav.length === 0 && (
              <p className="mt-3 px-2 text-sm text-slate-400">No pages available for your role.</p>
            )}
          </nav>
        </aside>
        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
};

export default ConsoleLayout;

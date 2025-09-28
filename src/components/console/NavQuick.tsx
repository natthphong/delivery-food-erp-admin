import Link from "next/link";

export default function NavQuick() {
  return (
    <nav className="flex flex-wrap gap-2">
      <Link
        href="/console/dashboard"
        className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
      >
        Dashboard
      </Link>
      <Link
        href="/console/orders"
        className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
      >
        Orders
      </Link>
      <Link
        href="/console/branch"
        className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
      >
        Branch
      </Link>
      <Link
        href="/console/users"
        className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
      >
        Users
      </Link>
    </nav>
  );
}

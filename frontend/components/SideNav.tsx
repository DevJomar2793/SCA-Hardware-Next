"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  HardDrive,
  History,
  LayoutDashboard,
  Menu,
  RotateCw,
  Settings,
  Users,
  X,
} from "lucide-react";

const menuItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/" },
  { name: "Hardware", icon: HardDrive, href: "/hardware" },
  { name: "Employees", icon: Users, href: "/employee" },
  { name: "Assignments", icon: RotateCw, href: "/assignment" },
  { name: "History", icon: History, href: "/history" },
];

const futureItems = [
  { name: "Analytics", icon: BarChart3 },
  { name: "Settings", icon: Settings },
];

function NavigationContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-950/25">
          <Boxes size={21} strokeWidth={2.2} />
        </div>
        <div>
          <p className="font-semibold tracking-tight text-white">CKT Hardware</p>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Inventory system
          </p>
        </div>
      </div>

      <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Workspace
        </p>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <item.icon
                  size={19}
                  className={isActive ? "text-white" : "text-slate-400 group-hover:text-white"}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="my-5 border-t border-white/10" />
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Planning
        </p>
        <div className="space-y-1">
          {futureItems.map((item) => (
            <div
              key={item.name}
              aria-disabled="true"
              title={`${item.name} — coming soon`}
              className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-500"
            >
              <item.icon size={19} />
              <span>{item.name}</span>
              <span className="ml-auto rounded-full border border-slate-700 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                Soon
              </span>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700 text-xs font-bold text-white">
            IA
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">Inventory Admin</p>
            <p className="truncate text-xs text-slate-400">Operations workspace</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <>
      <aside className="app-navigation hidden h-full w-64 shrink-0 flex-col bg-[#111827] text-slate-300 lg:flex">
        <NavigationContent pathname={pathname} />
      </aside>

      <header className="app-navigation fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Boxes size={19} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">CKT Hardware</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Inventory system</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation"
          aria-expanded={isOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <Menu size={21} />
        </button>
      </header>

      {isOpen && (
        <div className="app-navigation fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative flex h-full w-[min(20rem,86vw)] flex-col bg-[#111827] shadow-2xl">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
            <NavigationContent pathname={pathname} onNavigate={() => setIsOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}

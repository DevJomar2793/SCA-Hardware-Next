"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HardDrive,
  BarChart3,
  Settings,
  LogOut,
  Square,
} from "lucide-react";

const menuItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/" },
  { name: "Hardware", icon: HardDrive, href: "/hardware" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export const SideNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-[#0f172a] text-slate-300 h-full flex flex-col">
      {/* Brand Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center">
          <Square className="text-white w-5 h-5 fill-current" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">
          CKT Hardware
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? "bg-purple-600/20 text-purple-400"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs text-white font-bold">
            AU
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">
              Admin User
            </p>
            <p className="text-xs text-slate-500 truncate">
              admin@ckthardware.com
            </p>
          </div>
          <LogOut
            size={16}
            className="text-slate-500 hover:text-red-400 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

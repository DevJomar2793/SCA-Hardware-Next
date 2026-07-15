import React from "react";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-500 md:px-8">
      <p>© {currentYear} CKT Hardware Inventory</p>
      <p className="hidden sm:block">Inventory operations workspace</p>
    </footer>
  );
};

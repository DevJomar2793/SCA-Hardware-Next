import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-8 flex justify-center items-center text-sm text-gray-500">
      <p>© {currentYear} <span className="font-semibold text-slate-700">DevJMR</span></p>
    </footer>
  );
};

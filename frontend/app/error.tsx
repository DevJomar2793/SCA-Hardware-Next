'use client';

import React from 'react';
import { AlertTriangle, RefreshCcw, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 bg-gradient-to-b from-transparent to-slate-50/50">
      <div className="relative group">
        {/* Decorative background element */}
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        
        <div className="relative bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-2xl mb-6 rotate-3 group-hover:rotate-0 transition-transform duration-300">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Something went wrong
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed text-sm">
            {error.message || "The system encountered an unexpected issue while processing your request. Your session is still active, but we couldn't load this specific view."}
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
              Try Again
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <Link 
                href="/" 
                className="flex items-center justify-center gap-2 text-slate-600 px-4 py-3 rounded-xl font-medium hover:bg-slate-50 border border-slate-100 transition-all text-sm"
              >
                <Home size={16} />
                Dashboard
              </Link>
              <button 
                onClick={() => window.history.back()}
                className="flex items-center justify-center gap-2 text-slate-600 px-4 py-3 rounded-xl font-medium hover:bg-slate-50 border border-slate-100 transition-all text-sm"
              >
                <ArrowLeft size={16} />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-10 flex items-center gap-2 text-slate-400">
        <span className="text-xs font-mono px-2 py-1 bg-slate-100 rounded border border-slate-200">
          ERR_CODE: {error.digest || 'SYSTEM_EXCEPTION'}
        </span>
        <span className="text-xs italic">Contact admin if this persists</span>
      </div>
    </div>
  );
}

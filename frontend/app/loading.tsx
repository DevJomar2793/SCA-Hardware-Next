import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4">
      <div className="relative flex items-center justify-center">
        {/* Ambient Background Glows */}
        <div className="absolute w-32 h-32 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-24 h-24 bg-blue-400/10 rounded-full blur-2xl animate-pulse delay-700" />
        
        {/* Sophisticated Spinner Stack */}
        <div className="relative w-20 h-20">
          {/* Outer Ring */}
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-purple-600 rounded-full animate-spin" />
          
          {/* Middle Ring - Reverse Spin */}
          <div className="absolute inset-2 border-4 border-transparent border-b-purple-400 rounded-full animate-spin [animation-duration:1.5s]" />
          
          {/* Center Dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-ping" />
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center space-y-3">
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">
          Synchronizing System
        </h3>
        <div className="flex items-center justify-center gap-2">
          <span className="text-slate-500 text-sm font-medium">Loading assets</span>
          <span className="flex gap-1">
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
          </span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Menu, Search, Sparkles } from 'lucide-react';
import { SheetTrigger } from './ui/sheet';
import AppsMenu from './AppsMenu';

export default function Header({ onToolSelect, activeTool }) {
  return (
    <header className="sticky top-0 z-40 bg-[#fafaf7]/85 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <AppsMenu activeTool={activeTool} onToolSelect={onToolSelect}>
          <div className="flex items-center gap-3">
            <SheetTrigger asChild>
              <button
                className="p-2 rounded-lg hover:bg-stone-100 text-slate-700"
                aria-label="Browse all tools"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>

            <a href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 grid place-items-center shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-col leading-tight hidden sm:flex">
                <span className="font-display font-extrabold text-[17px] text-slate-900">PixelShrink</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-700 font-semibold">Studio</span>
              </div>
            </a>
          </div>

          <SheetTrigger asChild>
            <button
              className="p-2 rounded-lg hover:bg-stone-100 text-slate-700"
              aria-label="Search tools"
            >
              <Search className="w-5 h-5" />
            </button>
          </SheetTrigger>
        </AppsMenu>
      </div>
    </header>
  );
}

import React, { useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { NAV_LINKS } from '../mock';

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#fafaf7]/85 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 grid place-items-center shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-extrabold text-[17px] text-slate-900">PixelShrink</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-700 font-semibold">Studio</span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-slate-700 hover:text-emerald-700 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" className="text-slate-700 hover:text-emerald-700 hover:bg-emerald-50">Sign in</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold btn-press">
            Unlock Pro
          </Button>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-stone-100"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-stone-200 bg-white">
          <div className="px-4 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-slate-700 py-2">{l.label}</a>
            ))}
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">Unlock Pro</Button>
          </div>
        </div>
      )}
    </header>
  );
}

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './ui/sheet';
import { Input } from './ui/input';
import { TOOLS } from '../mock';

// Shared side panel for browsing/searching all tools. `children` should be
// one or more <SheetTrigger asChild> buttons (e.g. hamburger + search icon
// in the Header) — Radix's Dialog.Root supports multiple triggers pointed
// at the same open state, so both buttons open this one panel.
export default function AppsMenu({ activeTool, onToolSelect, children }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOLS;
    return TOOLS.filter(
      (t) => t.label.toLowerCase().includes(q) || t.short.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = (key) => {
    onToolSelect(key);
    setOpen(false);
    setQuery('');
    setTimeout(() => {
      const el = document.getElementById('tool');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      {children}
      <SheetContent side="left" className="w-full sm:max-w-sm p-0 flex flex-col gap-0">
        <div className="p-5 border-b border-stone-200">
          <SheetTitle className="font-display text-lg text-slate-900">All Tools</SheetTitle>
          <SheetDescription>{TOOLS.length} free tools, all in your browser.</SheetDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-stone-500 text-center py-10">
              No tools match &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map((tool) => {
                const Icon = tool.icon;
                const active = tool.key === activeTool;
                return (
                  <button
                    key={tool.key}
                    onClick={() => handleSelect(tool.key)}
                    className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                      active ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-stone-100 text-slate-700'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${
                        active ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </span>
                    <span className="text-sm font-medium">{tool.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

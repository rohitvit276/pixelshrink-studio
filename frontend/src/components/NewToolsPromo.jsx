import React from 'react';
import { Sparkles } from 'lucide-react';
import { TOOLS, NEW_UTILITY_TOOL_KEYS } from '../mock';

export default function NewToolsPromo({ onToolSelect }) {
  const tools = NEW_UTILITY_TOOL_KEYS.map((key) => TOOLS.find((t) => t.key === key)).filter(Boolean);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-10 md:px-10 md:py-12 shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative text-center mb-8">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Just launched
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white mt-4">
            Try these tools for free
          </h2>
          <p className="mt-3 text-emerald-50/90 max-w-xl mx-auto">
            Nine new browser-based utilities — no uploads, no sign-up, nothing leaves your device.
          </p>
        </div>

        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.key}
                onClick={() => onToolSelect && onToolSelect(tool.key)}
                className="group flex flex-col items-center text-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 rounded-2xl p-4 md:p-5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <div className="w-11 h-11 rounded-xl bg-white grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="text-sm font-semibold text-white leading-snug">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

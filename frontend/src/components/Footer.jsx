import React from 'react';
import { Sparkles, Twitter, Instagram, Facebook, Github } from 'lucide-react';
import { FOOTER_LINKS } from '../mock';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 grid place-items-center">
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display font-extrabold text-white">PixelShrink</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold">Studio</span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed max-w-sm text-stone-400">
              Shrink, crop and convert images right in your browser. No uploads, no watermarks, no compromise.
            </p>
            <div className="flex gap-3 mt-5">
              {[Twitter, Instagram, Facebook, Github].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-emerald-600 grid place-items-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, items]) => (
            <div key={title}>
              <p className="text-white font-semibold mb-3">{title}</p>
              <ul className="space-y-2 text-sm">
                {items.map((it) => (
                  <li key={it}><a href="#" className="hover:text-emerald-400 transition-colors">{it}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-500">
          <p>© {new Date().getFullYear()} PixelShrink Studio. All rights reserved.</p>
          <p>Crafted for creators who care about pixels.</p>
        </div>
      </div>
    </footer>
  );
}

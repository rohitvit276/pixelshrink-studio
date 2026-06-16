import React from 'react';
import { Chrome, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

export default function ChromeExtensionBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 md:px-12 py-10 md:py-14 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -left-10 bottom-0 w-60 h-60 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="flex items-center gap-5 relative">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white grid place-items-center shadow-md">
            <Chrome className="w-8 h-8 text-emerald-600" strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest">Chrome Extension</p>
            <h3 className="font-display text-2xl md:text-3xl font-extrabold text-white mt-1">PixelShrink for Chrome</h3>
            <p className="text-stone-300 text-sm md:text-base mt-1">Shrink images faster, directly from any web page.</p>
          </div>
        </div>

        <Button className="bg-white hover:bg-emerald-50 text-slate-900 font-semibold px-6 py-6 rounded-xl btn-press relative">
          Add to Chrome <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </section>
  );
}

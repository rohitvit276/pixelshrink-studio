import React from 'react';
import { Star, Smartphone, Apple, Play } from 'lucide-react';

export default function MobileAppSection() {
  return (
    <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-stone-50 border-y border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Mobile app</span>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 leading-tight">
            For a smoother mobile experience, get our app:
            <span className="block text-emerald-700">Pocket Pixel Shrinker</span>
          </h2>
          <p className="text-slate-700 mt-4 max-w-md">Shrink, crop and convert photos straight from your camera roll. No watermarks, no nonsense.</p>

          <div className="flex flex-wrap items-center gap-8 mt-8">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-900 font-bold mt-1">4.6 <span className="text-slate-500 font-medium text-sm">global rating</span></p>
            </div>
            <div className="h-10 w-px bg-stone-300" />
            <div>
              <p className="text-2xl font-display font-extrabold text-slate-900">25M+</p>
              <p className="text-slate-500 text-sm">downloads</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <button className="inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-3 btn-press">
              <Apple className="w-7 h-7" />
              <div className="text-left leading-tight">
                <p className="text-[10px] uppercase tracking-wider">Download on the</p>
                <p className="text-base font-semibold">App Store</p>
              </div>
            </button>
            <button className="inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-3 btn-press">
              <Play className="w-7 h-7" />
              <div className="text-left leading-tight">
                <p className="text-[10px] uppercase tracking-wider">Get it on</p>
                <p className="text-base font-semibold">Google Play</p>
              </div>
            </button>
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="relative w-64 h-[440px] rounded-[2.5rem] bg-slate-900 p-3 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="w-full h-full rounded-[2rem] bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 grid place-items-center overflow-hidden relative">
              <Smartphone className="w-20 h-20 text-white/90" />
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-white font-display font-bold text-lg">Pocket Pixel</p>
                <p className="text-emerald-100 text-xs">Shrinker</p>
              </div>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-slate-900" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

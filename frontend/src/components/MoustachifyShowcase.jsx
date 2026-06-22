import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Smile } from 'lucide-react';
import { Button } from './ui/button';
import { MOUSTACHE_STYLES } from '../utils/moustaches';

// Show a visual preview of each moustache style as "slides"
const SLIDES = MOUSTACHE_STYLES.map((style) => ({
  id: style.id,
  label: style.label,
  svg: style.svg,
  description: `Apply the "${style.label}" to any photo instantly`,
}));

export default function MoustachifyShowcase({ onTryNow }) {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setCurrent((c) => (c + 1) % SLIDES.length);

  const slide = SLIDES[current];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
      <div className="text-center mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">New feature</span>
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 flex items-center justify-center gap-3">
          <Smile className="w-9 h-9 text-emerald-600" />
          Moustachify
        </h2>
        <p className="mt-4 text-slate-600 max-w-xl mx-auto">
          Automatic face detection adds a perfect moustache to any photo — choose from 6 hand-crafted styles.
        </p>
      </div>

      {/* Carousel */}
      <div className="relative max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Slide content */}
          <div className="flex flex-col items-center justify-center py-14 px-8 text-center min-h-[280px]">
            {/* Moustache preview */}
            <div
              className="w-64 h-24 mb-6"
              dangerouslySetInnerHTML={{
                __html: slide.svg.replace(
                  'viewBox="0 0 200 80"',
                  'viewBox="0 0 200 80" width="100%" height="100%"',
                ),
              }}
            />
            <h3 className="font-display text-2xl font-extrabold text-slate-900">{slide.label}</h3>
            <p className="text-slate-500 mt-2 text-sm">{slide.description}</p>
          </div>

          {/* Slide indicator */}
          <div className="flex justify-center gap-2 pb-6">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-emerald-600 w-5' : 'bg-stone-300'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white border border-stone-200 shadow-sm grid place-items-center hover:border-emerald-400 transition"
          aria-label="Previous style"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white border border-stone-200 shadow-sm grid place-items-center hover:border-emerald-400 transition"
          aria-label="Next style"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* CTA */}
      <div className="flex justify-center mt-10">
        <Button
          onClick={() => onTryNow && onTryNow('moustachify')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-6 rounded-xl text-base"
        >
          <Smile className="w-5 h-5 mr-2" /> Try it now — it's free
        </Button>
      </div>
    </section>
  );
}

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { FAQ_ITEMS } from '../mock';

export default function FAQSection() {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
      <div className="text-center mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">FAQ</span>
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">Questions, answered.</h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-b border-stone-200">
            <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline py-5">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-slate-700 leading-relaxed pb-5">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

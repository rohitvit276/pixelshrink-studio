import React, { useState, useMemo } from 'react';
import { AlignLeft, Trash2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';

export default function WordCounterPanel() {
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const sentences = trimmed ? (trimmed.match(/[^.!?]+[.!?]+/g) || (trimmed ? [trimmed] : [])).length : 0;
    const paragraphs = trimmed ? trimmed.split(/\n+/).filter((p) => p.trim()).length : 0;
    const readingMinutes = words ? Math.max(1, Math.round(words / 200)) : 0;
    return { words, chars, charsNoSpaces, sentences, paragraphs, readingMinutes };
  }, [text]);

  const cards = [
    { label: 'Words', value: stats.words },
    { label: 'Characters', value: stats.chars },
    { label: 'Characters (no spaces)', value: stats.charsNoSpaces },
    { label: 'Sentences', value: stats.sentences },
    { label: 'Paragraphs', value: stats.paragraphs },
    { label: 'Reading time', value: stats.readingMinutes ? `${stats.readingMinutes} min` : '—' },
  ];

  return (
    <>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 md:p-5 mb-6">
        <p className="text-sm text-emerald-900 leading-relaxed">
          <span className="font-bold">What this tool does:</span> paste or type text and get live counts for words, characters, sentences and paragraphs, plus an estimated reading time — updated as you type.
        </p>
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-extrabold text-xl text-slate-900 flex items-center gap-2"><AlignLeft className="w-5 h-5 text-emerald-600" /> Text</h3>
            {text && <button onClick={() => setText('')} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Clear</button>}
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste or type your text here…" className="min-h-[360px] text-sm leading-relaxed resize-y rounded-2xl border-stone-200 focus-visible:ring-emerald-500" />
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 gap-3 content-start">
          {cards.map((c) => (
            <div key={c.label} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
              <p className="text-2xl font-display font-extrabold text-emerald-700">{c.value}</p>
              <p className="text-xs text-slate-500 mt-1 leading-snug">{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

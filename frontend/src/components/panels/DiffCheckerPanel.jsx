import React, { useState } from 'react';
import { GitCompare, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

export default function DiffCheckerPanel() {
  const [original, setOriginal] = useState('');
  const [changed, setChanged] = useState('');
  const [diffParts, setDiffParts] = useState(null);
  const [stats, setStats] = useState(null);

  const compare = async () => {
    if (!original.trim() && !changed.trim()) { toast.error('Paste some text in both boxes first.'); return; }
    const { diffWordsWithSpace } = await import('diff');
    const parts = diffWordsWithSpace(original, changed);
    setDiffParts(parts);
    const added = parts.filter((p) => p.added).length;
    const removed = parts.filter((p) => p.removed).length;
    setStats({ added, removed });
  };

  const onClear = () => { setOriginal(''); setChanged(''); setDiffParts(null); setStats(null); };

  return (
    <>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 md:p-5 mb-6">
        <p className="text-sm text-emerald-900 leading-relaxed">
          <span className="font-bold">What this tool does:</span> paste two versions of a text and see exactly what changed, word by word. Additions are highlighted green, removals are struck through in red.
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-lg text-slate-900 mb-3">Original</h3>
          <Textarea value={original} onChange={(e) => setOriginal(e.target.value)} placeholder="Paste the original text…" className="min-h-[220px] text-sm leading-relaxed resize-y rounded-2xl border-stone-200 focus-visible:ring-emerald-500" />
        </div>
        <div className="bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-lg text-slate-900 mb-3">Changed</h3>
          <Textarea value={changed} onChange={(e) => setChanged(e.target.value)} placeholder="Paste the changed text…" className="min-h-[220px] text-sm leading-relaxed resize-y rounded-2xl border-stone-200 focus-visible:ring-emerald-500" />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6 flex-wrap">
        <Button onClick={compare} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl btn-press px-6"><GitCompare className="w-4 h-4" /> Compare</Button>
        {(original || changed) && <Button onClick={onClear} variant="outline" className="rounded-xl font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"><Trash2 className="w-4 h-4" /> Clear</Button>}
      </div>

      {diffParts && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="font-display font-extrabold text-lg text-slate-900">Differences</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {stats.added} added</span>
              <span className="inline-flex items-center gap-1.5 text-red-700 font-semibold"><span className="w-2 h-2 rounded-full bg-red-500" /> {stats.removed} removed</span>
            </div>
          </div>
          <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono">
            {diffParts.map((part, i) => (
              <span
                key={i}
                className={part.added ? 'bg-emerald-100 text-emerald-900 rounded px-0.5' : part.removed ? 'bg-red-100 text-red-700 line-through rounded px-0.5' : 'text-slate-700'}
              >
                {part.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

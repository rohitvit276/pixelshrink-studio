import React, { useState } from 'react';
import { Braces, Copy, Wand2, Minimize2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

export default function JsonFormatterPanel() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);

  const format = (minify) => {
    if (!input.trim()) { toast.error('Paste some JSON first.'); return; }
    try {
      const parsed = JSON.parse(input);
      setOutput(minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e) {
      setError(e.message);
      setOutput('');
    }
  };

  const onCopy = async () => {
    if (!output) { toast.error('Nothing to copy yet.'); return; }
    try { await navigator.clipboard.writeText(output); toast.success('Copied to clipboard.'); }
    catch (e) { toast.error('Could not copy — try selecting the text manually.'); }
  };

  const onClear = () => { setInput(''); setOutput(''); setError(null); };

  return (
    <>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 md:p-5 mb-6">
        <p className="text-sm text-emerald-900 leading-relaxed">
          <span className="font-bold">What this tool does:</span> paste messy or minified JSON and get it validated and neatly indented, or squeeze it down to a single compact line. Errors are pointed out so you know exactly what to fix.
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-extrabold text-lg text-slate-900 flex items-center gap-2"><Braces className="w-5 h-5 text-emerald-600" /> Input</h3>
            {input && <button onClick={onClear} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Clear</button>}
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"paste": "your JSON here"}'
            className="min-h-[360px] font-mono text-xs leading-relaxed resize-y rounded-2xl border-stone-200 focus-visible:ring-emerald-500"
          />
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Button onClick={() => format(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl btn-press"><Wand2 className="w-4 h-4" /> Format</Button>
            <Button onClick={() => format(true)} variant="outline" className="rounded-xl font-semibold"><Minimize2 className="w-4 h-4" /> Minify</Button>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-extrabold text-lg text-slate-900">Output</h3>
            {output && <button onClick={onCopy} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy</button>}
          </div>
          {error ? (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-start gap-2 min-h-[360px]">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div><p className="font-semibold">Invalid JSON</p><p className="mt-1 text-red-700/90 font-mono text-xs leading-relaxed">{error}</p></div>
            </div>
          ) : output ? (
            <div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 flex items-center gap-1.5 mb-2"><CheckCircle2 className="w-3.5 h-3.5" /> Valid JSON</div>
              <Textarea readOnly value={output} className="min-h-[320px] font-mono text-xs leading-relaxed resize-y rounded-2xl border-stone-200 bg-stone-50" />
            </div>
          ) : (
            <div className="min-h-[360px] rounded-2xl border-2 border-dashed border-stone-200 grid place-items-center text-sm text-slate-400">Formatted JSON will appear here</div>
          )}
        </div>
      </div>
    </>
  );
}

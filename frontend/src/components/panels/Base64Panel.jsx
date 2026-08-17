import React, { useState } from 'react';
import { Binary, Copy, ArrowRightLeft, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function base64ToUtf8(b64) {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function Base64Panel() {
  const [mode, setMode] = useState('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);

  const run = () => {
    if (!input) { toast.error('Enter some text first.'); return; }
    try {
      setOutput(mode === 'encode' ? utf8ToBase64(input) : base64ToUtf8(input));
      setError(null);
    } catch (e) {
      setError(mode === 'encode' ? 'Could not encode this text.' : 'This is not valid Base64.');
      setOutput('');
    }
  };

  const swap = () => {
    setMode((m) => (m === 'encode' ? 'decode' : 'encode'));
    setInput(output || input);
    setOutput('');
    setError(null);
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
          <span className="font-bold">What this tool does:</span> converts text to Base64 encoding, or decodes Base64 back into readable text. Handles Unicode (emoji, accents, non-Latin scripts) correctly.
        </p>
      </div>
      <div className="bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
        <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 p-1 w-fit mb-5">
          <button onClick={() => setMode('encode')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'encode' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}>Encode</button>
          <button onClick={() => setMode('decode')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'decode' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}>Decode</button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-slate-900 flex items-center gap-2"><Binary className="w-4 h-4 text-emerald-600" /> {mode === 'encode' ? 'Plain text' : 'Base64'}</h3>
              {input && <button onClick={onClear} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Clear</button>}
            </div>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'encode' ? 'Enter text to encode…' : 'Paste Base64 to decode…'} className="min-h-[220px] font-mono text-xs leading-relaxed resize-y rounded-2xl border-stone-200 focus-visible:ring-emerald-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-slate-900">{mode === 'encode' ? 'Base64' : 'Plain text'}</h3>
              {output && <button onClick={onCopy} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy</button>}
            </div>
            {error ? (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-800 min-h-[220px]">{error}</div>
            ) : (
              <Textarea readOnly value={output} placeholder="Result will appear here…" className="min-h-[220px] font-mono text-xs leading-relaxed resize-y rounded-2xl border-stone-200 bg-stone-50" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5 flex-wrap">
          <Button onClick={run} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl btn-press px-6">{mode === 'encode' ? 'Encode' : 'Decode'}</Button>
          <Button onClick={swap} variant="outline" className="rounded-xl font-semibold"><ArrowRightLeft className="w-4 h-4" /> Swap</Button>
        </div>
      </div>
    </>
  );
}

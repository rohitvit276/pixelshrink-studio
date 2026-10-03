import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Download, Loader2, RefreshCcw, Lock, FileText, FileUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { padPdf } from '../../lib/padFile';

const MAX_FILES = 5;
const MAX_TARGET_BYTES = 100 * 1024 * 1024;
const PDF_ACCEPT = 'application/pdf,.pdf';
const PRESETS = [
  { label: '20 KB', value: 20, unit: 'KB' },
  { label: '50 KB', value: 50, unit: 'KB' },
  { label: '100 KB', value: 100, unit: 'KB' },
  { label: '200 KB', value: 200, unit: 'KB' },
  { label: '500 KB', value: 500, unit: 'KB' },
  { label: '1 MB', value: 1, unit: 'MB' },
];

function formatBytes(b) {
  return b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function isPdf(f) {
  return f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
}

export default function IncreasePdfSizePanel() {
  const [files, setFiles] = useState([]);
  const [targetValue, setTargetValue] = useState('20');
  const [unit, setUnit] = useState('KB');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback((incoming) => {
    const list = Array.from(incoming).filter(isPdf);
    if (!list.length) { toast.error('Please choose PDF files only.'); return; }
    const remaining = MAX_FILES - files.length;
    if (list.length > remaining) toast.warning(`Up to ${MAX_FILES} PDFs at once.`);
    const accepted = list.slice(0, remaining).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file: f, name: f.name, size: f.size,
    }));
    setFiles((prev) => [...prev, ...accepted]);
    setResults([]);
  }, [files.length]);

  const onSelectClick = () => inputRef.current?.click();
  const onInputChange = (e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); };
  const removeFile = (id) => { setFiles((p) => p.filter((f) => f.id !== id)); setResults((p) => p.filter((r) => r.id !== id)); };
  const resetAll = () => { setFiles([]); setResults([]); };

  const targetBytes = Math.round((Number(targetValue) || 0) * (unit === 'MB' ? 1024 * 1024 : 1024));

  const onIncrease = async () => {
    if (!files.length) { toast.error('Add at least one PDF first.'); return; }
    if (targetBytes <= 0) { toast.error('Enter the file size you need.'); return; }
    if (targetBytes > MAX_TARGET_BYTES) { toast.error('Target size can be at most 100 MB.'); return; }
    setProcessing(true); setResults([]);
    const out = [];
    for (const f of files) {
      if (f.size >= targetBytes) {
        out.push({ id: f.id, name: f.name, note: `Already ${formatBytes(f.size)} — pick a larger target size.` });
        continue;
      }
      try {
        const bytes = await padPdf(new Uint8Array(await f.file.arrayBuffer()), targetBytes);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        out.push({ id: f.id, name: `${f.name.replace(/\.pdf$/i, '')}-${targetValue}${unit.toLowerCase()}.pdf`, url: URL.createObjectURL(blob), size: blob.size, originalSize: f.size });
      } catch (e) {
        console.error('[IncreasePdfSize] failed:', e);
        out.push({ id: f.id, name: f.name, note: e?.message || 'This PDF could not be processed.' });
      }
    }
    setResults(out);
    const done = out.filter((r) => r.url).length;
    if (done) toast.success(`Increased the size of ${done} PDF${done > 1 ? 's' : ''}.`);
    if (done < out.length) toast.warning(`${out.length - done} PDF${out.length - done > 1 ? 's were' : ' was'} skipped.`);
    setProcessing(false);
  };

  useEffect(() => () => results.forEach((r) => r.url && URL.revokeObjectURL(r.url)), [results]);

  return (
    <>
      <div className="mb-6">
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900">Increase PDF Size</h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          PDF rejected for being too small? Increase PDF file size in KB or MB to meet a minimum upload limit — 20 KB, 100 KB, 1 MB or anything you type. Every page, the text and the layout stay exactly the same.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Process up to <span className="font-semibold text-slate-900">{MAX_FILES}</span> PDFs.</p>
            {files.length > 0 && (
              <button onClick={resetAll} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>
            )}
          </div>
          {files.length === 0 ? (
            <div onClick={onSelectClick} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
              className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${dragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4"><Upload className="w-7 h-7 text-emerald-700" /></div>
              <p className="font-display text-xl font-bold text-slate-900">Drop PDFs here or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">Up to {MAX_FILES} files</p>
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl btn-press" type="button">Select PDFs</Button>
              <div className="mt-6 text-xs text-slate-500 leading-relaxed max-w-md">Files are processed <span className="font-semibold text-slate-700">on your device</span>, never uploaded.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                  <div className="w-9 h-9 rounded-lg bg-red-50 grid place-items-center shrink-0"><FileText className="w-4.5 h-4.5 text-red-600" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-900 truncate">{f.name}</p><p className="text-xs text-slate-500">{formatBytes(f.size)}</p></div>
                  <button onClick={() => removeFile(f.id)} className="w-7 h-7 rounded-md hover:bg-stone-200 grid place-items-center shrink-0"><X className="w-3.5 h-3.5 text-slate-600" /></button>
                </div>
              ))}
              {files.length < MAX_FILES && (
                <button onClick={onSelectClick} className="w-full rounded-xl border-2 border-dashed border-stone-300 hover:border-emerald-500 py-3 text-sm font-medium text-slate-600 hover:text-emerald-700 transition">+ Add more ({MAX_FILES - files.length} left)</button>
              )}
            </div>
          )}
          <input ref={inputRef} type="file" accept={PDF_ACCEPT} multiple hidden onChange={onInputChange} />
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900">Choose the new size</h3>
          <p className="text-sm text-slate-500 mt-1">Your PDF is grown to exactly this file size.</p>
          <div className="mt-5 space-y-3">
            <div>
              <Label htmlFor="pdf-target" className="text-xs text-slate-500">target file size</Label>
              <div className="flex gap-2 mt-1">
                <Input id="pdf-target" type="number" min="1" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="20" />
                {['KB', 'MB'].map((u) => (
                  <button key={u} onClick={() => setUnit(u)} className={`px-4 rounded-md border text-sm font-semibold transition ${unit === u ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 text-slate-600 hover:border-stone-400'}`}>{u}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => { setTargetValue(String(p.value)); setUnit(p.unit); }} className={`text-xs px-3 py-1 rounded-full border transition ${Number(targetValue) === p.value && unit === p.unit ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 text-slate-600 hover:border-stone-400'}`}>{p.label}</button>
              ))}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Pages, text and images are untouched — only the file gets bigger.</p>
          </div>
          <Button onClick={onIncrease} disabled={processing || !files.length} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Increasing…</span> : <span className="inline-flex items-center gap-2"><FileUp className="w-4 h-4" /> Increase PDF Size</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your files never leave your device.</div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900">Your larger PDFs</h3><p className="text-sm text-slate-500">Tap download to save.</p></div>
            <Button variant="outline" onClick={resetAll} className="border-stone-300">Process another</Button>
          </div>
          <div className="space-y-2">
            {results.map((r) => (r.url ? (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-50 grid place-items-center shrink-0"><FileText className="w-4.5 h-4.5 text-red-600" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-900 truncate">{r.name}</p><p className="text-xs text-emerald-700 font-semibold">{formatBytes(r.originalSize)} → {formatBytes(r.size)}</p></div>
                <a href={r.url} download={r.name} className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg px-4 py-2.5 btn-press shrink-0"><Download className="w-4 h-4" /> Download</a>
              </div>
            ) : (
              <div key={r.id} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-sm font-semibold text-slate-900 truncate">{r.name}</p>
                <p className="text-xs text-amber-800 mt-0.5">{r.note}</p>
              </div>
            )))}
          </div>
        </div>
      )}

      <div className="mt-8 grid md:grid-cols-2 gap-6 text-sm text-slate-600 leading-relaxed">
        <div>
          <h3 className="font-display font-bold text-base text-slate-900">How to increase PDF size in KB</h3>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Add your PDF document.</li>
            <li>Type the size you need — for example 20 KB, 100 KB or 1 MB.</li>
            <li>Click <span className="font-semibold text-slate-800">Increase PDF Size</span> and download the larger file.</li>
          </ol>
        </div>
        <div>
          <h3 className="font-display font-bold text-base text-slate-900">When do you need a bigger PDF?</h3>
          <p className="mt-2">Application, exam and government portals often set a minimum PDF size and reject small certificates, receipts and scanned documents. This tool increases the PDF file size to what the form asks for, without re-typing or re-scanning anything.</p>
        </div>
      </div>
    </>
  );
}

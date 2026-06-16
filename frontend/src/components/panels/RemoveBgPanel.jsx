import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Download, Loader2, RefreshCcw, Lock, Eraser } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

const MAX_FILES = 3;
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/gif';

export default function RemoveBgPanel() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [results, setResults] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(async (incoming) => {
    const list = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    if (!list.length) { toast.error('Choose image files only.'); return; }
    const remaining = MAX_FILES - files.length;
    const accepted = list.slice(0, remaining);
    const loaded = await Promise.all(
      accepted.map((f) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => resolve({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, file: f, src: reader.result, name: f.name, w: img.naturalWidth, h: img.naturalHeight, originalSize: f.size });
          img.src = reader.result;
        };
        reader.readAsDataURL(f);
      }))
    );
    setFiles((prev) => [...prev, ...loaded]); setResults([]);
  }, [files.length]);

  const onSelectClick = () => inputRef.current?.click();
  const onInputChange = (e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); };
  const removeFile = (id) => { setFiles((p) => p.filter((f) => f.id !== id)); setResults((p) => p.filter((r) => r.id !== id)); };
  const resetAll = () => { setFiles([]); setResults([]); };
  const formatBytes = (b) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

  const onRemoveBg = async () => {
    if (!files.length) { toast.error('Add at least one image first.'); return; }
    setProcessing(true); setResults([]); setProgressLabel('Loading AI model (first run downloads ~30MB)…');
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const out = []; let idx = 0;
      for (const f of files) {
        idx += 1; setProgressLabel(`Removing background ${idx}/${files.length}…`);
        const blob = await removeBackground(f.file);
        const url = URL.createObjectURL(blob);
        const baseName = f.name.replace(/\.[^.]+$/, '');
        out.push({ id: f.id, name: `${baseName}-no-bg.png`, url, w: f.w, h: f.h, size: blob.size, originalSize: f.originalSize });
      }
      setResults(out);
      toast.success(`Background removed from ${out.length} image${out.length > 1 ? 's' : ''}.`);
    } catch (e) { console.error(e); toast.error('Background removal failed. Try a smaller image.'); }
    finally { setProcessing(false); setProgressLabel(''); }
  };

  useEffect(() => () => results.forEach((r) => URL.revokeObjectURL(r.url)), [results]);

  return (
    <>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Process up to <span className="font-semibold text-slate-900">{MAX_FILES}</span> files.</p>
            {files.length > 0 && <button onClick={resetAll} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>}
          </div>
          {files.length === 0 ? (
            <div onClick={onSelectClick} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop} className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${dragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4"><Upload className="w-7 h-7 text-emerald-700" /></div>
              <p className="font-display text-xl font-bold text-slate-900">Drop images here or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">JPG · PNG · WEBP · BMP · GIF — up to {MAX_FILES} files</p>
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl btn-press" type="button">Select Images</Button>
              <div className="mt-6 text-xs text-slate-500 leading-relaxed max-w-md">Files are processed <span className="font-semibold text-slate-700">on your device</span>, never uploaded.</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {files.map((f) => (
                  <div key={f.id} className="relative group rounded-xl border border-stone-200 bg-stone-50 overflow-hidden">
                    <img src={f.src} alt={f.name} className="w-full h-36 object-cover" />
                    <button onClick={() => removeFile(f.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 hover:bg-white grid place-items-center shadow border border-stone-200"><X className="w-4 h-4 text-slate-700" /></button>
                    <div className="p-3 text-xs"><p className="font-semibold text-slate-900 truncate">{f.name}</p><p className="text-slate-500">{f.w}×{f.h} · {formatBytes(f.originalSize)}</p></div>
                  </div>
                ))}
              </div>
              {files.length < MAX_FILES && (<button onClick={onSelectClick} className="w-full rounded-xl border-2 border-dashed border-stone-300 hover:border-emerald-500 py-4 text-sm font-medium text-slate-600 hover:text-emerald-700 transition">+ Add more ({MAX_FILES - files.length} left)</button>)}
            </div>
          )}
          <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={onInputChange} />
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900">Remove background</h3>
          <p className="text-sm text-slate-500 mt-1">An on-device AI model detects the subject and erases everything else.</p>
          <div className="mt-5 space-y-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 grid place-items-center shrink-0"><Eraser className="w-4 h-4 text-white" /></div>
                <div><p className="text-sm font-semibold text-emerald-900">Transparent PNG output</p><p className="text-xs text-emerald-800/80 mt-0.5">Perfect for product shots, profile pictures and design work.</p></div>
              </div>
            </div>
            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4">
              <p className="text-sm font-semibold text-slate-900">How it works</p>
              <ul className="text-xs text-slate-600 mt-2 space-y-1.5"><li>• First run downloads a ~30MB AI model (one time)</li><li>• Subsequent images process in seconds</li><li>• Everything happens on your device</li></ul>
            </div>
          </div>
          <Button onClick={onRemoveBg} disabled={processing || !files.length} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {progressLabel || 'Processing…'}</span> : <span className="inline-flex items-center gap-2"><Eraser className="w-4 h-4" /> Remove Background</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your images never leave your device.</div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900">Your transparent images</h3><p className="text-sm text-slate-500">Tap download to save.</p></div>
            <Button variant="outline" onClick={resetAll} className="border-stone-300">Process another</Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r) => (
              <div key={r.id} className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50">
                <img src={r.url} alt={r.name} className="w-full h-44 object-contain bg-[conic-gradient(at_50%_50%,_#f5f5f4_25%,_#e7e5e4_25%_50%,_#f5f5f4_50%_75%,_#e7e5e4_75%)] [background-size:16px_16px]" />
                <div className="p-4">
                  <p className="font-semibold text-sm text-slate-900 truncate">{r.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.w}×{r.h} · {formatBytes(r.size)}</p>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">Background removed · PNG</p>
                  <a href={r.url} download={r.name} className="mt-3 inline-flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg py-2.5 btn-press"><Download className="w-4 h-4" /> Download</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

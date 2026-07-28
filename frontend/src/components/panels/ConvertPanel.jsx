import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Download, Loader2, RefreshCcw, Lock, Repeat } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { toast } from 'sonner';

const MAX_FILES = 6;
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/gif';
const FORMATS = [
  { key: 'png', label: 'PNG', mime: 'image/png', ext: 'png', lossy: false },
  { key: 'jpg', label: 'JPG', mime: 'image/jpeg', ext: 'jpg', lossy: true },
  { key: 'webp', label: 'WEBP', mime: 'image/webp', ext: 'webp', lossy: true },
  { key: 'avif', label: 'AVIF', mime: 'image/avif', ext: 'avif', lossy: true },
];

export default function ConvertPanel() {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState('webp');
  const [quality, setQuality] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const formatDef = FORMATS.find((f) => f.key === format);

  const handleFiles = useCallback(async (incoming) => {
    const list = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    if (!list.length) { toast.error('Please choose image files only.'); return; }
    const remaining = MAX_FILES - files.length;
    if (list.length > remaining) toast.warning(`Up to ${MAX_FILES} files at once.`);
    const accepted = list.slice(0, remaining);
    const loaded = accepted.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file: f, name: f.name, originalSize: f.size, srcType: f.type,
    }));
    setFiles((prev) => [...prev, ...loaded]);
    setResults([]);
  }, [files.length]);

  const onSelectClick = () => inputRef.current?.click();
  const onInputChange = (e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); };
  const removeFile = (id) => { setFiles((p) => p.filter((f) => f.id !== id)); setResults((p) => p.filter((r) => r.id !== id)); };
  const resetAll = () => { setFiles([]); setResults([]); };
  const formatBytes = (b) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

  const convertOne = (item) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (formatDef.key === 'jpg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.drawImage(img, 0, 0);
      const q = formatDef.lossy ? quality / 100 : undefined;
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(img.src);
        if (!blob) { reject(new Error(`Your browser can't encode ${formatDef.label}.`)); return; }
        const baseName = item.name.replace(/\.[^.]+$/, '');
        resolve({ id: item.id, name: `${baseName}.${formatDef.ext}`, url: URL.createObjectURL(blob), size: blob.size, originalSize: item.originalSize });
      }, formatDef.mime, q);
    };
    img.onerror = () => reject(new Error('Could not read image.'));
    img.src = URL.createObjectURL(item.file);
  });

  const onConvert = async () => {
    if (!files.length) { toast.error('Add at least one image first.'); return; }
    setProcessing(true); setResults([]);
    try {
      const out = [];
      for (const f of files) {
        try { out.push(await convertOne(f)); }
        catch (e) { toast.error(`${f.name}: ${e.message}`); }
      }
      setResults(out);
      if (out.length) toast.success(`Converted ${out.length} image${out.length > 1 ? 's' : ''} to ${formatDef.label}.`);
    } finally { setProcessing(false); }
  };

  useEffect(() => () => results.forEach((r) => URL.revokeObjectURL(r.url)), [results]);

  return (
    <>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Process up to <span className="font-semibold text-slate-900">{MAX_FILES}</span> files.</p>
            {files.length > 0 && (
              <button onClick={resetAll} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>
            )}
          </div>
          {files.length === 0 ? (
            <div onClick={onSelectClick} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
              className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${dragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
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
                    <button onClick={() => removeFile(f.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 hover:bg-white grid place-items-center shadow border border-stone-200 z-10"><X className="w-4 h-4 text-slate-700" /></button>
                    <div className="p-3 text-xs"><p className="font-semibold text-slate-900 truncate">{f.name}</p><p className="text-slate-500">{f.srcType.split('/')[1]?.toUpperCase()} · {formatBytes(f.originalSize)}</p></div>
                  </div>
                ))}
              </div>
              {files.length < MAX_FILES && (
                <button onClick={onSelectClick} className="w-full rounded-xl border-2 border-dashed border-stone-300 hover:border-emerald-500 py-4 text-sm font-medium text-slate-600 hover:text-emerald-700 transition">+ Add more ({MAX_FILES - files.length} left)</button>
              )}
            </div>
          )}
          <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={onInputChange} />
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900">Convert to</h3>
          <p className="text-sm text-slate-500 mt-1">Choose the output format.</p>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {FORMATS.map((f) => (
              <button key={f.key} onClick={() => setFormat(f.key)} className={`rounded-xl border px-2 py-3 text-xs font-bold transition-all ${format === f.key ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 bg-white text-slate-600 hover:border-stone-400'}`}>{f.label}</button>
            ))}
          </div>
          {format === 'avif' && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">AVIF encoding depends on your browser — if it fails, try Chrome or Edge.</p>
          )}
          {formatDef.lossy && (
            <div className="mt-6">
              <p className="text-sm text-slate-700">Quality <span className="font-bold text-emerald-700 text-lg">{quality}%</span></p>
              <Slider value={[quality]} onValueChange={(v) => setQuality(v[0])} min={10} max={100} step={5} className="mt-3" />
            </div>
          )}
          <Button onClick={onConvert} disabled={processing || !files.length} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Converting…</span> : <span className="inline-flex items-center gap-2"><Repeat className="w-4 h-4" /> Convert to {formatDef.label}</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your images never leave your device.</div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900">Your converted images</h3><p className="text-sm text-slate-500">Tap download to save.</p></div>
            <Button variant="outline" onClick={resetAll} className="border-stone-300">Convert more</Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r) => (
              <div key={r.id} className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50">
                <img src={r.url} alt={r.name} className="w-full h-44 object-contain bg-stone-100" />
                <div className="p-4">
                  <p className="font-semibold text-sm text-slate-900 truncate">{r.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatBytes(r.size)}</p>
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

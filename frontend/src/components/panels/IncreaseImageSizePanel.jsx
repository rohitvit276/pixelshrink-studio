import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Download, Loader2, RefreshCcw, Lock, ImageUpscale } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { toast } from 'sonner';
import { padJpeg, padPng, isJpeg, isPng } from '../../lib/padFile';

const MAX_FILES = 5;
const MAX_TARGET_BYTES = 100 * 1024 * 1024;
const MAX_PIXELS = 50_000_000;
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/gif';
const PRESETS = [
  { label: '20 KB', value: 20, unit: 'KB' },
  { label: '50 KB', value: 50, unit: 'KB' },
  { label: '100 KB', value: 100, unit: 'KB' },
  { label: '200 KB', value: 200, unit: 'KB' },
  { label: '500 KB', value: 500, unit: 'KB' },
  { label: '1 MB', value: 1, unit: 'MB' },
];

const formatBytes = (b) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;
const baseName = (name) => name.replace(/\.[^.]+$/, '');

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read this image.'));
    img.src = src;
  });
}

function drawToBlob(img, w, h, mime, quality) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not process this image.'))), mime, quality);
  });
}

export default function IncreaseImageSizePanel() {
  const [files, setFiles] = useState([]);
  const [mode, setMode] = useState('filesize');
  const [targetValue, setTargetValue] = useState('20');
  const [unit, setUnit] = useState('KB');
  const [scale, setScale] = useState(200);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(async (incoming) => {
    const list = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    if (!list.length) { toast.error('Please choose image files only.'); return; }
    const remaining = MAX_FILES - files.length;
    if (list.length > remaining) toast.warning(`Up to ${MAX_FILES} files at once.`);
    const loaded = [];
    for (const f of list.slice(0, remaining)) {
      const src = URL.createObjectURL(f);
      try {
        const img = await loadImage(src);
        loaded.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, file: f, src, name: f.name, w: img.naturalWidth, h: img.naturalHeight, originalSize: f.size });
      } catch {
        URL.revokeObjectURL(src);
        toast.error(`${f.name} could not be read as an image.`);
      }
    }
    setFiles((prev) => [...prev, ...loaded]);
    setResults([]);
  }, [files.length]);

  const onSelectClick = () => inputRef.current?.click();
  const onInputChange = (e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); };
  const removeFile = (id) => {
    setFiles((p) => p.filter((f) => { if (f.id === id) URL.revokeObjectURL(f.src); return f.id !== id; }));
    setResults((p) => p.filter((r) => r.id !== id));
  };
  const resetAll = () => { files.forEach((f) => URL.revokeObjectURL(f.src)); setFiles([]); setResults([]); };

  const targetBytes = Math.round((Number(targetValue) || 0) * (unit === 'MB' ? 1024 * 1024 : 1024));

  // Grow the file to the target size without touching a single pixel.
  const growFileSize = async (item) => {
    let bytes = new Uint8Array(await item.file.arrayBuffer());
    let ext = 'jpg';
    let mime = 'image/jpeg';
    if (isPng(bytes)) { ext = 'png'; mime = 'image/png'; }
    else if (!isJpeg(bytes)) {
      // WEBP, BMP and GIF are converted to lossless PNG first, then padded.
      const blob = await drawToBlob(await loadImage(item.src), item.w, item.h, 'image/png');
      bytes = new Uint8Array(await blob.arrayBuffer());
      ext = 'png'; mime = 'image/png';
    }
    if (bytes.length >= targetBytes) {
      return { id: item.id, name: item.name, skipped: true, size: bytes.length, originalSize: item.originalSize };
    }
    const out = ext === 'png' ? padPng(bytes, targetBytes) : padJpeg(bytes, targetBytes);
    const blob = new Blob([out], { type: mime });
    return { id: item.id, name: `${baseName(item.name)}-${targetValue}${unit.toLowerCase()}.${ext}`, url: URL.createObjectURL(blob), w: item.w, h: item.h, size: blob.size, originalSize: item.originalSize };
  };

  const growDimensions = async (item) => {
    const w = Math.round((item.w * scale) / 100);
    const h = Math.round((item.h * scale) / 100);
    if (w * h > MAX_PIXELS) throw new Error(`${item.name} would be too large at ${scale}% — try a smaller percentage.`);
    const isPngFile = item.file.type === 'image/png';
    const blob = await drawToBlob(await loadImage(item.src), w, h, isPngFile ? 'image/png' : 'image/jpeg', 0.95);
    return { id: item.id, name: `${baseName(item.name)}-${w}x${h}.${isPngFile ? 'png' : 'jpg'}`, url: URL.createObjectURL(blob), w, h, size: blob.size, originalSize: item.originalSize };
  };

  const onIncrease = async () => {
    if (!files.length) { toast.error('Add at least one image first.'); return; }
    if (mode === 'filesize') {
      if (targetBytes <= 0) { toast.error('Enter the file size you need.'); return; }
      if (targetBytes > MAX_TARGET_BYTES) { toast.error('Target size can be at most 100 MB.'); return; }
    }
    setProcessing(true); setResults([]);
    try {
      const out = [];
      for (const f of files) out.push(await (mode === 'filesize' ? growFileSize(f) : growDimensions(f)));
      setResults(out);
      const done = out.filter((r) => !r.skipped).length;
      if (done) toast.success(`Increased the size of ${done} image${done > 1 ? 's' : ''}.`);
      if (done < out.length) toast.warning(`${out.length - done} image${out.length - done > 1 ? 's are' : ' is'} already larger than ${targetValue} ${unit}.`);
    } catch (e) {
      console.error('[IncreaseImageSize] failed:', e);
      toast.error(e?.message || 'Something went wrong while increasing the image size.');
    } finally { setProcessing(false); }
  };

  useEffect(() => () => results.forEach((r) => r.url && URL.revokeObjectURL(r.url)), [results]);

  return (
    <>
      <div className="mb-6">
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900">Increase Image Size</h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Photo too small for an upload form? Increase image size in KB or MB to hit a minimum file size — 20 KB, 50 KB, 100 KB or anything you type — without changing how the picture looks. You can also increase image size in pixels to make the photo itself bigger.
        </p>
      </div>

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
                    <img src={f.src} alt={f.name} className="w-full h-36 object-cover" />
                    <button onClick={() => removeFile(f.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 hover:bg-white grid place-items-center shadow border border-stone-200"><X className="w-4 h-4 text-slate-700" /></button>
                    <div className="p-3 text-xs"><p className="font-semibold text-slate-900 truncate">{f.name}</p><p className="text-slate-500">{f.w}×{f.h} · {formatBytes(f.originalSize)}</p></div>
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
          <h3 className="font-display font-extrabold text-xl text-slate-900">Choose the new size</h3>
          <p className="text-sm text-slate-500 mt-1">Increase the file size, or the pixel dimensions.</p>
          <Tabs value={mode} onValueChange={setMode} className="mt-5">
            <TabsList className="grid grid-cols-2 bg-stone-100">
              <TabsTrigger value="filesize" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">File size (KB)</TabsTrigger>
              <TabsTrigger value="dimensions" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Dimensions (px)</TabsTrigger>
            </TabsList>
            <TabsContent value="filesize" className="mt-5 space-y-3">
              <div>
                <Label htmlFor="img-target" className="text-xs text-slate-500">target file size</Label>
                <div className="flex gap-2 mt-1">
                  <Input id="img-target" type="number" min="1" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="20" />
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
              <p className="text-xs text-slate-500 leading-relaxed">The image keeps its exact pixels and quality — only the file gets bigger.</p>
            </TabsContent>
            <TabsContent value="dimensions" className="mt-5">
              <p className="text-sm text-slate-700">Enlarge image to <span className="font-bold text-emerald-700 text-lg">{scale}%</span> of original.</p>
              <Slider value={[scale]} onValueChange={(v) => setScale(v[0])} min={110} max={400} step={10} className="mt-4" />
              <div className="flex justify-between text-xs text-slate-400 mt-2"><span>110%</span><span>400%</span></div>
              {files[0] && <p className="text-xs text-slate-500 mt-3">{files[0].w}×{files[0].h} → {Math.round((files[0].w * scale) / 100)}×{Math.round((files[0].h * scale) / 100)} px</p>}
            </TabsContent>
          </Tabs>
          <Button onClick={onIncrease} disabled={processing || !files.length} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Increasing…</span> : <span className="inline-flex items-center gap-2"><ImageUpscale className="w-4 h-4" /> Increase Image Size</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your images never leave your device.</div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900">Your larger images</h3><p className="text-sm text-slate-500">Tap download to save.</p></div>
            <Button variant="outline" onClick={resetAll} className="border-stone-300">Process another</Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r) => (r.skipped ? (
              <div key={r.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-sm text-slate-900 truncate">{r.name}</p>
                <p className="text-xs text-amber-800 mt-1">Already {formatBytes(r.size)} — pick a larger target size.</p>
              </div>
            ) : (
              <div key={r.id} className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50">
                <img src={r.url} alt={r.name} className="w-full h-44 object-contain bg-stone-100" />
                <div className="p-4">
                  <p className="font-semibold text-sm text-slate-900 truncate">{r.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.w}×{r.h} px</p>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">{formatBytes(r.originalSize)} → {formatBytes(r.size)}</p>
                  <a href={r.url} download={r.name} className="mt-3 inline-flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg py-2.5 btn-press"><Download className="w-4 h-4" /> Download</a>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      <div className="mt-8 grid md:grid-cols-2 gap-6 text-sm text-slate-600 leading-relaxed">
        <div>
          <h3 className="font-display font-bold text-base text-slate-900">How to increase image size in KB</h3>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Add your JPG, PNG or WEBP photo.</li>
            <li>Type the size you need — for example 20 KB, 50 KB or 100 KB.</li>
            <li>Click <span className="font-semibold text-slate-800">Increase Image Size</span> and download the larger file.</li>
          </ol>
        </div>
        <div>
          <h3 className="font-display font-bold text-base text-slate-900">When do you need a bigger image file?</h3>
          <p className="mt-2">Exam, job, visa and government application portals often reject photos and signatures below a minimum size such as 20 KB or 50 KB. This tool increases the image size to exactly what the form asks for, with no blur and no quality loss.</p>
        </div>
      </div>
    </>
  );
}

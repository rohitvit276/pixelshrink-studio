import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Download, Loader2, RefreshCcw, Lock, Scissors, Maximize2, Crop, Square } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { toast } from 'sonner';

const MAX_FILES = 3;
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/gif';

export default function ShrinkPanel() {
  const [files, setFiles] = useState([]);
  const [mode, setMode] = useState('percentage');
  const [percentage, setPercentage] = useState(50);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [keepAspect, setKeepAspect] = useState(true);
  const [fitMode, setFitMode] = useState('stretch');
  const [fitBg, setFitBg] = useState('white');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(async (incoming) => {
    const list = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    if (!list.length) { toast.error('Please choose image files only.'); return; }
    const remaining = MAX_FILES - files.length;
    if (list.length > remaining) toast.warning(`Up to ${MAX_FILES} files at once.`);
    const accepted = list.slice(0, remaining);
    const loaded = await Promise.all(
      accepted.map((f) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => resolve({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            file: f, src: reader.result, name: f.name,
            w: img.naturalWidth, h: img.naturalHeight, originalSize: f.size,
          });
          img.src = reader.result;
        };
        reader.readAsDataURL(f);
      }))
    );
    setFiles((prev) => [...prev, ...loaded]);
    setResults([]);
    if (loaded[0] && !width && !height) {
      setWidth(Math.round(loaded[0].w / 2));
      setHeight(Math.round(loaded[0].h / 2));
    }
  }, [files.length, width, height]);

  const onSelectClick = () => inputRef.current?.click();
  const onInputChange = (e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); };
  const removeFile = (id) => { setFiles((p) => p.filter((f) => f.id !== id)); setResults((p) => p.filter((r) => r.id !== id)); };
  const resetAll = () => { setFiles([]); setResults([]); setPercentage(50); setWidth(''); setHeight(''); setKeepAspect(true); setMode('percentage'); setFitMode('stretch'); };
  const onWidthChange = (val) => { setWidth(val); if (keepAspect && files[0] && val) setHeight(Math.round(Number(val) * (files[0].h / files[0].w))); };
  const onHeightChange = (val) => { setHeight(val); if (keepAspect && files[0] && val) setWidth(Math.round(Number(val) * (files[0].w / files[0].h))); };
  const formatBytes = (b) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

  const shrinkOne = (item) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let targetW, targetH;
      if (mode === 'percentage') {
        targetW = Math.max(1, Math.round((img.naturalWidth * percentage) / 100));
        targetH = Math.max(1, Math.round((img.naturalHeight * percentage) / 100));
      } else { targetW = Number(width) || img.naturalWidth; targetH = Number(height) || img.naturalHeight; }
      const canvas = document.createElement('canvas');
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      if (fitMode === 'stretch') ctx.drawImage(img, 0, 0, targetW, targetH);
      else if (fitMode === 'crop') {
        const srcRatio = img.naturalWidth / img.naturalHeight; const dstRatio = targetW / targetH;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (srcRatio > dstRatio) { sw = img.naturalHeight * dstRatio; sx = (img.naturalWidth - sw) / 2; }
        else { sh = img.naturalWidth / dstRatio; sy = (img.naturalHeight - sh) / 2; }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      } else {
        ctx.fillStyle = fitBg === 'black' ? '#000' : fitBg === 'blur' ? '#94a3b8' : '#fff';
        ctx.fillRect(0, 0, targetW, targetH);
        const srcRatio = img.naturalWidth / img.naturalHeight; const dstRatio = targetW / targetH;
        let dw = targetW, dh = targetH, dx = 0, dy = 0;
        if (srcRatio > dstRatio) { dh = targetW / srcRatio; dy = (targetH - dh) / 2; }
        else { dw = targetH * srcRatio; dx = (targetW - dw) / 2; }
        ctx.drawImage(img, dx, dy, dw, dh);
      }
      const mime = item.file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const baseName = item.name.replace(/\.[^.]+$/, '');
        const ext = mime === 'image/png' ? 'png' : 'jpg';
        resolve({ id: item.id, name: `${baseName}-shrunk.${ext}`, url, w: targetW, h: targetH, size: blob.size, originalSize: item.originalSize });
      }, mime, 0.92);
    };
    img.src = item.src;
  });

  const onShrink = async () => {
    if (!files.length) { toast.error('Add at least one image first.'); return; }
    setProcessing(true); setResults([]);
    try {
      const out = [];
      for (const f of files) { out.push(await shrinkOne(f)); }
      setResults(out);
      toast.success(`Shrunk ${out.length} image${out.length > 1 ? 's' : ''}.`);
    } catch { toast.error('Something went wrong while shrinking.'); }
    finally { setProcessing(false); }
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
          <h3 className="font-display font-extrabold text-xl text-slate-900">Define new size</h3>
          <p className="text-sm text-slate-500 mt-1">Choose how to shrink your image.</p>
          <Tabs value={mode} onValueChange={setMode} className="mt-5">
            <TabsList className="grid grid-cols-2 bg-stone-100">
              <TabsTrigger value="percentage" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Percentage (%)</TabsTrigger>
              <TabsTrigger value="dimensions" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Dimensions (px)</TabsTrigger>
            </TabsList>
            <TabsContent value="percentage" className="mt-5">
              <p className="text-sm text-slate-700">Make image <span className="font-bold text-emerald-700 text-lg">{percentage}%</span> smaller of original.</p>
              <Slider value={[percentage]} onValueChange={(v) => setPercentage(v[0])} min={5} max={100} step={5} className="mt-4" />
              <div className="flex justify-between text-xs text-slate-400 mt-2"><span>5%</span><span>50%</span><span>100%</span></div>
            </TabsContent>
            <TabsContent value="dimensions" className="mt-5 space-y-3">
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <div><Label htmlFor="w" className="text-xs text-slate-500">width</Label><Input id="w" type="number" value={width} onChange={(e) => onWidthChange(e.target.value)} placeholder="px" className="mt-1" /></div>
                <span className="text-slate-400 pb-3">×</span>
                <div><Label htmlFor="h" className="text-xs text-slate-500">height</Label><Input id="h" type="number" value={height} onChange={(e) => onHeightChange(e.target.value)} placeholder="px" className="mt-1" /></div>
              </div>
              <div className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2.5"><span className="text-sm text-slate-700">Keep aspect ratio</span><Switch checked={keepAspect} onCheckedChange={setKeepAspect} /></div>
            </TabsContent>
          </Tabs>
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900">How to achieve the size</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[{ key: 'stretch', label: 'Stretch', Icon: Maximize2 }, { key: 'crop', label: 'Auto Crop', Icon: Crop }, { key: 'fit', label: 'Fit', Icon: Square }].map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setFitMode(key)} className={`rounded-xl border px-3 py-3 text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${fitMode === key ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 bg-white text-slate-600 hover:border-stone-400'}`}><Icon className="w-4 h-4" />{label}</button>
              ))}
            </div>
            {fitMode === 'fit' && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-slate-500">Background:</span>
                {['white', 'black', 'blur'].map((b) => (<button key={b} onClick={() => setFitBg(b)} className={`text-xs px-3 py-1 rounded-full border transition ${fitBg === b ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 text-slate-600 hover:border-stone-400'}`}>{b}</button>))}
              </div>
            )}
          </div>
          <Button onClick={onShrink} disabled={processing || !files.length} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Shrinking…</span> : <span className="inline-flex items-center gap-2"><Scissors className="w-4 h-4" /> Shrink Images</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your images never leave your device.</div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900">Your shrunk images</h3><p className="text-sm text-slate-500">Tap download to save.</p></div>
            <Button variant="outline" onClick={resetAll} className="border-stone-300">Process another</Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r) => {
              const saved = Math.max(0, r.originalSize - r.size);
              const savedPct = r.originalSize ? Math.round((saved / r.originalSize) * 100) : 0;
              return (
                <div key={r.id} className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50">
                  <img src={r.url} alt={r.name} className="w-full h-44 object-contain bg-stone-100" />
                  <div className="p-4">
                    <p className="font-semibold text-sm text-slate-900 truncate">{r.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.w}×{r.h} · {formatBytes(r.size)}</p>
                    {savedPct > 0 && <p className="text-xs text-emerald-700 font-semibold mt-1">↓ {savedPct}% smaller</p>}
                    <a href={r.url} download={r.name} className="mt-3 inline-flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg py-2.5 btn-press"><Download className="w-4 h-4" /> Download</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

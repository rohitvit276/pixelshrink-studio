import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Download, Loader2, RefreshCcw, Lock, LayoutGrid } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { toast } from 'sonner';

const MAX_FILES = 9;
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/gif';
const CANVAS_WIDTH = 1080;

export default function CollagePanel() {
  const [images, setImages] = useState([]);
  const [columns, setColumns] = useState(2);
  const [gap, setGap] = useState(12);
  const [bg, setBg] = useState('#ffffff');
  const [fit, setFit] = useState('cover');
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFiles = useCallback(async (incoming) => {
    const list = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    if (!list.length) { toast.error('Please choose image files only.'); return; }
    const remaining = MAX_FILES - images.length;
    if (list.length > remaining) toast.warning(`Up to ${MAX_FILES} images at once.`);
    const accepted = list.slice(0, remaining);
    const loaded = await Promise.all(
      accepted.map((f) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => resolve({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, src: reader.result, el: img });
          img.src = reader.result;
        };
        reader.readAsDataURL(f);
      }))
    );
    setImages((prev) => {
      const next = [...prev, ...loaded];
      setColumns((c) => Math.min(Math.max(c, Math.ceil(Math.sqrt(next.length))), Math.min(next.length, 5)) || 2);
      return next;
    });
    setResultUrl(null);
  }, [images.length]);

  const onSelectClick = () => inputRef.current?.click();
  const onInputChange = (e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); };
  const removeImage = (id) => setImages((p) => p.filter((f) => f.id !== id));
  const resetAll = () => { setImages([]); setResultUrl(null); setColumns(2); };

  const render = useCallback(() => {
    if (!images.length || !canvasRef.current) return;
    const cols = Math.max(1, Math.min(columns, images.length));
    const rows = Math.ceil(images.length / cols);
    const cellSize = (CANVAS_WIDTH - gap * (cols + 1)) / cols;
    const canvasHeight = rows * cellSize + gap * (rows + 1);
    const canvas = canvasRef.current;
    canvas.width = CANVAS_WIDTH; canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    images.forEach((img, i) => {
      const row = Math.floor(i / cols); const col = i % cols;
      const x = gap + col * (cellSize + gap);
      const y = gap + row * (cellSize + gap);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, cellSize, cellSize);
      ctx.clip();
      const iw = img.el.naturalWidth; const ih = img.el.naturalHeight;
      const cellRatio = 1;
      const imgRatio = iw / ih;
      if (fit === 'cover') {
        let sw = iw, sh = ih, sx = 0, sy = 0;
        if (imgRatio > cellRatio) { sw = ih * cellRatio; sx = (iw - sw) / 2; }
        else { sh = iw / cellRatio; sy = (ih - sh) / 2; }
        ctx.drawImage(img.el, sx, sy, sw, sh, x, y, cellSize, cellSize);
      } else {
        ctx.fillStyle = bg; ctx.fillRect(x, y, cellSize, cellSize);
        let dw = cellSize, dh = cellSize, dx = x, dy = y;
        if (imgRatio > cellRatio) { dh = cellSize / imgRatio; dy = y + (cellSize - dh) / 2; }
        else { dw = cellSize * imgRatio; dx = x + (cellSize - dw) / 2; }
        ctx.drawImage(img.el, dx, dy, dw, dh);
      }
      ctx.restore();
    });
  }, [images, columns, gap, bg, fit]);

  useEffect(() => { render(); }, [render]);
  useEffect(() => () => { if (resultUrl) URL.revokeObjectURL(resultUrl); }, [resultUrl]);

  const onCreate = async () => {
    if (images.length < 2) { toast.error('Add at least 2 images.'); return; }
    setProcessing(true);
    try {
      render();
      await new Promise((resolve) => {
        canvasRef.current.toBlob((blob) => { setResultUrl(URL.createObjectURL(blob)); resolve(); }, 'image/png');
      });
      toast.success('Collage created.');
    } finally { setProcessing(false); }
  };

  const maxCols = Math.max(1, Math.min(images.length || 1, 5));

  return (
    <>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Add 2–<span className="font-semibold text-slate-900">{MAX_FILES}</span> images.</p>
            {images.length > 0 && (
              <button onClick={resetAll} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>
            )}
          </div>
          {images.length === 0 ? (
            <div onClick={onSelectClick} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
              className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${dragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4"><Upload className="w-7 h-7 text-emerald-700" /></div>
              <p className="font-display text-xl font-bold text-slate-900">Drop images here or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">JPG · PNG · WEBP · BMP · GIF — 2 to {MAX_FILES} images</p>
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl btn-press" type="button">Select Images</Button>
              <div className="mt-6 text-xs text-slate-500 leading-relaxed max-w-md">Files are processed <span className="font-semibold text-slate-700">on your device</span>, never uploaded.</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((f) => (
                  <div key={f.id} className="relative group rounded-lg border border-stone-200 bg-stone-50 overflow-hidden aspect-square">
                    <img src={f.src} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(f.id)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/95 hover:bg-white grid place-items-center shadow border border-stone-200"><X className="w-3.5 h-3.5 text-slate-700" /></button>
                  </div>
                ))}
              </div>
              {images.length < MAX_FILES && (
                <button onClick={onSelectClick} className="w-full rounded-xl border-2 border-dashed border-stone-300 hover:border-emerald-500 py-3 text-sm font-medium text-slate-600 hover:text-emerald-700 transition">+ Add more ({MAX_FILES - images.length} left)</button>
              )}
              <div className="rounded-xl border border-stone-200 bg-stone-100 overflow-hidden grid place-items-center p-2">
                <canvas ref={canvasRef} className="max-w-full max-h-[340px] w-auto h-auto rounded-lg" />
              </div>
            </div>
          )}
          <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={onInputChange} />
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900">Collage layout</h3>
          <p className="text-sm text-slate-500 mt-1">Arrange your images into a grid.</p>

          <div className="mt-5">
            <p className="text-sm text-slate-700">Columns <span className="font-bold text-emerald-700">{Math.min(columns, maxCols)}</span></p>
            <Slider value={[Math.min(columns, maxCols)]} onValueChange={(v) => setColumns(v[0])} min={1} max={maxCols} step={1} className="mt-3" />
          </div>

          <div className="mt-5">
            <p className="text-sm text-slate-700">Spacing <span className="font-bold text-emerald-700">{gap}px</span></p>
            <Slider value={[gap]} onValueChange={(v) => setGap(v[0])} min={0} max={40} step={2} className="mt-3" />
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-900 mb-2">Fit mode</p>
            <div className="grid grid-cols-2 gap-2">
              {[{ key: 'cover', label: 'Cover (crop)' }, { key: 'contain', label: 'Contain (fit)' }].map((opt) => (
                <button key={opt.key} onClick={() => setFit(opt.key)} className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${fit === opt.key ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 bg-white text-slate-600 hover:border-stone-400'}`}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <p className="text-sm text-slate-700 shrink-0">Background</p>
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-10 h-8 rounded border border-stone-200 cursor-pointer" />
          </div>

          <Button onClick={onCreate} disabled={processing || images.length < 2} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating…</span> : <span className="inline-flex items-center gap-2"><LayoutGrid className="w-4 h-4" /> Create Collage</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your images never leave your device.</div>
        </div>
      </div>

      {resultUrl && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900">Your collage</h3><p className="text-sm text-slate-500">Tap download to save.</p></div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 overflow-hidden">
            <img src={resultUrl} alt="collage" className="w-full max-h-[400px] object-contain bg-stone-100" />
            <div className="p-4">
              <a href={resultUrl} download="collage.png" className="inline-flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg py-2.5 btn-press"><Download className="w-4 h-4" /> Download</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

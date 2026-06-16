import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Upload, X, Download, Loader2, RefreshCcw, Lock, Crop as CropIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/gif';

const RATIOS = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
];

function makeCenteredCrop(w, h, aspect) {
  if (!aspect) return centerCrop(makeAspectCrop({ unit: '%', width: 80 }, w / h, w, h), w, h);
  return centerCrop(makeAspectCrop({ unit: '%', width: 80 }, aspect, w, h), w, h);
}

export default function CropPanel() {
  const [file, setFile] = useState(null);
  const [crop, setCrop] = useState();
  const [completed, setCompleted] = useState();
  const [aspect, setAspect] = useState(null);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const imgRef = useRef(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f.type.startsWith('image/')) { toast.error('Choose an image file.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => setFile({ name: f.name, src: reader.result, w: img.naturalWidth, h: img.naturalHeight, size: f.size, type: f.type });
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
    setResult(null);
  }, []);

  const onInputChange = (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };
  const onSelectClick = () => inputRef.current?.click();

  const onImageLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    setCrop(makeCenteredCrop(w, h, aspect));
  };

  const setAspectAndCrop = (a) => {
    setAspect(a);
    if (imgRef.current) {
      const { naturalWidth: w, naturalHeight: h } = imgRef.current;
      const c = makeCenteredCrop(w, h, a);
      setCrop(c);
      setCompleted({ unit: 'px', x: (c.x / 100) * w, y: (c.y / 100) * h, width: (c.width / 100) * w, height: (c.height / 100) * h });
    }
  };

  const reset = () => { setFile(null); setResult(null); setCrop(undefined); setCompleted(undefined); setAspect(null); };

  const applyCrop = async () => {
    if (!completed || !imgRef.current) { toast.error('Drag to select a crop area first.'); return; }
    setProcessing(true);
    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const cw = Math.round(completed.width * scaleX);
      const ch = Math.round(completed.height * scaleY);
      const canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, completed.x * scaleX, completed.y * scaleY, cw, ch, 0, 0, cw, ch);
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const blob = await new Promise((res) => canvas.toBlob(res, mime, 0.92));
      const url = URL.createObjectURL(blob);
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const ext = mime === 'image/png' ? 'png' : 'jpg';
      setResult({ url, name: `${baseName}-cropped.${ext}`, w: cw, h: ch, size: blob.size });
      toast.success('Crop ready to download.');
    } catch (e) { console.error(e); toast.error('Crop failed.'); }
    finally { setProcessing(false); }
  };

  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);
  const formatBytes = (b) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Choose one image to crop.</p>
            {file && (<button onClick={reset} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>)}
          </div>
          {!file ? (
            <div onClick={onSelectClick} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop} className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${dragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4"><Upload className="w-7 h-7 text-emerald-700" /></div>
              <p className="font-display text-xl font-bold text-slate-900">Drop an image to crop</p>
              <p className="text-slate-500 text-sm mt-1">JPG · PNG · WEBP · BMP · GIF</p>
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl btn-press" type="button">Select Image</Button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ReactCrop crop={crop} onChange={(_, p) => setCrop(p)} onComplete={(c) => setCompleted(c)} aspect={aspect || undefined} className="max-h-[480px]">
                <img ref={imgRef} src={file.src} onLoad={onImageLoad} alt={file.name} className="max-h-[480px] w-auto" />
              </ReactCrop>
              <p className="mt-3 text-xs text-slate-500">Drag the corners to refine. Original: {file.w}×{file.h} · {formatBytes(file.size)}</p>
            </div>
          )}
          <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={onInputChange} />
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900">Aspect ratio</h3>
          <p className="text-sm text-slate-500 mt-1">Lock the crop to a popular ratio or stay free.</p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {RATIOS.map((r) => (
              <button key={r.label} onClick={() => setAspectAndCrop(r.value)} disabled={!file} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${aspect === r.value ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 bg-white text-slate-600 hover:border-stone-400'} disabled:opacity-50 disabled:cursor-not-allowed`}>{r.label}</button>
            ))}
          </div>
          {completed && (
            <div className="mt-5 rounded-xl bg-stone-50 border border-stone-200 p-4 text-sm">
              <p className="font-semibold text-slate-900">Selection</p>
              <p className="text-slate-600 mt-1">{Math.round(completed.width)}×{Math.round(completed.height)} px @ ({Math.round(completed.x)}, {Math.round(completed.y)})</p>
            </div>
          )}
          <Button onClick={applyCrop} disabled={processing || !file} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Cropping…</span> : <span className="inline-flex items-center gap-2"><CropIcon className="w-4 h-4" /> Apply Crop</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your image never leaves your device.</div>
        </div>
      </div>

      {result && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900">Your cropped image</h3><p className="text-sm text-slate-500">Tap download to save.</p></div>
            <Button variant="outline" onClick={reset} className="border-stone-300">Crop another</Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50">
              <img src={result.url} alt={result.name} className="w-full max-h-80 object-contain bg-stone-100" />
              <div className="p-4">
                <p className="font-semibold text-sm text-slate-900 truncate">{result.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{result.w}×{result.h} · {formatBytes(result.size)}</p>
                <a href={result.url} download={result.name} className="mt-3 inline-flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg py-2.5 btn-press"><Download className="w-4 h-4" /> Download</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

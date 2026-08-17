import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Download, Loader2, RefreshCcw, Lock, ArrowUp, ArrowDown, FileDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { downloadBlob } from '../../lib/download';

const MAX_IMAGES = 30;
const MAX_DIMENSION = 2000; // cap longest side so PDFs stay a sane size

function formatBytes(b) {
  return b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function isImage(f) {
  return f.type.startsWith('image/');
}

// Loads a File into a flattened (white background), size-capped JPEG canvas.
// Returns pixel dimensions alongside the data URL, which jsPDF uses directly as the page size.
function loadImageForPdf(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      const longest = Math.max(w, h);
      if (longest > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / longest;
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.92), width: w, height: h });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
    img.src = url;
  });
}

export default function ImageToPdfPanel() {
  const [images, setImages] = useState([]);
  const [combineIntoOne, setCombineIntoOne] = useState(true);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const addImages = useCallback((incoming) => {
    const list = Array.from(incoming).filter(isImage);
    if (!list.length) { toast.error('Please choose image files only.'); return; }
    setImages((prev) => {
      const remaining = MAX_IMAGES - prev.length;
      if (list.length > remaining) toast.warning(`Up to ${MAX_IMAGES} images at once.`);
      const accepted = list.slice(0, remaining).map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file: f,
        name: f.name,
        size: f.size,
        previewUrl: URL.createObjectURL(f),
      }));
      return [...prev, ...accepted];
    });
  }, []);

  const onSelectClick = () => inputRef.current?.click();
  const onInputChange = (e) => { if (e.target.files?.length) addImages(e.target.files); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) addImages(e.dataTransfer.files); };
  const removeImage = (id) => setImages((prev) => prev.filter((f) => f.id !== id));
  const moveImage = (id, dir) => {
    setImages((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  };
  const reset = () => {
    images.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setImages([]);
  };

  const convert = async () => {
    if (!images.length) { toast.error('Add at least one image first.'); return; }
    setConverting(true);
    try {
      const { jsPDF } = await import('jspdf');

      if (combineIntoOne) {
        setProgress(`Rendering image 1 of ${images.length}…`);
        let pdf = null;
        for (let i = 0; i < images.length; i += 1) {
          setProgress(`Rendering image ${i + 1} of ${images.length}…`);
          const { dataUrl, width, height } = await loadImageForPdf(images[i].file);
          if (!pdf) {
            pdf = new jsPDF({ unit: 'px', format: [width, height] });
          } else {
            pdf.addPage([width, height]);
          }
          pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height);
        }
        const blob = pdf.output('blob');
        const name = images.length === 1
          ? `${images[0].name.replace(/\.[^.]+$/, '')}.pdf`
          : 'images.pdf';
        const ok = downloadBlob(blob, name);
        if (!ok) toast.error('Download blocked by browser.');
        else toast.success(`Combined ${images.length} image${images.length > 1 ? 's' : ''} into one PDF.`);
      } else if (images.length === 1) {
        setProgress('Rendering…');
        const { dataUrl, width, height } = await loadImageForPdf(images[0].file);
        const pdf = new jsPDF({ unit: 'px', format: [width, height] });
        pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height);
        const blob = pdf.output('blob');
        const name = `${images[0].name.replace(/\.[^.]+$/, '')}.pdf`;
        const ok = downloadBlob(blob, name);
        if (!ok) toast.error('Download blocked by browser.');
        else toast.success('Generated 1 PDF.');
      } else {
        const JSZipMod = await import('jszip');
        const JSZip = JSZipMod.default;
        const zip = new JSZip();
        for (let i = 0; i < images.length; i += 1) {
          setProgress(`Converting image ${i + 1} of ${images.length}…`);
          const { dataUrl, width, height } = await loadImageForPdf(images[i].file);
          const pdf = new jsPDF({ unit: 'px', format: [width, height] });
          pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height);
          const bytes = pdf.output('arraybuffer');
          const base = images[i].name.replace(/\.[^.]+$/, '') || `image-${i + 1}`;
          zip.file(`${base}.pdf`, bytes);
        }
        setProgress('Zipping…');
        const blob = await zip.generateAsync({ type: 'blob' });
        const ok = downloadBlob(blob, 'images-as-pdfs.zip');
        if (!ok) toast.error('Download blocked by browser.');
        else toast.success(`Generated ${images.length} separate PDFs.`);
      }
    } catch (e) {
      console.error('[ImageToPdf] conversion failed:', e);
      toast.error(`Conversion failed: ${e?.message || 'unknown error'}`);
    } finally {
      setConverting(false);
      setProgress('');
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-600">Upload up to <span className="font-semibold text-slate-900">{MAX_IMAGES}</span> images, in the order you want them in the PDF.</p>
          {images.length > 0 && (<button onClick={reset} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>)}
        </div>
        {images.length === 0 ? (
          <div onClick={onSelectClick} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${dragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4"><Upload className="w-7 h-7 text-emerald-700" /></div>
            <p className="font-display text-xl font-bold text-slate-900">Drop images here or click to browse</p>
            <p className="text-slate-500 text-sm mt-1">JPG, PNG, WEBP and more · up to {MAX_IMAGES} files</p>
            <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl btn-press" type="button">Select images</Button>
            <div className="mt-6 text-xs text-slate-500 leading-relaxed max-w-md">Files are processed <span className="font-semibold text-slate-700">on your device</span>, never uploaded.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {images.map((f, i) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold grid place-items-center shrink-0">{i + 1}</span>
                <div className="w-9 h-9 rounded-lg bg-stone-100 overflow-hidden shrink-0"><img src={f.previewUrl} alt={f.name} className="w-full h-full object-cover" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-900 truncate">{f.name}</p><p className="text-xs text-slate-500">{formatBytes(f.size)}</p></div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => moveImage(f.id, -1)} disabled={i === 0} className="w-7 h-7 rounded-md hover:bg-stone-200 grid place-items-center disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5 text-slate-600" /></button>
                  <button onClick={() => moveImage(f.id, 1)} disabled={i === images.length - 1} className="w-7 h-7 rounded-md hover:bg-stone-200 grid place-items-center disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5 text-slate-600" /></button>
                  <button onClick={() => removeImage(f.id)} className="w-7 h-7 rounded-md hover:bg-stone-200 grid place-items-center"><X className="w-3.5 h-3.5 text-slate-600" /></button>
                </div>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button onClick={onSelectClick} className="w-full rounded-xl border-2 border-dashed border-stone-300 hover:border-emerald-500 py-3 text-sm font-medium text-slate-600 hover:text-emerald-700 transition">+ Add more ({MAX_IMAGES - images.length} left)</button>
            )}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={onInputChange} />
      </div>

      <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
        <h3 className="font-display font-extrabold text-xl text-slate-900">Convert to PDF</h3>
        <p className="text-sm text-slate-500 mt-1">Each page matches its image's own size, so nothing gets cropped or stretched.</p>

        <div className="mt-5 flex items-center gap-2.5">
          <Checkbox id="combine" checked={combineIntoOne} onCheckedChange={(v) => setCombineIntoOne(!!v)} />
          <Label htmlFor="combine" className="text-sm text-slate-700 font-normal cursor-pointer">Keep all images in one single PDF file</Label>
        </div>
        <p className="text-xs text-slate-500 mt-1.5 ml-6.5">
          {combineIntoOne
            ? 'One multi-page PDF, images in the order shown on the left.'
            : `A separate PDF per image${images.length > 1 ? ' (downloaded together as a ZIP)' : ''}.`}
        </p>

        <Button onClick={convert} disabled={converting || !images.length} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
          {converting ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {progress || 'Converting…'}</span> : <span className="inline-flex items-center gap-2"><FileDown className="w-4 h-4" /> Convert to PDF</span>}
        </Button>
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your images never leave your device.</div>
      </div>
    </div>
  );
}

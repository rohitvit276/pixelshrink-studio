import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Loader2, RefreshCcw, Lock, ShieldOff, FileSearch, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { downloadBlob } from '../../lib/download';

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/tiff';

const FIELD_LABELS = [
  { key: 'Make', label: 'Camera make' },
  { key: 'Model', label: 'Camera model' },
  { key: 'LensModel', label: 'Lens' },
  { key: 'DateTimeOriginal', label: 'Date taken' },
  { key: 'ExposureTime', label: 'Exposure time', format: (v) => (v < 1 ? `1/${Math.round(1 / v)}s` : `${v}s`) },
  { key: 'FNumber', label: 'Aperture', format: (v) => `f/${v}` },
  { key: 'ISO', label: 'ISO' },
  { key: 'FocalLength', label: 'Focal length', format: (v) => `${v}mm` },
  { key: 'Flash', label: 'Flash' },
  { key: 'Orientation', label: 'Orientation' },
  { key: 'Software', label: 'Software' },
  { key: 'ImageWidth', label: 'Width', format: (v) => `${v}px` },
  { key: 'ImageHeight', label: 'Height', format: (v) => `${v}px` },
];

export default function ExifPanel() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [meta, setMeta] = useState(null);
  const [gps, setGps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stripping, setStripping] = useState(false);
  const [strippedUrl, setStrippedUrl] = useState(null);
  const [strippedBlob, setStrippedBlob] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const formatBytes = (b) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

  const handleFile = useCallback(async (f) => {
    if (!f.type.startsWith('image/')) { toast.error('Please choose an image file.'); return; }
    setFile({ file: f, name: f.name, size: f.size, type: f.type });
    setPreviewUrl(URL.createObjectURL(f));
    setStrippedUrl(null); setMeta(null); setGps(null);
    setLoading(true);
    try {
      const exifr = await import('exifr');
      const data = await exifr.parse(f, { gps: true, translateValues: true, reviveValues: true });
      if (data && Object.keys(data).length) {
        setMeta(data);
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          setGps({ lat: data.latitude, lon: data.longitude });
        }
      } else {
        setMeta({});
      }
    } catch (e) {
      console.error('[EXIF] parse failed:', e);
      setMeta({});
    } finally { setLoading(false); }
  }, []);

  const onSelectClick = () => inputRef.current?.click();
  const onInputChange = (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };
  const reset = () => { setFile(null); setMeta(null); setGps(null); setStrippedUrl(null); setStrippedBlob(null); setPreviewUrl(null); };

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => () => { if (strippedUrl) URL.revokeObjectURL(strippedUrl); }, [strippedUrl]);

  const stripMetadata = async () => {
    if (!file) return;
    setStripping(true);
    try {
      const img = new Image();
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = previewUrl; });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const outMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        setStrippedBlob(blob);
        setStrippedUrl(URL.createObjectURL(blob));
        toast.success('Metadata stripped. Ready to download.');
      }, outMime, 0.95);
    } catch (e) {
      toast.error('Could not process this image.');
    } finally { setStripping(false); }
  };

  const triggerDownload = () => {
    if (!strippedBlob) return;
    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const ok = downloadBlob(strippedBlob, `${file.name.replace(/\.[^.]+$/, '')}-clean.${ext}`);
    if (!ok) toast.error('Download blocked by browser.');
  };

  const visibleFields = meta ? FIELD_LABELS.filter((f) => meta[f.key] !== undefined && meta[f.key] !== null) : [];

  return (
    <>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Upload one image to inspect.</p>
            {file && (<button onClick={reset} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>)}
          </div>
          {!file ? (
            <div onClick={onSelectClick} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
              className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${dragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4"><Upload className="w-7 h-7 text-emerald-700" /></div>
              <p className="font-display text-xl font-bold text-slate-900">Drop an image here or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">JPG · PNG · WEBP · TIFF</p>
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl btn-press" type="button">Select Image</Button>
              <div className="mt-6 text-xs text-slate-500 leading-relaxed max-w-md">Files are processed <span className="font-semibold text-slate-700">on your device</span>, never uploaded.</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-stone-50 border border-stone-200 p-6 flex items-center gap-4">
                <img src={previewUrl} alt={file.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0"><p className="font-semibold text-slate-900 truncate">{file.name}</p><p className="text-sm text-slate-500 mt-0.5">{formatBytes(file.size)} · {file.type.split('/')[1]?.toUpperCase()}</p></div>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Reading metadata…</div>
              ) : visibleFields.length === 0 ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">No EXIF metadata found — this file is already clean.</div>
              ) : (
                <div className="rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
                  {visibleFields.map((f) => (
                    <div key={f.key} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-slate-500">{f.label}</span>
                      <span className="font-semibold text-slate-900 truncate max-w-[60%] text-right">{f.format ? f.format(meta[f.key]) : String(meta[f.key])}</span>
                    </div>
                  ))}
                  {gps && (
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm bg-amber-50/60">
                      <span className="text-amber-800 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> GPS location</span>
                      <span className="font-semibold text-amber-900">{gps.lat.toFixed(5)}, {gps.lon.toFixed(5)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={onInputChange} />
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900">Strip metadata</h3>
          <p className="text-sm text-slate-500 mt-1">Remove all EXIF data (camera info, GPS location, timestamps) and download a clean copy.</p>
          {gps && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm">
              <p className="font-semibold text-red-900 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> This photo contains your GPS location</p>
              <p className="text-red-800/90 mt-0.5 text-xs leading-relaxed">Anyone who receives the original file can see exactly where it was taken. Stripping metadata removes this.</p>
            </div>
          )}
          <Button onClick={stripMetadata} disabled={stripping || !file || loading} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {stripping ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Stripping…</span> : <span className="inline-flex items-center gap-2"><ShieldOff className="w-4 h-4" /> Strip &amp; Download Clean Copy</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your image never leaves your device.</div>
        </div>
      </div>

      {strippedUrl && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900 flex items-center gap-2"><FileSearch className="w-5 h-5 text-emerald-600" /> Clean copy ready</h3><p className="text-sm text-slate-500">All metadata removed.</p></div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 flex items-center gap-4 flex-wrap">
            <img src={strippedUrl} alt="clean" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div className="flex-1 min-w-0"><p className="font-semibold text-slate-900">Metadata removed</p><p className="text-sm text-slate-500 mt-0.5">Camera info, GPS and timestamps stripped.</p></div>
            <button onClick={triggerDownload} className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg px-5 py-2.5 btn-press"><Download className="w-4 h-4" /> Download</button>
          </div>
        </div>
      )}
    </>
  );
}

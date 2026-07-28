import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, X, Download, Loader2, RefreshCcw, Lock, FileStack, File as FileIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { toast } from 'sonner';
import { downloadBlob } from '../../lib/download';

const MAX_FILES = 50;

export default function BatchRenamePanel() {
  const [files, setFiles] = useState([]);
  const [pattern, setPattern] = useState('{name}-{n}');
  const [startNum, setStartNum] = useState(1);
  const [padding, setPadding] = useState(2);
  const [zipping, setZipping] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback((incoming) => {
    const list = Array.from(incoming);
    if (!list.length) return;
    const remaining = MAX_FILES - files.length;
    if (list.length > remaining) toast.warning(`Up to ${MAX_FILES} files at once.`);
    const accepted = list.slice(0, remaining).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file: f, name: f.name, size: f.size,
    }));
    setFiles((prev) => [...prev, ...accepted]);
  }, [files.length]);

  const onSelectClick = () => inputRef.current?.click();
  const onInputChange = (e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); };
  const removeFile = (id) => setFiles((p) => p.filter((f) => f.id !== id));
  const resetAll = () => setFiles([]);
  const formatBytes = (b) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

  const splitExt = (name) => {
    const m = name.match(/^(.*)\.([^.]+)$/);
    return m ? { base: m[1], ext: m[2] } : { base: name, ext: '' };
  };

  const renamed = useMemo(() => {
    const usedNames = new Map();
    return files.map((f, idx) => {
      const { base, ext } = splitExt(f.name);
      const num = String(startNum + idx).padStart(padding, '0');
      let newBase = pattern.replace(/\{n\}/g, num).replace(/\{name\}/g, base).trim() || base;
      let candidate = ext ? `${newBase}.${ext}` : newBase;
      const seen = usedNames.get(candidate) || 0;
      if (seen > 0) candidate = ext ? `${newBase}-${seen + 1}.${ext}` : `${newBase}-${seen + 1}`;
      usedNames.set(candidate, seen + 1);
      return { ...f, newName: candidate };
    });
  }, [files, pattern, startNum, padding]);

  const onDownloadZip = async () => {
    if (!files.length) { toast.error('Add at least one file first.'); return; }
    setZipping(true);
    try {
      const JSZipMod = await import('jszip');
      const JSZip = JSZipMod.default;
      const zip = new JSZip();
      renamed.forEach((f) => zip.file(f.newName, f.file));
      const blob = await zip.generateAsync({ type: 'blob' });
      const ok = downloadBlob(blob, 'renamed-files.zip');
      if (!ok) toast.error('Download blocked by browser.');
      else toast.success(`Zipped ${renamed.length} file${renamed.length > 1 ? 's' : ''}.`);
    } catch (e) {
      console.error('[BatchRename] zip failed:', e);
      toast.error('Could not build the zip file.');
    } finally { setZipping(false); }
  };

  return (
    <>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 md:p-5 mb-6">
        <p className="text-sm text-emerald-900 leading-relaxed">
          <span className="font-bold">What this tool does:</span> if you have a bunch of files with messy or inconsistent names — like <code className="bg-white/70 px-1 rounded">IMG_2841.jpg</code>, <code className="bg-white/70 px-1 rounded">Screenshot (14).png</code>, <code className="bg-white/70 px-1 rounded">file_final_v2.pdf</code> — this renames all of them at once using one pattern you choose, instead of you typing a new name for every single file by hand. Upload your files, set a pattern below, and download everything renamed together in one ZIP file.
        </p>
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Upload up to <span className="font-semibold text-slate-900">{MAX_FILES}</span> files.</p>
            {files.length > 0 && (
              <button onClick={resetAll} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>
            )}
          </div>
          {files.length === 0 ? (
            <div onClick={onSelectClick} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
              className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${dragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4"><Upload className="w-7 h-7 text-emerald-700" /></div>
              <p className="font-display text-xl font-bold text-slate-900">Drop files here or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">Any file type — up to {MAX_FILES} files</p>
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl btn-press" type="button">Select Files</Button>
              <div className="mt-6 text-xs text-slate-500 leading-relaxed max-w-md">Files are processed <span className="font-semibold text-slate-700">on your device</span>, never uploaded.</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {renamed.map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 grid place-items-center shrink-0"><FileIcon className="w-4 h-4 text-slate-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 truncate">{f.name}</p>
                    <p className="text-sm font-semibold text-emerald-800 truncate">{f.newName}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{formatBytes(f.size)}</span>
                  <button onClick={() => removeFile(f.id)} className="w-6 h-6 rounded-full hover:bg-stone-200 grid place-items-center shrink-0"><X className="w-3.5 h-3.5 text-slate-500" /></button>
                </div>
              ))}
              {files.length < MAX_FILES && (
                <button onClick={onSelectClick} className="w-full rounded-xl border-2 border-dashed border-stone-300 hover:border-emerald-500 py-3 text-sm font-medium text-slate-600 hover:text-emerald-700 transition">+ Add more ({MAX_FILES - files.length} left)</button>
              )}
            </div>
          )}
          <input ref={inputRef} type="file" multiple hidden onChange={onInputChange} />
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900">Choose a naming pattern</h3>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Type how you want the new names to look. Wherever you write <code className="bg-stone-100 px-1 rounded font-semibold text-slate-700">{'{n}'}</code>, it's replaced with a number that counts up (1, 2, 3…) so every file gets its own name. Wherever you write <code className="bg-stone-100 px-1 rounded font-semibold text-slate-700">{'{name}'}</code>, it's replaced with that file's original name.
          </p>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Example: the pattern <span className="font-mono text-slate-600">vacation-{'{n}'}</span> turns <span className="font-mono text-slate-600">photo1.jpg</span> and <span className="font-mono text-slate-600">photo2.jpg</span> into <span className="font-mono text-slate-600">vacation-1.jpg</span> and <span className="font-mono text-slate-600">vacation-2.jpg</span>.
          </p>
          <div className="mt-4">
            <Label htmlFor="pattern" className="text-xs text-slate-500">Pattern</Label>
            <Input id="pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="{name}-{n}" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <Label htmlFor="start" className="text-xs text-slate-500">Start counting from</Label>
              <Input id="start" type="number" min={0} value={startNum} onChange={(e) => setStartNum(Math.max(0, Number(e.target.value) || 0))} className="mt-1" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Number length <span className="font-bold text-emerald-700">{padding}</span> <span className="text-slate-400 font-normal">(e.g. {String(1).padStart(padding, '0')}, {String(2).padStart(padding, '0')})</span></p>
              <Slider value={[padding]} onValueChange={(v) => setPadding(v[0])} min={1} max={5} step={1} className="mt-3" />
            </div>
          </div>
          {files.length > 0 && (
            <div className="mt-4 rounded-xl bg-stone-50 border border-stone-200 p-3 text-xs text-slate-500">
              Preview: <span className="font-semibold text-slate-900">{renamed[0]?.newName}</span>
              {renamed.length > 1 && <> … <span className="font-semibold text-slate-900">{renamed[renamed.length - 1]?.newName}</span></>}
            </div>
          )}
          <Button onClick={onDownloadZip} disabled={zipping || !files.length} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {zipping ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Zipping…</span> : <span className="inline-flex items-center gap-2"><FileStack className="w-4 h-4" /> Download as ZIP</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your files never leave your device.</div>
        </div>
      </div>
    </>
  );
}

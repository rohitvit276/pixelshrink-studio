import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Download, Loader2, RefreshCcw, Lock, FileText, ArrowUp, ArrowDown, Combine, Scissors, FileStack } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { toast } from 'sonner';
import { downloadBlob } from '../../lib/download';

const PDF_ACCEPT = 'application/pdf,.pdf';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAX_MERGE = 15;

function formatBytes(b) {
  return b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function isPdf(f) {
  return f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
}

export default function PdfOrganizerPanel() {
  const [mode, setMode] = useState('merge');

  // Merge state
  const [mergeFiles, setMergeFiles] = useState([]);
  const [merging, setMerging] = useState(false);
  const mergeInputRef = useRef(null);
  const [mergeDragOver, setMergeDragOver] = useState(false);

  // Organize (split/reorder) state
  const [pdfFile, setPdfFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const organizeInputRef = useRef(null);
  const [organizeDragOver, setOrganizeDragOver] = useState(false);

  // --- Merge ---
  const addMergeFiles = useCallback(async (incoming) => {
    const list = Array.from(incoming).filter(isPdf);
    if (!list.length) { toast.error('Please choose PDF files only.'); return; }
    const remaining = MAX_MERGE - mergeFiles.length;
    if (list.length > remaining) toast.warning(`Up to ${MAX_MERGE} PDFs at once.`);
    const accepted = list.slice(0, remaining);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const loaded = await Promise.all(accepted.map(async (f) => {
        const buf = await f.arrayBuffer();
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, file: f, name: f.name, size: f.size, pageCount: doc.getPageCount() };
      }));
      setMergeFiles((prev) => [...prev, ...loaded]);
    } catch (e) {
      console.error('[PdfOrganizer] failed to read PDF:', e);
      toast.error('One of these files could not be read as a PDF.');
    }
  }, [mergeFiles.length]);

  const onMergeSelectClick = () => mergeInputRef.current?.click();
  const onMergeInputChange = (e) => { if (e.target.files?.length) addMergeFiles(e.target.files); e.target.value = ''; };
  const onMergeDrop = (e) => { e.preventDefault(); setMergeDragOver(false); if (e.dataTransfer.files?.length) addMergeFiles(e.dataTransfer.files); };
  const removeMergeFile = (id) => setMergeFiles((p) => p.filter((f) => f.id !== id));
  const moveMergeFile = (id, dir) => {
    setMergeFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  };
  const resetMerge = () => setMergeFiles([]);

  const onMerge = async () => {
    if (mergeFiles.length < 2) { toast.error('Add at least 2 PDFs to merge.'); return; }
    setMerging(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const outDoc = await PDFDocument.create();
      for (const f of mergeFiles) {
        const buf = await f.file.arrayBuffer();
        const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
        const copied = await outDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        copied.forEach((p) => outDoc.addPage(p));
      }
      const bytes = await outDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const ok = downloadBlob(blob, 'merged.pdf');
      if (!ok) toast.error('Download blocked by browser.');
      else toast.success(`Merged ${mergeFiles.length} PDFs.`);
    } catch (e) {
      console.error('[PdfOrganizer] merge failed:', e);
      toast.error(`Merge failed: ${e?.message || 'unknown error'}`);
    } finally { setMerging(false); }
  };

  // --- Organize (split / reorder / delete) ---
  const loadOrganizePdf = useCallback(async (f) => {
    if (!isPdf(f)) { toast.error('Please choose a PDF file.'); return; }
    setPdfFile({ file: f, name: f.name, size: f.size });
    setPages([]); setLoadingThumbs(true);
    try {
      const pdfjs = await import('pdfjs-dist/build/pdf');
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      const buf = await f.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      const total = pdf.numPages;
      const built = [];
      for (let p = 1; p <= total; p += 1) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        built.push({ origIndex: p - 1, pageNum: p, thumb: canvas.toDataURL('image/png') });
        setPages([...built]);
      }
    } catch (e) {
      console.error('[PdfOrganizer] failed to render pages:', e);
      toast.error('Could not read this PDF.');
    } finally { setLoadingThumbs(false); }
  }, []);

  const onOrganizeSelectClick = () => organizeInputRef.current?.click();
  const onOrganizeInputChange = (e) => { if (e.target.files?.[0]) loadOrganizePdf(e.target.files[0]); e.target.value = ''; };
  const onOrganizeDrop = (e) => { e.preventDefault(); setOrganizeDragOver(false); if (e.dataTransfer.files?.[0]) loadOrganizePdf(e.dataTransfer.files[0]); };
  const resetOrganize = () => { setPdfFile(null); setPages([]); };
  const deletePage = (origIndex) => setPages((p) => p.filter((pg) => pg.origIndex !== origIndex));
  const movePage = (origIndex, dir) => {
    setPages((prev) => {
      const idx = prev.findIndex((pg) => pg.origIndex === origIndex);
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  };

  const onExportPdf = async () => {
    if (!pdfFile || !pages.length) { toast.error('Nothing to export.'); return; }
    setExporting(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await pdfFile.file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const outDoc = await PDFDocument.create();
      const copied = await outDoc.copyPages(srcDoc, pages.map((p) => p.origIndex));
      copied.forEach((p) => outDoc.addPage(p));
      const bytes = await outDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const ok = downloadBlob(blob, `${pdfFile.name.replace(/\.pdf$/i, '')}-edited.pdf`);
      if (!ok) toast.error('Download blocked by browser.');
      else toast.success(`Exported ${pages.length} page${pages.length > 1 ? 's' : ''}.`);
    } catch (e) {
      console.error('[PdfOrganizer] export failed:', e);
      toast.error(`Export failed: ${e?.message || 'unknown error'}`);
    } finally { setExporting(false); }
  };

  const onSplitZip = async () => {
    if (!pdfFile || !pages.length) { toast.error('Nothing to split.'); return; }
    setSplitting(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const JSZipMod = await import('jszip');
      const JSZip = JSZipMod.default;
      const buf = await pdfFile.file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const zip = new JSZip();
      for (const p of pages) {
        const outDoc = await PDFDocument.create();
        const [copied] = await outDoc.copyPages(srcDoc, [p.origIndex]);
        outDoc.addPage(copied);
        const bytes = await outDoc.save();
        zip.file(`page-${p.pageNum}.pdf`, bytes);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const ok = downloadBlob(blob, `${pdfFile.name.replace(/\.pdf$/i, '')}-pages.zip`);
      if (!ok) toast.error('Download blocked by browser.');
      else toast.success(`Split into ${pages.length} PDF${pages.length > 1 ? 's' : ''}.`);
    } catch (e) {
      console.error('[PdfOrganizer] split failed:', e);
      toast.error(`Split failed: ${e?.message || 'unknown error'}`);
    } finally { setSplitting(false); }
  };

  return (
    <Tabs value={mode} onValueChange={setMode}>
      <TabsList className="grid grid-cols-2 bg-stone-100 max-w-md">
        <TabsTrigger value="merge" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Combine className="w-3.5 h-3.5 mr-1.5 inline" />Merge PDFs</TabsTrigger>
        <TabsTrigger value="organize" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Scissors className="w-3.5 h-3.5 mr-1.5 inline" />Split &amp; Reorder</TabsTrigger>
      </TabsList>

      <TabsContent value="merge" className="mt-6">
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-600">Upload up to <span className="font-semibold text-slate-900">{MAX_MERGE}</span> PDFs, in the order you want them combined.</p>
              {mergeFiles.length > 0 && (<button onClick={resetMerge} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>)}
            </div>
            {mergeFiles.length === 0 ? (
              <div onClick={onMergeSelectClick} onDragOver={(e) => { e.preventDefault(); setMergeDragOver(true); }} onDragLeave={() => setMergeDragOver(false)} onDrop={onMergeDrop}
                className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${mergeDragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4"><Upload className="w-7 h-7 text-emerald-700" /></div>
                <p className="font-display text-xl font-bold text-slate-900">Drop PDFs here or click to browse</p>
                <p className="text-slate-500 text-sm mt-1">Up to {MAX_MERGE} files</p>
                <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl btn-press" type="button">Select PDFs</Button>
                <div className="mt-6 text-xs text-slate-500 leading-relaxed max-w-md">Files are processed <span className="font-semibold text-slate-700">on your device</span>, never uploaded.</div>
              </div>
            ) : (
              <div className="space-y-2">
                {mergeFiles.map((f, i) => (
                  <div key={f.id} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold grid place-items-center shrink-0">{i + 1}</span>
                    <div className="w-9 h-9 rounded-lg bg-red-50 grid place-items-center shrink-0"><FileText className="w-4.5 h-4.5 text-red-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-900 truncate">{f.name}</p><p className="text-xs text-slate-500">{f.pageCount} page{f.pageCount > 1 ? 's' : ''} · {formatBytes(f.size)}</p></div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => moveMergeFile(f.id, -1)} disabled={i === 0} className="w-7 h-7 rounded-md hover:bg-stone-200 grid place-items-center disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5 text-slate-600" /></button>
                      <button onClick={() => moveMergeFile(f.id, 1)} disabled={i === mergeFiles.length - 1} className="w-7 h-7 rounded-md hover:bg-stone-200 grid place-items-center disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5 text-slate-600" /></button>
                      <button onClick={() => removeMergeFile(f.id)} className="w-7 h-7 rounded-md hover:bg-stone-200 grid place-items-center"><X className="w-3.5 h-3.5 text-slate-600" /></button>
                    </div>
                  </div>
                ))}
                {mergeFiles.length < MAX_MERGE && (
                  <button onClick={onMergeSelectClick} className="w-full rounded-xl border-2 border-dashed border-stone-300 hover:border-emerald-500 py-3 text-sm font-medium text-slate-600 hover:text-emerald-700 transition">+ Add more ({MAX_MERGE - mergeFiles.length} left)</button>
                )}
              </div>
            )}
            <input ref={mergeInputRef} type="file" accept={PDF_ACCEPT} multiple hidden onChange={onMergeInputChange} />
          </div>

          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
            <h3 className="font-display font-extrabold text-xl text-slate-900">Combine into one PDF</h3>
            <p className="text-sm text-slate-500 mt-1">Pages are merged in the order shown on the left.</p>
            <Button onClick={onMerge} disabled={merging || mergeFiles.length < 2} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
              {merging ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Merging…</span> : <span className="inline-flex items-center gap-2"><Combine className="w-4 h-4" /> Merge &amp; Download</span>}
            </Button>
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your files never leave your device.</div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="organize" className="mt-6">
        {!pdfFile ? (
          <div className="bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
            <div onClick={onOrganizeSelectClick} onDragOver={(e) => { e.preventDefault(); setOrganizeDragOver(true); }} onDragLeave={() => setOrganizeDragOver(false)} onDrop={onOrganizeDrop}
              className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${organizeDragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4"><Upload className="w-7 h-7 text-emerald-700" /></div>
              <p className="font-display text-xl font-bold text-slate-900">Drop a PDF here or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">Delete pages, reorder them, or split into separate files</p>
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl btn-press" type="button">Select PDF</Button>
              <div className="mt-6 text-xs text-slate-500 leading-relaxed max-w-md">Files are processed <span className="font-semibold text-slate-700">on your device</span>, never uploaded.</div>
            </div>
            <input ref={organizeInputRef} type="file" accept={PDF_ACCEPT} hidden onChange={onOrganizeInputChange} />
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <div>
                <p className="font-semibold text-slate-900">{pdfFile.name}</p>
                <p className="text-sm text-slate-500">{pages.length} page{pages.length !== 1 ? 's' : ''} remaining · {formatBytes(pdfFile.size)}</p>
              </div>
              <button onClick={resetOrganize} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Choose another PDF</button>
            </div>

            {loadingThumbs && pages.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-10 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Rendering pages…</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {pages.map((p, i) => (
                  <div key={p.origIndex} className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden">
                    <div className="relative bg-stone-100">
                      <img src={p.thumb} alt={`Page ${p.pageNum}`} className="w-full h-auto" />
                      <button onClick={() => deletePage(p.origIndex)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/95 hover:bg-white grid place-items-center shadow border border-stone-200"><X className="w-3.5 h-3.5 text-slate-700" /></button>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-xs font-semibold text-slate-600">Page {p.pageNum}</span>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => movePage(p.origIndex, -1)} disabled={i === 0} className="w-5 h-5 rounded hover:bg-stone-200 grid place-items-center disabled:opacity-30"><ArrowUp className="w-3 h-3 text-slate-600" /></button>
                        <button onClick={() => movePage(p.origIndex, 1)} disabled={i === pages.length - 1} className="w-5 h-5 rounded hover:bg-stone-200 grid place-items-center disabled:opacity-30"><ArrowDown className="w-3 h-3 text-slate-600" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-6">
              <Button onClick={onExportPdf} disabled={exporting || !pages.length} className="flex-1 min-w-[220px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
                {exporting ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Exporting…</span> : <span className="inline-flex items-center gap-2"><Download className="w-4 h-4" /> Export as PDF</span>}
              </Button>
              <Button onClick={onSplitZip} disabled={splitting || !pages.length} variant="outline" className="flex-1 min-w-[220px] border-stone-300 font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
                {splitting ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Splitting…</span> : <span className="inline-flex items-center gap-2"><FileStack className="w-4 h-4" /> Split Pages (ZIP)</span>}
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your file never leaves your device.</div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

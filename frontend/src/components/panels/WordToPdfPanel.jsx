import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, Loader2, RefreshCcw, Lock, FileText, FileDown, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { downloadBlob } from '../../lib/download';

export default function WordToPdfPanel() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith('.docx') && f.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      toast.error('Choose a .docx file.'); return;
    }
    setFile({ file: f, name: f.name, size: f.size });
    setResult(null);
  }, []);

  const onInputChange = (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };
  const onSelectClick = () => inputRef.current?.click();
  const reset = () => { setFile(null); setResult(null); };
  const formatBytes = (b) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

  const convert = async () => {
    if (!file) { toast.error('Choose a Word file first.'); return; }
    setProcessing(true); setResult(null); setProgress('Reading document…');
    try {
      const mammoth = (await import('mammoth/mammoth.browser')).default;
      const buf = await file.file.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });

      setProgress('Rendering pages…');
      // Create off-screen container
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:794px;padding:48px;background:#ffffff;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#111827;';
      container.innerHTML = html;
      document.body.appendChild(container);

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
      document.body.removeChild(container);

      const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'p' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      let heightLeft = imgH; let position = 0; let pageCount = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
      heightLeft -= pageH; pageCount += 1;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
        heightLeft -= pageH; pageCount += 1;
      }

      const blob = pdf.output('blob');
      const baseName = file.name.replace(/\.docx$/i, '');
      const pdfName = `${baseName}.pdf`;
      setResult({ blob, name: pdfName, size: blob.size, pages: pageCount });
      toast.success(`Generated ${pageCount}-page PDF.`);
      downloadBlob(blob, pdfName);
    } catch (e) { console.error('[Word→PDF] conversion failed:', e); toast.error(`Word to PDF failed: ${e?.message || 'unknown error'}`); }
    finally { setProcessing(false); setProgress(''); }
  };

  const triggerDownload = () => {
    if (!result) return;
    const ok = downloadBlob(result.blob, result.name);
    if (!ok) toast.error('Download blocked by browser. Try right-clicking and saving the link instead.');
  };

  return (
    <>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Upload one .docx file to convert.</p>
            {file && (<button onClick={reset} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>)}
          </div>
          {!file ? (
            <div onClick={onSelectClick} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop} className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${dragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4"><Upload className="w-7 h-7 text-emerald-700" /></div>
              <p className="font-display text-xl font-bold text-slate-900">Drop a Word file or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">Supports .docx</p>
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl btn-press" type="button">Select Word file</Button>
            </div>
          ) : (
            <div className="rounded-2xl bg-stone-50 border border-stone-200 p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-50 grid place-items-center shrink-0"><FileText className="w-7 h-7 text-blue-600" /></div>
              <div className="flex-1 min-w-0"><p className="font-semibold text-slate-900 truncate">{file.name}</p><p className="text-sm text-slate-500 mt-0.5">{formatBytes(file.size)} · DOCX</p></div>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={onInputChange} />
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900">Convert to PDF</h3>
          <p className="text-sm text-slate-500 mt-1">Standard text, headings and lists convert cleanly into a multi-page PDF.</p>
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Heads up</p>
                <p className="text-amber-800/90 mt-0.5 text-xs leading-relaxed">Heavily styled documents (custom fonts, complex tables, embedded charts) may render slightly differently. Plain text and standard formatting work best.</p>
              </div>
            </div>
          </div>
          <Button onClick={convert} disabled={processing || !file} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {progress || 'Converting…'}</span> : <span className="inline-flex items-center gap-2"><FileDown className="w-4 h-4" /> Convert to PDF</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your file never leaves your device.</div>
        </div>
      </div>

      {result && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900">Your PDF</h3><p className="text-sm text-slate-500">Open with any PDF reader.</p></div>
            <Button variant="outline" onClick={reset} className="border-stone-300">Convert another</Button>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-xl bg-red-50 grid place-items-center shrink-0"><FileText className="w-7 h-7 text-red-600" /></div>
            <div className="flex-1 min-w-0"><p className="font-semibold text-slate-900 truncate">{result.name}</p><p className="text-sm text-slate-500 mt-0.5">{result.pages} page{result.pages > 1 ? 's' : ''} · {formatBytes(result.size)}</p></div>
            <button onClick={triggerDownload} className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg px-5 py-2.5 btn-press"><Download className="w-4 h-4" /> Download</button>
          </div>
        </div>
      )}
    </>
  );
}

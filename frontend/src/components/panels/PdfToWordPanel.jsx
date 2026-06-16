import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Loader2, RefreshCcw, Lock, FileText, FileDown, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export default function PdfToWordPanel() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Choose a PDF file.'); return;
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
    if (!file) { toast.error('Choose a PDF first.'); return; }
    setProcessing(true); setResult(null); setProgress('Loading PDF engine…');
    try {
      const pdfjs = await import('pdfjs-dist/build/pdf');
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
      const buf = await file.file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      const totalPages = pdf.numPages;
      const pages = [];
      for (let p = 1; p <= totalPages; p += 1) {
        setProgress(`Extracting page ${p}/${totalPages}…`);
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        // Reconstruct paragraphs using y-coordinate grouping
        const items = content.items.filter((i) => 'str' in i);
        let lastY = null; let lineBuf = [];
        const lines = [];
        items.forEach((it) => {
          const y = Math.round(it.transform[5]);
          if (lastY === null || Math.abs(lastY - y) < 4) {
            lineBuf.push(it.str);
          } else {
            lines.push(lineBuf.join(' ').trim());
            lineBuf = [it.str];
          }
          lastY = y;
        });
        if (lineBuf.length) lines.push(lineBuf.join(' ').trim());
        pages.push(lines.filter((l) => l.length > 0));
      }

      setProgress('Building Word document…');
      const docxLib = await import('docx');
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } = docxLib;
      const children = [];
      pages.forEach((pageLines, pageIdx) => {
        if (pageIdx > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
        children.push(new Paragraph({ text: `Page ${pageIdx + 1}`, heading: HeadingLevel.HEADING_3 }));
        pageLines.forEach((line) => {
          children.push(new Paragraph({ children: [new TextRun({ text: line, size: 22 })] }));
        });
      });
      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const baseName = file.name.replace(/\.pdf$/i, '');
      setResult({ url, name: `${baseName}.docx`, size: blob.size, pages: totalPages });
      toast.success(`Converted ${totalPages} page${totalPages > 1 ? 's' : ''} to Word.`);
    } catch (e) { console.error(e); toast.error('PDF to Word conversion failed.'); }
    finally { setProcessing(false); setProgress(''); }
  };

  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  return (
    <>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Upload one PDF to convert.</p>
            {file && (<button onClick={reset} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>)}
          </div>
          {!file ? (
            <div onClick={onSelectClick} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop} className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${dragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4"><Upload className="w-7 h-7 text-emerald-700" /></div>
              <p className="font-display text-xl font-bold text-slate-900">Drop a PDF file or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">Text-based PDFs convert best</p>
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl btn-press" type="button">Select PDF</Button>
            </div>
          ) : (
            <div className="rounded-2xl bg-stone-50 border border-stone-200 p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-red-50 grid place-items-center shrink-0"><FileText className="w-7 h-7 text-red-600" /></div>
              <div className="flex-1 min-w-0"><p className="font-semibold text-slate-900 truncate">{file.name}</p><p className="text-sm text-slate-500 mt-0.5">{formatBytes(file.size)} · PDF</p></div>
            </div>
          )}
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={onInputChange} />
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900">Convert to Word</h3>
          <p className="text-sm text-slate-500 mt-1">Text from each page becomes editable paragraphs in a .docx file.</p>
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Heads up</p>
                <p className="text-amber-800/90 mt-0.5 text-xs leading-relaxed">Text extraction works great for digital PDFs. Scanned PDFs (images of text), complex tables, columns and embedded images may not transfer cleanly. For those, use a server-side OCR tool.</p>
              </div>
            </div>
          </div>
          <Button onClick={convert} disabled={processing || !file} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {progress || 'Converting…'}</span> : <span className="inline-flex items-center gap-2"><FileDown className="w-4 h-4" /> Convert to Word</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your file never leaves your device.</div>
        </div>
      </div>

      {result && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900">Your Word document</h3><p className="text-sm text-slate-500">Open in Microsoft Word, Google Docs or Pages.</p></div>
            <Button variant="outline" onClick={reset} className="border-stone-300">Convert another</Button>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-xl bg-blue-50 grid place-items-center shrink-0"><FileText className="w-7 h-7 text-blue-600" /></div>
            <div className="flex-1 min-w-0"><p className="font-semibold text-slate-900 truncate">{result.name}</p><p className="text-sm text-slate-500 mt-0.5">{result.pages} page{result.pages > 1 ? 's' : ''} · {formatBytes(result.size)}</p></div>
            <a href={result.url} download={result.name} className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg px-5 py-2.5 btn-press"><Download className="w-4 h-4" /> Download</a>
          </div>
        </div>
      )}
    </>
  );
}

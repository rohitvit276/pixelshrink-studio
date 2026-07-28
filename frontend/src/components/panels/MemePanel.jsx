import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Loader2, RefreshCcw, Lock, Laugh } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { toast } from 'sonner';

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/gif';

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines;
}

export default function MemePanel() {
  const [image, setImage] = useState(null);
  const [topText, setTopText] = useState('WHEN THE BUILD');
  const [bottomText, setBottomText] = useState('PASSES ON THE FIRST TRY');
  const [fontScale, setFontScale] = useState(10);
  const [dragOver, setDragOver] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f.type.startsWith('image/')) { toast.error('Please choose an image file.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => setImage({ file: f, name: f.name, w: img.naturalWidth, h: img.naturalHeight, el: img });
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
    setResultUrl(null);
  }, []);

  const onSelectClick = () => inputRef.current?.click();
  const onInputChange = (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };
  const resetAll = () => { setImage(null); setResultUrl(null); };

  const drawCaption = (ctx, text, w, fontSize, top) => {
    if (!text.trim()) return;
    ctx.font = `bold ${fontSize}px Impact, 'Arial Black', sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = Math.max(2, fontSize / 12);
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#fff';
    ctx.textBaseline = top ? 'top' : 'bottom';
    const lines = wrapLines(ctx, text.toUpperCase(), w * 0.9);
    const lineHeight = fontSize * 1.15;
    lines.forEach((line, i) => {
      const y = top ? (w * 0.03) + i * lineHeight : (ctx.canvas.height - w * 0.03) - (lines.length - 1 - i) * lineHeight;
      ctx.strokeText(line, w / 2, y);
      ctx.fillText(line, w / 2, y);
    });
  };

  const render = useCallback(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = image.w; canvas.height = image.h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image.el, 0, 0);
    const fontSize = Math.max(14, Math.round(image.w * (fontScale / 100)));
    drawCaption(ctx, topText, image.w, fontSize, true);
    drawCaption(ctx, bottomText, image.w, fontSize, false);
  }, [image, topText, bottomText, fontScale]);

  useEffect(() => { render(); }, [render]);
  useEffect(() => () => { if (resultUrl) URL.revokeObjectURL(resultUrl); }, [resultUrl]);

  const onGenerate = async () => {
    if (!image) { toast.error('Add an image first.'); return; }
    setProcessing(true);
    try {
      render();
      await new Promise((resolve) => {
        canvasRef.current.toBlob((blob) => {
          setResultUrl(URL.createObjectURL(blob));
          resolve();
        }, 'image/png');
      });
      toast.success('Meme ready.');
    } finally { setProcessing(false); }
  };

  return (
    <>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Upload one image to caption.</p>
            {image && (<button onClick={resetAll} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>)}
          </div>
          {!image ? (
            <div onClick={onSelectClick} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
              className={`dashed-upload rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 md:p-14 grid place-items-center text-center ${dragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4"><Upload className="w-7 h-7 text-emerald-700" /></div>
              <p className="font-display text-xl font-bold text-slate-900">Drop an image here or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">JPG · PNG · WEBP · BMP · GIF</p>
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl btn-press" type="button">Select Image</Button>
              <div className="mt-6 text-xs text-slate-500 leading-relaxed max-w-md">Files are processed <span className="font-semibold text-slate-700">on your device</span>, never uploaded.</div>
            </div>
          ) : (
            <div className="rounded-xl border border-stone-200 bg-stone-100 overflow-hidden grid place-items-center p-2">
              <canvas ref={canvasRef} className="max-w-full max-h-[420px] w-auto h-auto rounded-lg" />
            </div>
          )}
          <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={onInputChange} />
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900">Meme text</h3>
          <p className="text-sm text-slate-500 mt-1">Classic top/bottom captions.</p>
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="top-text" className="text-xs text-slate-500">Top text</Label>
              <Input id="top-text" value={topText} onChange={(e) => setTopText(e.target.value)} placeholder="TOP TEXT" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="bottom-text" className="text-xs text-slate-500">Bottom text</Label>
              <Input id="bottom-text" value={bottomText} onChange={(e) => setBottomText(e.target.value)} placeholder="BOTTOM TEXT" className="mt-1" />
            </div>
          </div>
          <div className="mt-5">
            <p className="text-sm text-slate-700">Font size <span className="font-bold text-emerald-700">{fontScale}%</span></p>
            <Slider value={[fontScale]} onValueChange={(v) => setFontScale(v[0])} min={4} max={20} step={1} className="mt-3" />
          </div>
          <Button onClick={onGenerate} disabled={processing || !image} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating…</span> : <span className="inline-flex items-center gap-2"><Laugh className="w-4 h-4" /> Generate Meme</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your image never leaves your device.</div>
        </div>
      </div>

      {resultUrl && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900">Your meme</h3><p className="text-sm text-slate-500">Tap download to save.</p></div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 overflow-hidden">
            <img src={resultUrl} alt="meme" className="w-full max-h-[400px] object-contain bg-stone-100" />
            <div className="p-4">
              <a href={resultUrl} download={`${image?.name?.replace(/\.[^.]+$/, '') || 'meme'}-meme.png`} className="inline-flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg py-2.5 btn-press"><Download className="w-4 h-4" /> Download</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

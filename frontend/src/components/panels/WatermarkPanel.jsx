import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Loader2, RefreshCcw, Lock, Stamp, Image as ImageIcon, Type } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { toast } from 'sonner';

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/gif';
const ANCHORS = [
  { key: 'top-left', label: '↖' }, { key: 'top-center', label: '↑' }, { key: 'top-right', label: '↗' },
  { key: 'middle-left', label: '←' }, { key: 'center', label: '•' }, { key: 'middle-right', label: '→' },
  { key: 'bottom-left', label: '↙' }, { key: 'bottom-center', label: '↓' }, { key: 'bottom-right', label: '↘' },
];

export default function WatermarkPanel() {
  const [image, setImage] = useState(null);
  const [logo, setLogo] = useState(null);
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('© Your Brand');
  const [fontSize, setFontSize] = useState(36);
  const [color, setColor] = useState('#ffffff');
  const [opacity, setOpacity] = useState(60);
  const [scale, setScale] = useState(20);
  const [anchor, setAnchor] = useState('bottom-right');
  const [tile, setTile] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const logoInputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f.type.startsWith('image/')) { toast.error('Please choose an image file.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => setImage({ file: f, name: f.name, src: reader.result, w: img.naturalWidth, h: img.naturalHeight, el: img });
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
    setResultUrl(null);
  }, []);

  const handleLogo = useCallback((f) => {
    if (!f.type.startsWith('image/')) { toast.error('Please choose an image file for the logo.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => setLogo({ src: reader.result, w: img.naturalWidth, h: img.naturalHeight, el: img });
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
  }, []);

  const onSelectClick = () => inputRef.current?.click();
  const onInputChange = (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };
  const onLogoSelectClick = () => logoInputRef.current?.click();
  const onLogoInputChange = (e) => { if (e.target.files?.[0]) handleLogo(e.target.files[0]); e.target.value = ''; };
  const resetAll = () => { setImage(null); setLogo(null); setResultUrl(null); };

  const anchorPoint = (anchorKey, containerW, containerH, boxW, boxH, pad) => {
    const [v, h] = anchorKey === 'center' ? ['middle', 'center'] : anchorKey.split('-');
    let x, y;
    if (h === 'left') x = pad; else if (h === 'right') x = containerW - boxW - pad; else x = (containerW - boxW) / 2;
    if (v === 'top') y = pad; else if (v === 'bottom') y = containerH - boxH - pad; else y = (containerH - boxH) / 2;
    return { x, y };
  };

  const render = useCallback(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = image.w; canvas.height = image.h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image.el, 0, 0);
    ctx.save();
    ctx.globalAlpha = opacity / 100;

    const pad = Math.max(12, Math.round(image.w * 0.02));

    if (mode === 'text' && text.trim()) {
      const size = Math.max(8, Math.round((fontSize / 100) * image.w * 0.12) || fontSize);
      ctx.font = `bold ${size}px sans-serif`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      const metrics = ctx.measureText(text);
      const boxW = metrics.width; const boxH = size * 1.2;
      if (tile) {
        const stepX = boxW + pad * 3; const stepY = boxH + pad * 3;
        for (let y = -boxH; y < image.h + boxH; y += stepY) {
          for (let x = -boxW; x < image.w + boxW; x += stepX) {
            ctx.fillText(text, x, y);
          }
        }
      } else {
        const { x, y } = anchorPoint(anchor, image.w, image.h, boxW, boxH, pad);
        ctx.fillText(text, x, y);
      }
    } else if (mode === 'logo' && logo) {
      const boxW = image.w * (scale / 100);
      const boxH = boxW * (logo.h / logo.w);
      if (tile) {
        const stepX = boxW + pad * 2; const stepY = boxH + pad * 2;
        for (let y = -boxH; y < image.h + boxH; y += stepY) {
          for (let x = -boxW; x < image.w + boxW; x += stepX) {
            ctx.drawImage(logo.el, x, y, boxW, boxH);
          }
        }
      } else {
        const { x, y } = anchorPoint(anchor, image.w, image.h, boxW, boxH, pad);
        ctx.drawImage(logo.el, x, y, boxW, boxH);
      }
    }
    ctx.restore();
  }, [image, logo, mode, text, fontSize, color, opacity, scale, anchor, tile]);

  useEffect(() => { render(); }, [render]);

  const onApply = async () => {
    if (!image) { toast.error('Add an image first.'); return; }
    if (mode === 'logo' && !logo) { toast.error('Upload a logo image first.'); return; }
    setProcessing(true);
    try {
      render();
      await new Promise((resolve) => {
        canvasRef.current.toBlob((blob) => {
          if (resultUrl) URL.revokeObjectURL(resultUrl);
          setResultUrl(URL.createObjectURL(blob));
          resolve();
        }, image.file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.95);
      });
      toast.success('Watermark applied.');
    } finally { setProcessing(false); }
  };

  useEffect(() => () => { if (resultUrl) URL.revokeObjectURL(resultUrl); }, [resultUrl]);

  return (
    <>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Upload one image to watermark.</p>
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
          <h3 className="font-display font-extrabold text-xl text-slate-900">Watermark</h3>
          <p className="text-sm text-slate-500 mt-1">Add a text or logo watermark.</p>

          <Tabs value={mode} onValueChange={setMode} className="mt-5">
            <TabsList className="grid grid-cols-2 bg-stone-100">
              <TabsTrigger value="text" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Type className="w-3.5 h-3.5 mr-1.5 inline" />Text</TabsTrigger>
              <TabsTrigger value="logo" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><ImageIcon className="w-3.5 h-3.5 mr-1.5 inline" />Logo</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-5 space-y-4">
              <div>
                <Label htmlFor="wm-text" className="text-xs text-slate-500">Watermark text</Label>
                <Input id="wm-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="© Your Brand" className="mt-1" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-xs text-slate-500 shrink-0">Color</Label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-8 rounded border border-stone-200 cursor-pointer" />
              </div>
              <div>
                <p className="text-sm text-slate-700">Size <span className="font-bold text-emerald-700">{fontSize}%</span></p>
                <Slider value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} min={5} max={100} step={5} className="mt-2" />
              </div>
            </TabsContent>
            <TabsContent value="logo" className="mt-5 space-y-4">
              {!logo ? (
                <button onClick={onLogoSelectClick} className="w-full rounded-xl border-2 border-dashed border-stone-300 hover:border-emerald-500 py-6 text-sm font-medium text-slate-600 hover:text-emerald-700 transition">+ Upload logo image</button>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <img src={logo.src} alt="logo" className="w-12 h-12 object-contain rounded bg-white border border-stone-200" />
                  <button onClick={onLogoSelectClick} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900">Change logo</button>
                </div>
              )}
              <input ref={logoInputRef} type="file" accept={ACCEPT} hidden onChange={onLogoInputChange} />
              <div>
                <p className="text-sm text-slate-700">Logo size <span className="font-bold text-emerald-700">{scale}%</span> of width</p>
                <Slider value={[scale]} onValueChange={(v) => setScale(v[0])} min={5} max={60} step={5} className="mt-2" />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-900">Opacity <span className="font-bold text-emerald-700">{opacity}%</span></p>
            <Slider value={[opacity]} onValueChange={(v) => setOpacity(v[0])} min={10} max={100} step={5} className="mt-2" />
          </div>

          <div className="mt-5 flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2.5">
            <span className="text-sm text-slate-700">Tile across image</span>
            <Switch checked={tile} onCheckedChange={setTile} />
          </div>

          {!tile && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-900 mb-2">Position</p>
              <div className="grid grid-cols-3 gap-2 max-w-[160px]">
                {ANCHORS.map((a) => (
                  <button key={a.key} onClick={() => setAnchor(a.key)} className={`aspect-square rounded-lg border text-base font-bold transition-all ${anchor === a.key ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 bg-white text-slate-500 hover:border-stone-400'}`}>{a.label}</button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={onApply} disabled={processing || !image} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60 disabled:cursor-not-allowed">
            {processing ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Applying…</span> : <span className="inline-flex items-center gap-2"><Stamp className="w-4 h-4" /> Apply Watermark</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Your images never leave your device.</div>
        </div>
      </div>

      {resultUrl && (
        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div><h3 className="font-display font-extrabold text-xl text-slate-900">Your watermarked image</h3><p className="text-sm text-slate-500">Tap download to save.</p></div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 overflow-hidden">
            <img src={resultUrl} alt="watermarked" className="w-full max-h-[400px] object-contain bg-stone-100" />
            <div className="p-4">
              <a href={resultUrl} download={`${image?.name?.replace(/\.[^.]+$/, '') || 'watermarked'}-watermarked.${image?.file?.type === 'image/png' ? 'png' : 'jpg'}`} className="inline-flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg py-2.5 btn-press"><Download className="w-4 h-4" /> Download</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

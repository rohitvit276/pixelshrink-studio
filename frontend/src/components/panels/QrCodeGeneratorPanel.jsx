import React, { useState, useCallback } from 'react';
import { QrCode, Download, Lock, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { toast } from 'sonner';
import { downloadBlob } from '../../lib/download';

export default function QrCodeGeneratorPanel() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(320);
  const [dataUrl, setDataUrl] = useState(null);
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(async () => {
    if (!text.trim()) { toast.error('Enter some text or a URL first.'); return; }
    setGenerating(true);
    try {
      const QRCode = (await import('qrcode')).default;
      const url = await QRCode.toDataURL(text, { width: size, margin: 2, errorCorrectionLevel: 'M' });
      setDataUrl(url);
    } catch (e) {
      console.error('[QRCode] generate failed:', e);
      toast.error('Could not generate a QR code for this input.');
    } finally { setGenerating(false); }
  }, [text, size]);

  const onDownload = async () => {
    if (!dataUrl) return;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ok = downloadBlob(blob, 'qrcode.png');
    if (!ok) toast.error('Download blocked by browser.');
  };

  return (
    <>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 md:p-5 mb-6">
        <p className="text-sm text-emerald-900 leading-relaxed">
          <span className="font-bold">What this tool does:</span> turns any text, URL or message into a scannable QR code, generated entirely in your browser. Download it as a PNG to print or share.
        </p>
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900 flex items-center gap-2 mb-4"><QrCode className="w-5 h-5 text-emerald-600" /> Content</h3>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter a URL, text, Wi-Fi info, anything…" className="min-h-[160px] text-sm leading-relaxed resize-y rounded-2xl border-stone-200 focus-visible:ring-emerald-500" />
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Size</span>
              <span className="font-bold text-emerald-700">{size}×{size}px</span>
            </div>
            <Slider value={[size]} onValueChange={(v) => setSize(v[0])} min={160} max={640} step={20} />
          </div>
          <Button onClick={generate} disabled={generating} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press disabled:opacity-60">
            {generating ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating…</span> : <span className="inline-flex items-center gap-2"><QrCode className="w-4 h-4" /> Generate QR Code</span>}
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Generated locally, never sent over the network.</div>
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm flex flex-col items-center justify-center text-center">
          {dataUrl ? (
            <>
              <img src={dataUrl} alt="QR code" className="rounded-xl border border-stone-200 max-w-full" />
              <Button onClick={onDownload} className="w-full mt-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl btn-press"><Download className="w-4 h-4" /> Download PNG</Button>
            </>
          ) : (
            <div className="text-sm text-slate-400 py-12">Your QR code will appear here</div>
          )}
        </div>
      </div>
    </>
  );
}

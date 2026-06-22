import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Loader2, RefreshCcw, MousePointer, Smile } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { toast } from 'sonner';
import { MOUSTACHE_STYLES, drawMoustacheOnCanvas } from '../../utils/moustaches';

const FACE_API_CDN = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
const MODELS_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/';

// Load face-api.js script from CDN once
let faceApiPromise = null;
function loadFaceApi() {
  if (faceApiPromise) return faceApiPromise;
  faceApiPromise = new Promise((resolve, reject) => {
    if (window.faceapi) { resolve(window.faceapi); return; }
    const script = document.createElement('script');
    script.src = FACE_API_CDN;
    script.onload = () => resolve(window.faceapi);
    script.onerror = () => reject(new Error('Failed to load face-api.js'));
    document.head.appendChild(script);
  });
  return faceApiPromise;
}

export default function MoustachifyPanel() {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [facePositions, setFacePositions] = useState([]); // [{x, y, width}]
  const [selectedStyle, setSelectedStyle] = useState(MOUSTACHE_STYLES[0].id);
  const [sizePercent, setSizePercent] = useState(100);
  const [dragOver, setDragOver] = useState(false);
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [clickMode, setClickMode] = useState(false); // fallback: click to place

  const canvasRef = useRef(null);
  const inputRef = useRef(null);

  const currentStyle = MOUSTACHE_STYLES.find((s) => s.id === selectedStyle) || MOUSTACHE_STYLES[0];

  // Render moustaches onto canvas whenever positions, style, or size change
  useEffect(() => {
    if (!imageSrc || !imageObj || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = imageObj.naturalWidth;
    canvas.height = imageObj.naturalHeight;
    ctx.drawImage(imageObj, 0, 0);

    if (facePositions.length === 0) return;

    const draws = facePositions.map(({ x, y, faceW }) => {
      const moustacheW = faceW * 0.55 * (sizePercent / 100);
      const moustacheH = moustacheW * 0.4;
      return drawMoustacheOnCanvas(ctx, currentStyle.svg, x, y, moustacheW, moustacheH);
    });

    Promise.all(draws).catch(() => {
      toast.error('Could not render moustache. Try a different style or re-upload the image.');
    });
  }, [imageSrc, imageObj, facePositions, currentStyle, sizePercent]);

  const runFaceDetection = useCallback(async (img) => {
    setDetecting(true);
    try {
      const faceapi = await loadFaceApi();
      setFaceApiLoaded(true);

      // Load tiny face detector + landmark models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL),
      ]);

      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
        .withFaceLandmarks(true);

      if (!detections || detections.length === 0) {
        toast.warning('No faces detected. Click on the image to place moustaches manually.');
        setClickMode(true);
        setDetecting(false);
        return;
      }

      const positions = detections.map((det) => {
        const landmarks = det.landmarks;
        const nose = landmarks.getNose();
        const mouth = landmarks.getMouth();

        // Nose tip is the last point of the nose array
        const noseTip = nose[nose.length - 1];
        // Upper lip center is roughly the first few mouth points
        const upperLipY = Math.min(...mouth.slice(0, 7).map((p) => p.y));

        const faceW = det.detection.box.width;
        const centerX = det.detection.box.x + faceW / 2;
        const moustacheY = (noseTip.y + upperLipY) / 2;

        return { x: centerX, y: moustacheY, faceW };
      });

      setFacePositions(positions);
      toast.success(`${positions.length} face${positions.length > 1 ? 's' : ''} detected! Moustache applied.`);
    } catch (err) {
      console.warn('Face detection error:', err);
      toast.warning('Face detection unavailable. Click on the image to place moustaches.');
      setClickMode(true);
    } finally {
      setDetecting(false);
    }
  }, []);

  const loadImage = useCallback((src) => {
    const img = new Image();
    img.onload = () => {
      setImageObj(img);
      setFacePositions([]);
      setClickMode(false);
      runFaceDetection(img);
    };
    img.onerror = () => toast.error('Failed to load image.');
    img.src = src;
  }, [runFaceDetection]);

  const handleFiles = useCallback((files) => {
    const file = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (!file) { toast.error('Please select an image file.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      loadImage(e.target.result);
    };
    reader.readAsDataURL(file);
  }, [loadImage]);

  const onInputChange = (e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); };

  const handleCanvasClick = (e) => {
    if (!clickMode || !canvasRef.current || !imageObj) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const estimatedFaceW = canvas.width * 0.35;
    setFacePositions((prev) => [...prev, { x, y, faceW: estimatedFaceW }]);
  };

  const reset = () => {
    setImageSrc(null);
    setImageObj(null);
    setFacePositions([]);
    setClickMode(false);
    setSizePercent(100);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'moustachified.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    toast.success('Image downloaded!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Smile className="w-6 h-6 text-emerald-600" /> Moustachify
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload a photo — faces are detected automatically and a moustache is added in seconds.
        </p>
      </div>

      {!imageSrc ? (
        /* Upload Zone */
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed cursor-pointer transition-all p-12 grid place-items-center text-center
            ${dragOver ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40'}`}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 grid place-items-center mb-4">
            <Upload className="w-7 h-7 text-emerald-700" />
          </div>
          <p className="font-display text-xl font-bold text-slate-900">Drop a photo here or click to browse</p>
          <p className="text-slate-500 text-sm mt-1">JPG · PNG · WEBP — any photo with faces</p>
          <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-5 rounded-xl" type="button">
            Select Photo
          </Button>
          <p className="mt-4 text-xs text-slate-500">Processed entirely in your browser — never uploaded.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Canvas Preview */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Preview</p>
              <button onClick={reset} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
                <RefreshCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            {detecting && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                Detecting faces…
              </div>
            )}

            {clickMode && !detecting && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
                <MousePointer className="w-4 h-4" />
                Click on the image where you want to place a moustache.
              </div>
            )}

            <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className={`w-full h-auto block ${clickMode ? 'cursor-crosshair' : 'cursor-default'}`}
                style={{ maxHeight: 520 }}
              />
            </div>

            {facePositions.length > 0 && clickMode && (
              <button
                onClick={() => setFacePositions((p) => p.slice(0, -1))}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                ↩ Undo last placement
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="lg:col-span-2 space-y-5">
            {/* Style Selector */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-3">Moustache Style</p>
              <div className="grid grid-cols-2 gap-2">
                {MOUSTACHE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`rounded-xl border px-3 py-3 text-xs font-semibold text-left transition-all
                      ${selectedStyle === style.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-stone-200 bg-white text-slate-600 hover:border-stone-400'}`}
                  >
                    <div
                      className="w-full h-10 mb-1 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: style.svg.replace('viewBox="0 0 200 80"', 'viewBox="0 0 200 80" width="100%" height="100%"') }}
                    />
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Slider */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2">
                Size — <span className="text-emerald-700">{sizePercent}%</span>
              </p>
              <Slider
                value={[sizePercent]}
                onValueChange={(v) => setSizePercent(v[0])}
                min={50}
                max={150}
                step={5}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>50%</span>
                <span>100%</span>
                <span>150%</span>
              </div>
            </div>

            {/* Download */}
            <Button
              onClick={handleDownload}
              disabled={facePositions.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" /> Download Moustachified Image
            </Button>

            <p className="text-xs text-slate-400 text-center">
              {facePositions.length === 0 ? 'Waiting for face detection…' : `${facePositions.length} moustache${facePositions.length > 1 ? 's' : ''} placed`}
            </p>
          </div>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onInputChange} />
    </div>
  );
}

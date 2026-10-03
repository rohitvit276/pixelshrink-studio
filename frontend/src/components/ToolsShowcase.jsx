import React from 'react';
import { TOOLS } from '../mock';

const TOOL_FEATURES = {
  shrink:        ['JPG, PNG, WEBP & more', 'Lossless quality', 'Instant download'],
  removebg:      ['AI-powered', 'Transparent PNG output', 'One-click removal'],
  crop:          ['Preset aspect ratios', 'Free-form cropping', 'Browser-only'],
  filters:       ['Brightness & contrast', 'Grayscale effect', 'Live preview'],
  pdf2word:      ['Text extraction', 'Editable .docx output', 'Text-based PDFs'],
  word2pdf:      ['.docx → PDF', 'Clean layout', 'Instant conversion'],
  compressvideo: ['MP4, MOV, WebM', 'Browser-based', 'Up to ~500 MB'],
  video2mp3:     ['Extract audio', 'MP3 output', 'Any video format'],
  texttoimage:   ['7+ font families', 'Social media presets', 'PNG & JPG export'],
  convert:       ['PNG, JPG, WEBP, AVIF', 'Quality control', 'Batch conversion'],
  watermark:     ['Text or logo', '9-point positioning', 'Tile mode'],
  exif:          ['View camera & GPS data', 'One-click strip', 'Privacy-first'],
  batchrename:   ['Rename many files at once', 'Auto-numbered filenames', 'Get them all in one ZIP'],
  meme:          ['Classic top/bottom text', 'Auto text wrapping', 'PNG export'],
  collage:       ['2-9 images', 'Adjustable grid', 'Cover or fit mode'],
  pdforganizer:  ['Merge multiple PDFs', 'Reorder & delete pages', 'Split to ZIP'],
  notepad:       ['Autosaves as you type', 'No account needed', 'Download as .txt'],
  jsonformatter: ['Validate & format', 'Minify JSON', 'Instant error detection'],
  passwordgen:   ['Crypto-secure random', 'Customizable length', 'Strength indicator'],
  diffchecker:   ['Word-by-word diff', 'Highlighted changes', 'Instant comparison'],
  qrcode:        ['Any text or URL', 'Adjustable size', 'Download as PNG'],
  base64:        ['Encode & decode', 'Full Unicode support', 'One-click copy'],
  mdpreview:      ['Live side-by-side preview', 'GitHub-flavored', 'Sanitized output'],
  wordcounter:   ['Words & characters', 'Sentences & paragraphs', 'Reading time estimate'],
  img2pdf:       ['Combine into one PDF', 'Or export separately', 'Preserves image size'],
  increaseimage: ['Increase size in KB or MB', 'No quality loss', 'Or enlarge in pixels'],
  increasepdf:   ['Increase size in KB or MB', 'Pages stay unchanged', 'Exact target size'],
};

export default function ToolsShowcase({ onToolSelect }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
      <div className="text-center mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">All tools</span>
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">
          Everything you need, nothing you don't.
        </h2>
        <p className="mt-4 text-slate-600 max-w-xl mx-auto">
          Pick a tool below and start working immediately — no account required.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const features = TOOL_FEATURES[tool.key] || [];
          return (
            <button
              key={tool.key}
              onClick={() => onToolSelect && onToolSelect(tool.key)}
              className="group text-left bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors grid place-items-center mb-4">
                <Icon className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-base mb-1">{tool.label}</h3>
              <p className="text-sm text-slate-500 leading-snug mb-4">{tool.sub}</p>
              <ul className="space-y-1">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </section>
  );
}

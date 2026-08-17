import React, { useState, useEffect, useRef } from 'react';
import { StickyNote, Copy, Download, Trash2, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { downloadBlob } from '../../lib/download';

const STORAGE_KEY = 'pixelshrink-notepad';

export default function PSnotepadPanel() {
  const [text, setText] = useState('');
  const saveTimer = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setText(saved);
    } catch (e) { /* localStorage unavailable */ }
  }, []);

  const onChange = (e) => {
    const value = e.target.value;
    setText(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, value); } catch (err) { /* noop */ }
    }, 300);
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  const onCopy = async () => {
    if (!text) { toast.error('Nothing to copy yet.'); return; }
    try { await navigator.clipboard.writeText(text); toast.success('Copied to clipboard.'); }
    catch (e) { toast.error('Could not copy — try selecting the text manually.'); }
  };

  const onDownload = () => {
    if (!text) { toast.error('Nothing to download yet.'); return; }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const ok = downloadBlob(blob, 'notepad.txt');
    if (!ok) toast.error('Download blocked by browser.');
  };

  const onClear = () => {
    setText('');
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
    toast.success('Cleared.');
  };

  return (
    <>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 md:p-5 mb-6">
        <p className="text-sm text-emerald-900 leading-relaxed">
          <span className="font-bold">What this tool does:</span> a quick scratchpad for notes, drafts or anything you want to jot down. It autosaves to this browser as you type, so it's still here next time you visit this page — even if you close the tab.
        </p>
      </div>
      <div className="bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-display font-extrabold text-xl text-slate-900 flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-emerald-600" /> PSnotepad
          </h3>
          <span className="text-xs text-slate-400">{words} words · {chars} characters</span>
        </div>
        <Textarea
          value={text}
          onChange={onChange}
          placeholder="Start typing… your notes autosave in this browser."
          className="min-h-[360px] text-sm leading-relaxed resize-y rounded-2xl border-stone-200 focus-visible:ring-emerald-500"
        />
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <Button onClick={onCopy} variant="outline" className="rounded-xl font-semibold"><Copy className="w-4 h-4" /> Copy</Button>
          <Button onClick={onDownload} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl btn-press"><Download className="w-4 h-4" /> Download .txt</Button>
          <Button onClick={onClear} variant="outline" className="rounded-xl font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ml-auto"><Trash2 className="w-4 h-4" /> Clear</Button>
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Stored only in this browser, never uploaded.</div>
      </div>
    </>
  );
}

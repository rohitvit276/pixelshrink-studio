import React, { useState, useEffect } from 'react';
import { FileCode2, Trash2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';

const SAMPLE = `# Heading

Some **bold** text, *italic* text, and a [link](https://example.com).

- List item one
- List item two

\`\`\`
inline code block
\`\`\`
`;

export default function MarkdownPreviewerPanel() {
  const [markdown, setMarkdown] = useState('');
  const [html, setHtml] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!markdown.trim()) { setHtml(''); return; }
      const [{ marked }, DOMPurifyMod] = await Promise.all([import('marked'), import('dompurify')]);
      const DOMPurify = DOMPurifyMod.default;
      const rawHtml = await marked.parse(markdown);
      const clean = DOMPurify.sanitize(rawHtml);
      if (!cancelled) setHtml(clean);
    })();
    return () => { cancelled = true; };
  }, [markdown]);

  const onClear = () => setMarkdown('');
  const loadSample = () => setMarkdown(SAMPLE);

  return (
    <>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 md:p-5 mb-6">
        <p className="text-sm text-emerald-900 leading-relaxed">
          <span className="font-bold">What this tool does:</span> write Markdown on the left and see the rendered result on the right, live as you type. Handy for README files, GitHub comments or any Markdown-flavored writing.
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-extrabold text-lg text-slate-900 flex items-center gap-2"><FileCode2 className="w-5 h-5 text-emerald-600" /> Markdown</h3>
            <div className="flex items-center gap-3">
              <button onClick={loadSample} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900">Load sample</button>
              {markdown && <button onClick={onClear} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Clear</button>}
            </div>
          </div>
          <Textarea value={markdown} onChange={(e) => setMarkdown(e.target.value)} placeholder="# Start typing Markdown…" className="min-h-[420px] font-mono text-xs leading-relaxed resize-y rounded-2xl border-stone-200 focus-visible:ring-emerald-500" />
        </div>

        <div className="bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-lg text-slate-900 mb-3">Preview</h3>
          {html ? (
            <div className="prose prose-sm max-w-none min-h-[420px] rounded-2xl border border-stone-200 bg-stone-50 p-5 overflow-y-auto" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <div className="min-h-[420px] rounded-2xl border-2 border-dashed border-stone-200 grid place-items-center text-sm text-slate-400">Rendered preview will appear here</div>
          )}
        </div>
      </div>
    </>
  );
}

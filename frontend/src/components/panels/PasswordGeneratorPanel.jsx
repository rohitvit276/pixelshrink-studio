import React, { useState, useCallback, useEffect } from 'react';
import { KeyRound, Copy, RefreshCcw, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { toast } from 'sonner';

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

function generatePassword(length, opts) {
  let pool = '';
  if (opts.lower) pool += SETS.lower;
  if (opts.upper) pool += SETS.upper;
  if (opts.numbers) pool += SETS.numbers;
  if (opts.symbols) pool += SETS.symbols;
  if (!pool) return '';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) out += pool[bytes[i] % pool.length];
  return out;
}

function strengthOf(length, opts) {
  const variety = [opts.lower, opts.upper, opts.numbers, opts.symbols].filter(Boolean).length;
  const score = length * variety;
  if (score < 40) return { label: 'Weak', color: 'bg-red-500', pct: 25 };
  if (score < 80) return { label: 'Okay', color: 'bg-amber-500', pct: 55 };
  if (score < 130) return { label: 'Strong', color: 'bg-emerald-500', pct: 80 };
  return { label: 'Very strong', color: 'bg-emerald-600', pct: 100 };
}

export default function PasswordGeneratorPanel() {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ lower: true, upper: true, numbers: true, symbols: true });
  const [password, setPassword] = useState('');

  const regenerate = useCallback(() => {
    const pw = generatePassword(length, opts);
    setPassword(pw);
    if (!pw) toast.error('Select at least one character type.');
  }, [length, opts]);

  useEffect(() => { regenerate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (key) => setOpts((p) => ({ ...p, [key]: !p[key] }));

  const onCopy = async () => {
    if (!password) { toast.error('Generate a password first.'); return; }
    try { await navigator.clipboard.writeText(password); toast.success('Copied to clipboard.'); }
    catch (e) { toast.error('Could not copy — try selecting the text manually.'); }
  };

  const strength = strengthOf(length, opts);

  return (
    <>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 md:p-5 mb-6">
        <p className="text-sm text-emerald-900 leading-relaxed">
          <span className="font-bold">What this tool does:</span> generates a random, secure password using your browser's cryptographic random number generator — nothing is sent anywhere. Adjust length and character types, then copy it straight to your clipboard.
        </p>
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900 flex items-center gap-2 mb-4"><KeyRound className="w-5 h-5 text-emerald-600" /> Your password</h3>
          <div className="rounded-2xl bg-stone-50 border border-stone-200 p-5 flex items-center justify-between gap-3">
            <span className="font-mono text-lg md:text-xl text-slate-900 break-all">{password || '—'}</span>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={regenerate} className="w-9 h-9 rounded-lg hover:bg-stone-200 grid place-items-center" aria-label="Regenerate"><RefreshCcw className="w-4 h-4 text-slate-600" /></button>
              <button onClick={onCopy} className="w-9 h-9 rounded-lg hover:bg-stone-200 grid place-items-center" aria-label="Copy"><Copy className="w-4 h-4 text-slate-600" /></button>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>Strength</span>
              <span className="font-semibold text-slate-700">{strength.label}</span>
            </div>
            <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: `${strength.pct}%` }} />
            </div>
          </div>
          <Button onClick={regenerate} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base rounded-xl btn-press">
            <RefreshCcw className="w-4 h-4" /> Generate new password
          </Button>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500"><Lock className="w-3.5 h-3.5" /> Generated locally, never sent over the network.</div>
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-5 md:p-7 shadow-sm">
          <h3 className="font-display font-extrabold text-xl text-slate-900">Options</h3>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Length</span>
              <span className="font-bold text-emerald-700">{length} characters</span>
            </div>
            <Slider value={[length]} onValueChange={(v) => setLength(v[0])} min={6} max={48} step={1} />
          </div>
          <div className="mt-6 space-y-3">
            {[
              { key: 'lower', label: 'Lowercase letters (a-z)' },
              { key: 'upper', label: 'Uppercase letters (A-Z)' },
              { key: 'numbers', label: 'Numbers (0-9)' },
              { key: 'symbols', label: 'Symbols (!@#$…)' },
            ].map((o) => (
              <div key={o.key} className="flex items-center gap-2.5">
                <Checkbox id={o.key} checked={opts[o.key]} onCheckedChange={() => toggle(o.key)} />
                <Label htmlFor={o.key} className="text-sm text-slate-700 font-normal cursor-pointer">{o.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

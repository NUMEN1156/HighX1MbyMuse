import { motion } from 'framer-motion';
import { Bell, CheckCircle2, Database, Loader2, MousePointerClick, Play, RefreshCw, ServerCog, Webhook } from 'lucide-react';

interface Props {
  phase: 'idle' | 'trigger' | 'loading' | 'toast' | 'reload' | 'done';
  lastSku: string | null;
  opts: { loading: boolean; toast: boolean; reload: boolean };
  onToggle: (k: 'loading' | 'toast' | 'reload') => void;
  onDemo: () => void;
  busy: boolean;
}

const STAGES = [
  { id: 'trigger', icon: <MousePointerClick size={16} />, t: 'onClick', s: 'Button feuert crawlTrigger' },
  { id: 'loading', icon: <Loader2 size={16} />, t: 'Loading', s: 'isLoading → Spinner + disabled' },
  { id: 'toast', icon: <Bell size={16} />, t: 'Toast', s: 'showAlert(success)' },
  { id: 'reload', icon: <Database size={16} />, t: 'Reload', s: 'products + price_history neu' },
  { id: 'done', icon: <CheckCircle2 size={16} />, t: 'Render', s: 'Charts malen sich neu' },
];

const ORDER = ['trigger', 'loading', 'toast', 'reload', 'done'];

export default function Pipeline({ phase, lastSku, opts, onToggle, onDemo, busy }: Props) {
  const idx = phase === 'idle' ? -1 : ORDER.indexOf(phase);
  return (
    <div className="panel panel-corner scanlines relative overflow-hidden p-5 sm:p-6">
      <div className="scan-beam" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono2 text-[11px] tracking-[0.25em] text-[#d29a5b]">TOOLJET-CANVAS // EVENT-KETTE LIVE</p>
          <h2 className="font-display mt-1 text-xl font-bold text-teal-50 sm:text-2xl">Ein Klick stößt das Backend an.</h2>
          <p className="mt-1 max-w-2xl text-[13px] text-teal-200/65">Der Crawl-Button triggert die Query <span className="font-mono2 text-teal-100">crawlTrigger</span>. Bei Erfolg feuern Toast + Reload — die UI aktualisiert sich wie von Zauberhand.{lastSku ? <span className="font-mono2 text-cyan-300"> Letzter Job: {lastSku}.</span> : ' Drücke „Demo abspielen“, um die Kette zu erleben.'}</p>
        </div>
        <button onClick={onDemo} disabled={busy} className="btn-brass flex items-center gap-2 rounded-lg px-5 py-2.5 font-mono2 text-[12px] font-bold disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} DEMO ABSPIELEN
        </button>
      </div>

      <div className="relative mt-6 grid gap-2 sm:grid-cols-5">
        <div className="absolute left-4 right-4 top-8 hidden h-0.5 bg-teal-300/10 sm:block">
          <motion.div className="h-full bg-gradient-to-r from-[#d29a5b] via-teal-300 to-emerald-300" animate={{ width: idx < 0 ? '0%' : `${((idx + 1) / 5) * 100}%` }} transition={{ duration: 0.5 }} style={{ boxShadow: '0 0 12px rgba(45,212,191,0.6)' }} />
        </div>
        {STAGES.map((s, i) => {
          const active = i === idx;
          const done = idx > i;
          return (
            <div key={s.id} className={`relative rounded-xl border p-3.5 transition ${active ? 'border-teal-300/70 bg-teal-300/[0.08]' : done ? 'border-emerald-300/40 bg-emerald-300/[0.05]' : 'border-teal-300/15 bg-black/40'}`} style={active ? { boxShadow: '0 0 24px rgba(45,212,191,0.25)' } : undefined}>
              <div className="flex items-center gap-2.5">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${active ? 'border-teal-300/60 bg-teal-300/15 text-teal-100' : done ? 'border-emerald-300/50 bg-emerald-300/10 text-emerald-200' : 'border-teal-300/20 bg-black/40 text-teal-300/50'}`}>
                  <span className={active && s.id === 'loading' ? 'animate-spin block' : ''}>{s.icon}</span>
                </span>
                <div>
                  <p className="font-mono2 text-[12px] font-bold text-teal-50">{i + 1} · {s.t}</p>
                  <p className="text-[11px] text-teal-200/60">{s.s}</p>
                </div>
              </div>
              {active && <div className="shimmer-bar mt-2.5 h-1 rounded-full bg-teal-300/20" />}
              {done && <p className="mt-2 font-mono2 text-[10px] tracking-widest text-emerald-300">✓ DONE</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 rounded-xl border border-teal-300/15 bg-black/30 p-4 md:grid-cols-3">
        {([
          { k: 'loading' as const, icon: <Loader2 size={14} />, t: 'Loading-State', s: 'Button zeigt Spinner, sperrt Doppelklicks' },
          { k: 'toast' as const, icon: <Bell size={14} />, t: 'Toast-Notice', s: 'Erfolgsmeldung unten rechts' },
          { k: 'reload' as const, icon: <RefreshCw size={14} />, t: 'Auto-Reload', s: 'Supabase-Queries laden neu' },
        ]).map((o) => (
          <label key={o.k} className="flex cursor-pointer items-center gap-3 rounded-lg border border-teal-300/10 bg-black/20 px-3 py-2.5 transition hover:border-teal-300/30">
            <button role="switch" aria-checked={opts[o.k]} onClick={(e) => { e.preventDefault(); onToggle(o.k); }} className={`relative h-5.5 w-10 shrink-0 rounded-full transition ${opts[o.k] ? 'bg-emerald-400/80' : 'bg-teal-900'}`} style={{ height: 22 }}>
              <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all ${opts[o.k] ? 'left-[20px]' : 'left-0.5'}`} />
            </button>
            <span className="flex items-center gap-1.5 font-mono2 text-[12px] font-bold text-teal-100">{o.icon} {o.t}</span>
            <span className="ml-auto hidden text-[11px] text-teal-200/50 lg:block">{opts[o.k] ? 'AN' : 'AUS'}</span>
          </label>
        ))}
        <p className="text-[11.5px] text-teal-200/50 md:col-span-3">Schalte einen Schalter aus und crawle erneut — die Kette bricht an genau dieser Stelle. So debuggst du ToolJet-Event-Handler wie ein Profi.</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono2 text-[11px] text-teal-300/50">
        <span className="flex items-center gap-1.5"><ServerCog size={13} /> queries: getProducts · getPriceHistory · crawlTrigger</span>
        <span className="hidden sm:inline">·</span>
        <span className="flex items-center gap-1.5"><Webhook size={13} /> onSuccess → toast + runQuery(reload)</span>
      </div>
    </div>
  );
}

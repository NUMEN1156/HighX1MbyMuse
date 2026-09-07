import { ScrollText, Trash2 } from 'lucide-react';
import type { LogEntry } from '../data/seed';

const COL: Record<LogEntry['kind'], string> = {
  out: 'text-[#e8b87a]',
  ok: 'text-emerald-300',
  ai: 'text-cyan-300',
  sys: 'text-teal-300/60',
};

export default function LogPanel({ logs, onClear }: { logs: LogEntry[]; onClear: () => void }) {
  return (
    <div className="panel flex h-full min-h-[280px] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-teal-300/10 px-4 py-2.5">
        <p className="flex items-center gap-1.5 font-mono2 text-[11px] tracking-[0.2em] text-teal-300/80"><ScrollText size={13} /> LIVE-LOG // TOOLJET-RUN-HISTORY</p>
        <button onClick={onClear} className="flex items-center gap-1 font-mono2 text-[10.5px] text-teal-300/50 transition hover:text-rose-300"><Trash2 size={12} /> LEEREN</button>
      </div>
      <div className="chat-scroll max-h-64 flex-1 space-y-1 overflow-y-auto p-3 font-mono2 text-[11.5px] leading-relaxed">
        {logs.length === 0 && <p className="text-teal-300/40">— noch keine Events. Starte einen Crawl. —</p>}
        {[...logs].reverse().map((l) => (
          <p key={l.id} className="rounded bg-black/30 px-2 py-1">
            <span className="text-teal-300/40">[{l.t}]</span> <span className={`font-bold ${COL[l.kind]}`}>{l.label}</span> <span className="text-teal-100/70">{l.detail}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

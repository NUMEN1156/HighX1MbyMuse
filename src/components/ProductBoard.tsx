import { motion } from 'framer-motion';
import { ArrowRight, Bell, Cpu, Loader2, MessageSquareText, MousePointerClick, Play, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { eur, type Product } from '../data/seed';

interface Props {
  products: Product[];
  crawling: Record<string, boolean>;
  globalBusy: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onCrawl: (sku: string) => void;
  onCrawlAll: () => void;
  onAnalyzeInChat: (sku: string) => void;
}

function Spark({ data, w = 104, h = 30 }: { data: number[]; w?: number; h?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 3 - ((v - min) / span) * (h - 8)}`).join(' ');
  const down = data[data.length - 1] < data[0];
  const col = down ? '#34d399' : '#e8b87a';
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${col})` }} />
      <circle cx={w} cy={parseFloat(pts.split(' ').pop()!.split(',')[1])} r="2.6" fill={col} />
    </svg>
  );
}

function BigChart({ data }: { data: number[] }) {
  const w = 620, h = 170;
  const min = Math.min(...data) * 0.985;
  const max = Math.max(...data) * 1.015;
  const X = (i: number) => (i / (data.length - 1)) * w;
  const Y = (v: number) => h - 12 - ((v - min) / (max - min)) * (h - 30);
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full">
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="rgba(94,234,212,0.12)" strokeDasharray="4 5" />
      ))}
      <path d={area} fill="url(#ag)" />
      <path d={line} fill="none" stroke="#5eead4" strokeWidth="2.2" style={{ filter: 'drop-shadow(0 0 8px rgba(45,212,191,0.7))' }} />
      {data.map((v, i) => (i % 2 === 0 || i === data.length - 1 ? (
        <g key={i}>
          <circle cx={X(i)} cy={Y(v)} r={i === data.length - 1 ? 4.5 : 2.5} fill={i === data.length - 1 ? '#e8b87a' : '#0b1819'} stroke="#5eead4" strokeWidth="1.6" />
        </g>
      ) : null))}
    </svg>
  );
}

const STATUS = {
  live: { t: 'LIVE', c: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10' },
  drop: { t: 'PREISDROP', c: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' },
  watch: { t: 'WATCH', c: 'text-amber-300 border-amber-400/40 bg-amber-400/10' },
  fresh: { t: 'FRISCH', c: 'text-teal-200 border-teal-300/40 bg-teal-300/10' },
};

export default function ProductBoard(p: Props) {
  const sel = p.products.find((x) => x.id === p.selectedId) ?? p.products[0];
  const dropPct = sel ? ((sel.prevPrice - sel.price) / sel.prevPrice) * 100 : 0;
  const steps = [
    { icon: <MousePointerClick size={15} />, t: '1 · Klick', s: 'Button onClick' },
    { icon: <Cpu size={15} />, t: '2 · Backend', s: 'crawlTrigger läuft' },
    { icon: <Bell size={15} />, t: '3 · Toast', s: 'Success-Notice' },
    { icon: <RefreshCw size={15} />, t: '4 · Reload', s: 'Supabase Queries' },
  ];
  return (
    <div className="flex flex-col gap-5">
      {/* Event-Kette */}
      <div className="panel panel-corner scanlines overflow-hidden p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono2 text-[11px] tracking-[0.25em] text-[#d29a5b]">EVENT-KETTE // EIN KLICK STÖSST DAS BACKEND AN</p>
          <button onClick={p.onCrawlAll} disabled={p.globalBusy} className="btn-brass flex items-center gap-2 rounded-lg px-4 py-2 font-mono2 text-[12px] font-bold tracking-wider disabled:opacity-50">
            {p.globalBusy ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {p.globalBusy ? 'CRAWLT …' : 'ALLE NEU CRAWLEN'}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.t} className="flex items-center gap-3 rounded-lg border border-teal-300/15 bg-black/30 px-3 py-2.5">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-teal-300/30 bg-teal-400/10 text-teal-200 ${p.globalBusy ? 'tick' : ''}`}>{s.icon}</span>
              <span>
                <span className="block font-mono2 text-[12px] font-bold text-teal-100">{s.t}</span>
                <span className="block text-[11px] text-teal-200/60">{s.s}</span>
              </span>
              {i < 3 && <ArrowRight size={14} className="ml-auto hidden text-[#d29a5b]/70 lg:block" />}
            </div>
          ))}
        </div>
        {p.globalBusy && <div className="shimmer-bar mt-3 h-1.5 rounded-full bg-teal-400/20" />}
      </div>

      {/* Tabelle */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-teal-300/10 px-4 py-3 sm:px-5">
          <p className="font-mono2 text-[11px] tracking-[0.25em] text-teal-300/80">SUPABASE · PRODUCTS // AUTO-RELOAD AKTIV</p>
          <span className="flex items-center gap-2 font-mono2 text-[11px] text-emerald-300"><span className="pulse-dot inline-block h-2 w-2 rounded-full bg-emerald-400" /> realtime</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="font-mono2 text-[10.5px] tracking-[0.18em] text-teal-300/60">
                <th className="px-4 py-2.5 sm:px-5">PRODUKT</th>
                <th className="px-3 py-2.5">PREIS</th>
                <th className="px-3 py-2.5">Δ</th>
                <th className="px-3 py-2.5">TREND · 14 CRAWLS</th>
                <th className="px-3 py-2.5">STATUS</th>
                <th className="px-4 py-2.5 text-right sm:px-5">AKTION</th>
              </tr>
            </thead>
            <tbody>
              {p.products.map((pr) => {
                const busy = !!p.crawling[pr.sku];
                const d = ((pr.price - pr.prevPrice) / pr.prevPrice) * 100;
                const active = pr.id === p.selectedId;
                return (
                  <tr key={pr.id} onClick={() => p.onSelect(pr.id)} className={`cursor-pointer border-t border-teal-300/10 transition hover:bg-teal-300/[0.04] ${active ? 'bg-teal-300/[0.06]' : ''}`}>
                    <td className="px-4 py-3 sm:px-5">
                      <p className="font-semibold text-teal-50">{pr.name}</p>
                      <p className="font-mono2 text-[11px] text-teal-300/50">{pr.sku} · {pr.shop} · {pr.lastCrawl}</p>
                    </td>
                    <td className="px-3 py-3 font-mono2 text-[14px] font-bold text-teal-100">{eur(pr.price)}</td>
                    <td className="px-3 py-3">
                      <span className={`flex items-center gap-1 font-mono2 text-[12px] font-bold ${d < 0 ? 'text-emerald-300' : d > 0 ? 'text-rose-300' : 'text-teal-300/50'}`}>
                        {d < 0 ? <TrendingDown size={14} /> : d > 0 ? <TrendingUp size={14} /> : null}
                        {d === 0 ? '±0%' : `${d > 0 ? '+' : ''}${d.toFixed(1)}%`}
                      </span>
                    </td>
                    <td className="px-3 py-3"><Spark data={pr.history} /></td>
                    <td className="px-3 py-3">
                      <span className={`rounded-md border px-2 py-1 font-mono2 text-[10px] font-bold tracking-widest ${STATUS[pr.status].c}`}>{STATUS[pr.status].t}</span>
                    </td>
                    <td className="px-4 py-3 text-right sm:px-5">
                      <button
                        onClick={(e) => { e.stopPropagation(); p.onCrawl(pr.sku); }}
                        disabled={busy || p.globalBusy}
                        className="btn-cyan inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono2 text-[11.5px] font-bold disabled:opacity-50"
                      >
                        {busy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        {busy ? 'LÄUFT' : 'CRAWLEN'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail */}
      {sel && (
        <motion.div key={sel.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel panel-corner grid gap-5 p-5 lg:grid-cols-[1fr_300px] sm:p-6">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="font-mono2 text-[11px] tracking-[0.25em] text-[#d29a5b]">FOKUS · {sel.sku}</p>
                <h3 className="font-display text-2xl font-bold text-teal-50">{sel.name}</h3>
                <p className="font-mono2 text-[11.5px] text-teal-300/60">{sel.shop} · {sel.url} · Bestand: {sel.stock} Stk.</p>
              </div>
              <div className="text-right">
                <p className="font-mono2 text-[26px] font-bold text-teal-100 glow-cyan">{eur(sel.price)}</p>
                <p className={`font-mono2 text-[12px] font-bold ${dropPct > 0 ? 'text-emerald-300' : dropPct < 0 ? 'text-rose-300' : 'text-teal-300/50'}`}>
                  {dropPct > 0 ? `−${dropPct.toFixed(1)} % Preisdrop vs. vorher` : dropPct < 0 ? `+${Math.abs(dropPct).toFixed(1)} % teurer` : 'Preis stabil'}
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-teal-300/15 bg-black/40 p-3"><BigChart data={sel.history} /></div>
          </div>
          <div className="flex flex-col gap-3">
            {sel.img ? (
              <img src={sel.img} alt={sel.name} className="deco-frame h-40 w-full rounded-lg object-cover" />
            ) : (
              <div className="deco-frame crt flex h-40 w-full items-center justify-center rounded-lg">
                <span className="font-display text-5xl text-teal-200/80 glow-cyan">Ω/Δ/Ψ</span>
              </div>
            )}
            <button onClick={() => p.onCrawl(sel.sku)} disabled={!!p.crawling[sel.sku] || p.globalBusy} className="btn-brass flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-mono2 text-[12px] font-bold disabled:opacity-50">
              {!!p.crawling[sel.sku] ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              PRODUKT JETZT NEU CRAWLEN
            </button>
            <button onClick={() => p.onAnalyzeInChat(sel.sku)} className="flex items-center justify-center gap-2 rounded-lg border border-teal-300/40 bg-teal-400/10 px-4 py-2.5 font-mono2 text-[12px] font-bold text-teal-100 transition hover:bg-teal-400/20">
              <MessageSquareText size={15} /> IM CHAT ANALYSIEREN
            </button>
            <p className="text-[11.5px] leading-relaxed text-teal-200/60">Tipp: Sag dem Bot per Sprache oder Text <span className="font-mono2 text-teal-200">„Crawle {sel.sku} jetzt neu!“</span> – er ruft das Crawl-Tool selbst auf.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

import { useCallback, useRef, useState } from 'react';
import { Activity, Bot, Cpu, Database, Gauge, MessageSquareText, PlugZap, Radio, Settings2, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import ProductBoard from './components/ProductBoard';
import DifyChat from './components/DifyChat';
import Pipeline from './components/Pipeline';
import ConfigPanel from './components/ConfigPanel';
import ArchDiagram from './components/ArchDiagram';
import LogPanel from './components/LogPanel';
import ToastStack from './components/ToastStack';
import { INITIAL_PRODUCTS, nowT, type LogEntry, type Product, type ToastMsg } from './data/seed';

type Phase = 'idle' | 'trigger' | 'loading' | 'toast' | 'reload' | 'done';

let tid = 1;
let lid = 1;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [crawling, setCrawling] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 0, t: nowT(), label: 'sys boot', detail: 'canvas bereit · supabase verbunden · dify-agent online', kind: 'sys' },
  ]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [lastSku, setLastSku] = useState<string | null>(null);
  const [opts, setOpts] = useState({ loading: true, toast: true, reload: true });
  const [selectedId, setSelectedId] = useState('A');
  const [chatSeed, setChatSeed] = useState<{ n: number; text: string } | null>(null);
  const seedN = useRef(0);
  const busyRef = useRef(false);

  const globalBusy = Object.values(crawling).some(Boolean);

  const dismiss = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  const notify = useCallback((t: Omit<ToastMsg, 'id'>) => {
    const id = ++tid;
    setToasts((p) => [...p.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 5200);
  }, []);

  const log = useCallback((e: Omit<LogEntry, 'id' | 't'>) => {
    setLogs((p) => [...p.slice(-59), { ...e, id: ++lid, t: nowT() }]);
  }, []);

  const toggleOpt = useCallback((k: 'loading' | 'toast' | 'reload') => {
    setOpts((s) => ({ ...s, [k]: !s[k] }));
  }, []);

  const doCrawl = useCallback(async (sku: string) => {
    if (busyRef.current && crawling[sku]) return;
    const snap = products.find((p) => p.sku === sku);
    if (!snap) return;
    busyRef.current = true;
    setCrawling((s) => ({ ...s, [sku]: true }));
    setLastSku(sku);
    setPhase('trigger');
    log({ label: 'click → crawlTrigger', detail: `sku=${sku} · job queued`, kind: 'out' });
    await wait(420);

    if (opts.loading) {
      setPhase('loading');
      log({ label: 'loading on', detail: 'button spinner · doppelklick gesperrt', kind: 'sys' });
      await wait(1500);
    } else {
      log({ label: 'loading AUS', detail: 'kette läuft ohne spinner — ux-lücke!', kind: 'sys' });
      await wait(500);
    }

    // neuen Preis würfeln (Bias zu Drops, damit Demo Spaß macht)
    const r = Math.random();
    let pct: number;
    if (sku === 'PROD-C' && snap.history.every((v) => v === snap.history[0])) {
      pct = -(2.5 + Math.random() * 3); // erster C-Crawl bricht die Flatline
    } else if (r < 0.62) pct = -(0.8 + Math.random() * 3.7);
    else if (r < 0.85) pct = 0.3 + Math.random() * 1.2;
    else pct = -(Math.random() * 0.4);
    const oldPrice = snap.price;
    const newPrice = Math.max(19.9, +(oldPrice * (1 + pct / 100)).toFixed(2));
    const dropPct = ((oldPrice - newPrice) / oldPrice) * 100;

    if (opts.toast) {
      setPhase('toast');
      const isDrop = dropPct >= 1;
      notify({
        title: isDrop ? `PREISDROP · ${sku}` : `CRAWL FERTIG · ${sku}`,
        msg: isDrop
          ? `${snap.name}: ${oldPrice.toFixed(2)} € → ${newPrice.toFixed(2)} € (−${dropPct.toFixed(1)} %). Queries laden neu.`
          : `${snap.name}: ${oldPrice.toFixed(2)} € → ${newPrice.toFixed(2)} €. Alles aktuell.`,
        kind: isDrop ? 'success' : 'info',
      });
      log({ label: 'toast ✓', detail: `showAlert(success) für ${sku}`, kind: 'ok' });
      await wait(750);
    } else {
      log({ label: 'toast AUS', detail: 'kein feedback — user sieht nichts!', kind: 'sys' });
      await wait(350);
    }

    if (opts.reload) {
      setPhase('reload');
      await wait(850);
      setProducts((prev) =>
        prev.map((p) => {
          if (p.sku !== sku) return p;
          const hist = [...p.history, newPrice].slice(-14);
          const dp = ((p.price - newPrice) / p.price) * 100;
          return {
            ...p,
            prevPrice: p.price,
            price: newPrice,
            history: hist,
            lastCrawl: 'jetzt',
            status: dp >= 1.2 ? 'drop' : Math.abs(dp) < 0.4 ? 'live' : dp > 0 ? 'fresh' : 'watch',
          };
        })
      );
      log({ label: 'reload ✓', detail: 'getProducts + getPriceHistory + chart neu', kind: 'ok' });
      await wait(500);
    } else {
      log({ label: 'reload AUS', detail: 'supabase neu laden übersprungen — ui veraltet!', kind: 'sys' });
      await wait(350);
    }

    setPhase('done');
    await wait(950);
    setPhase('idle');
    setCrawling((s) => ({ ...s, [sku]: false }));
    busyRef.current = false;
    return { oldPrice, newPrice };
  }, [products, crawling, opts, notify, log]);

  const crawlAll = useCallback(async () => {
    for (const p of products) {
      if (crawling[p.sku]) continue;
      await doCrawl(p.sku);
    }
    notify({ title: 'ALLE PRODUKTE AKTUELL', msg: '5/5 Crawls durch — Dashboard synchron.', kind: 'success' });
  }, [products, crawling, doCrawl, notify]);

  const demo = useCallback(async () => {
    await doCrawl('PROD-C');
  }, [doCrawl]);

  const analyzeInChat = useCallback((sku: string) => {
    const p = products.find((x) => x.sku === sku);
    if (!p) return;
    seedN.current += 1;
    setChatSeed({ n: seedN.current, text: `Analysiere den Preisdrop von ${p.name}` });
    document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    log({ label: 'chat seed', detail: `analyse ${sku} an agent übergeben`, kind: 'ai' });
  }, [products, log]);

  const drops = products.filter((p) => p.price < p.prevPrice).length;

  return (
    <div className="app-bg min-h-screen">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 border-b border-teal-300/15 bg-[#060e0e]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="crt flex h-10 w-10 items-center justify-center rounded-lg border border-teal-300/40 font-display text-[13px] font-bold text-teal-200 glow-cyan">Ω</span>
            <div>
              <p className="font-display text-[15px] font-bold tracking-[0.18em] text-teal-50">NUMEN<span className="text-[#d29a5b]">|RMX</span></p>
              <p className="font-mono2 text-[9.5px] tracking-[0.3em] text-teal-300/60">TOOLJET · SUPABASE · DIFY</p>
            </div>
          </div>
          <nav className="ml-6 hidden items-center gap-5 font-mono2 text-[11.5px] tracking-widest text-teal-200/70 lg:flex">
            <a href="#board" className="transition hover:text-teal-50">DASHBOARD</a>
            <a href="#chat" className="transition hover:text-teal-50">AGENT-CHAT</a>
            <a href="#pipeline" className="transition hover:text-teal-50">EVENT-KETTE</a>
            <a href="#config" className="transition hover:text-teal-50">DIFY-KONFIG</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 font-mono2 text-[10.5px] text-emerald-200 sm:flex">
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> CANVAS LIVE
            </span>
            <a href="#config" className="btn-cyan hidden items-center gap-1.5 rounded-lg px-3.5 py-2 font-mono2 text-[11px] font-bold sm:flex"><PlugZap size={13} /> ANBINDEN</a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="circuit-bg absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#d29a5b]/40 bg-[#d29a5b]/10 px-3 py-1 font-mono2 text-[10.5px] tracking-[0.22em] text-[#e8b87a]">
              <Sparkles size={12} /> OPTION 1 · DIE DIFY-INTEGRATION · NEUES LEVEL
            </p>
            <h1 className="font-display mt-4 text-4xl font-bold leading-[1.05] text-teal-50 sm:text-5xl lg:text-[3.4rem]">
              Der Chatbot greift <span className="text-transparent" style={{ background: 'linear-gradient(100deg,#7df0dc,#e8b87a)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>aktiv</span> in den Prozess ein.
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-teal-200/70">
              Die Infrastruktur steht — Crawling, Datenbank, Frontend. Jetzt hebt der Dify-Agent das Dashboard auf das nächste Level: Per Sprach- oder Textbefehl stößt er echte Crawls an, analysiert Preisdrops und lädt Supabase-Queries neu. Ein Klick — und die UI aktualisiert sich wie von Zauberhand.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <a href="#chat" className="btn-brass flex items-center gap-2 rounded-lg px-5 py-3 font-mono2 text-[12.5px] font-bold"><MessageSquareText size={15} /> JETZT MIT AGENT SPRECHEN</a>
              <a href="#config" className="flex items-center gap-2 rounded-lg border border-teal-300/35 bg-teal-300/[0.06] px-5 py-3 font-mono2 text-[12.5px] font-bold text-teal-100 transition hover:bg-teal-300/10"><Settings2 size={15} /> KONFIGURATION ANSEHEN</a>
            </div>
            <div className="mt-6 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { icon: <Database size={14} />, v: '5', l: 'PRODUKTE · LIVE' },
                { icon: <Activity size={14} />, v: `${drops}`, l: 'PREISDROPS' },
                { icon: <Wrench size={14} />, v: '3', l: 'DIFY-TOOLS' },
                { icon: <Gauge size={14} />, v: '~1,4s', l: 'TOOL-LATENZ' },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-teal-300/15 bg-black/40 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 font-mono2 text-[18px] font-bold text-teal-50"><span className="text-[#d29a5b]">{s.icon}</span>{s.v}</p>
                  <p className="font-mono2 text-[9.5px] tracking-[0.18em] text-teal-300/60">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 overflow-hidden rounded-lg border border-teal-300/15 bg-black/40 py-2">
              <div className="marquee-track flex shrink-0 gap-8 whitespace-nowrap px-4 font-mono2 text-[11px] tracking-widest text-teal-300/60">
                {[0, 1].map((k) => (
                  <span key={k} className="flex gap-8">
                    <span>„ANALYSIERE DEN PREISDROP VON ULTRABOOST X“</span><span className="text-[#d29a5b]">◆</span>
                    <span>„CRAWLE PRODUKT C JETZT NEU!“</span><span className="text-[#d29a5b]">◆</span>
                    <span>TOOLJET onClick → LOADING → TOAST → RELOAD</span><span className="text-[#d29a5b]">◆</span>
                    <span>SUPABASE REALTIME · DIFY STREAMING</span><span className="text-[#d29a5b]">◆</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Referenz-Frame */}
          <div className="relative mx-auto w-full max-w-[430px]">
            <div className="absolute -inset-3 rounded-2xl border border-[#d29a5b]/30" />
            <div className="absolute -inset-6 rounded-2xl border border-teal-300/15" />
            <div className="scanlines relative overflow-hidden rounded-xl border border-teal-300/30 bg-[#0a1516]">
              <div className="scan-beam" />
              <img src="/reference.jpg" alt="NUMEN RMX Canvas-Vorlage" className="h-auto w-full object-cover" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-3">
                <span className="font-mono2 text-[10px] tracking-[0.25em] text-cyan-200">[ CANVAS-VORLAGE // ARCHE™ ]</span>
                <span className="flex items-center gap-1.5 font-mono2 text-[10px] text-emerald-300"><Radio size={11} /> LIVE</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3 pt-8">
                <div className="flex items-center justify-between">
                  <p className="font-mono2 text-[10px] tracking-[0.25em] text-[#e8b87a]">[ 29,881.0x || CORE ]</p>
                  <p className="font-mono2 text-[10px] tracking-[0.25em] text-teal-200">Ω / Δ / Ψ</p>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button onClick={() => analyzeInChat('PROD-A')} className="btn-cyan flex-1 rounded-md px-2 py-1.5 font-mono2 text-[10.5px] font-bold">ULTRABOOST ANALYSIEREN</button>
                  <button onClick={() => void doCrawl('PROD-C')} className="btn-brass flex-1 rounded-md px-2 py-1.5 font-mono2 text-[10.5px] font-bold">PRODUKT C CRAWLEN</button>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center font-mono2 text-[10.5px] tracking-[0.2em] text-teal-300/50">DESIGN-DNA: CRT-GLOW · MESSING · HUD-NUMMERN · CORE-MYSTIK</p>
          </div>
        </div>
      </section>

      <main className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-16 sm:px-6">
        <div id="pipeline" className="scroll-mt-24">
          <Pipeline phase={phase} lastSku={lastSku} opts={opts} onToggle={toggleOpt} onDemo={demo} busy={globalBusy} />
        </div>

        <div id="board" className="grid scroll-mt-24 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ProductBoard products={products} crawling={crawling} globalBusy={globalBusy} selectedId={selectedId} onSelect={setSelectedId} onCrawl={(s) => void doCrawl(s)} onCrawlAll={() => void crawlAll()} onAnalyzeInChat={analyzeInChat} />
          </div>
          <div className="lg:col-span-2">
            <DifyChat products={products} crawling={crawling} onCrawl={doCrawl} notify={notify} log={log} seed={chatSeed} onConsumeSeed={() => setChatSeed(null)} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3"><ArchDiagram /></div>
          <div className="lg:col-span-2"><LogPanel logs={logs} onClear={() => setLogs([])} /></div>
        </div>

        <ConfigPanel notify={notify} log={log} />

        {/* Voice + ToolJet strip */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: <Bot size={18} />, t: 'SPRACHBEFEHL', s: '„Crawle Produkt C jetzt neu!“ — Mikro im Chat tippen, sprechen, Tool feuert automatisch.' },
            { icon: <Cpu size={18} />, t: 'AGENT STATT ABLESEGERÄT', s: 'Dify-Chatflow mit Reasoning + 3 Function-Tools — kein passives Q&A mehr.' },
            { icon: <ShieldCheck size={18} />, t: 'PRODUKTIONSREIF', s: 'Secrets in Globals, Retry bei Failure, Realtime-Reload, Audit-Log für jeden Tool-Call.' },
          ].map((c) => (
            <div key={c.t} className="panel flex gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d29a5b]/40 bg-[#d29a5b]/10 text-[#e8b87a]">{c.icon}</span>
              <span><span className="block font-mono2 text-[12px] font-bold tracking-widest text-teal-50">{c.t}</span><span className="mt-1 block text-[12.5px] leading-relaxed text-teal-200/65">{c.s}</span></span>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-teal-300/15 bg-black/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <p className="font-mono2 text-[11px] tracking-[0.2em] text-teal-300/60">NUMEN|RMX · TOOLJET-CANVAS · SUPABASE · DIFY-CHATFLOW · CORE 29,881.0x</p>
          <p className="font-mono2 text-[11px] text-teal-300/40">Ω / Δ / Ψ — ein Klick stößt das Backend an.</p>
        </div>
      </footer>

      <ToastStack toasts={toasts} dismiss={dismiss} />
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, ChevronDown, CircleStop, Mic, SendHorizonal, Sparkles, User, Wrench } from 'lucide-react';
import { QUICK_PROMPTS, eur, type LogEntry, type Product, type ToastMsg } from '../data/seed';

interface ChatMsg {
  id: number;
  role: 'user' | 'bot';
  text: string;
  tool?: { name: string; args: string; result: string; ms: number };
  time: string;
}

interface Props {
  products: Product[];
  crawling: Record<string, boolean>;
  onCrawl: (sku: string) => Promise<{ oldPrice: number; newPrice: number } | void>;
  notify: (t: Omit<ToastMsg, 'id'>) => void;
  log: (e: Omit<LogEntry, 'id' | 't'>) => void;
  seed: { n: number; text: string } | null;
  onConsumeSeed: () => void;
}

const tnow = () => new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function findSku(text: string, products: Product[]): Product | null {
  const t = text.toLowerCase();
  for (const p of products) {
    if (t.includes(p.sku.toLowerCase()) || t.includes(`produkt ${p.id.toLowerCase()}`) || t.includes(` ${p.id.toLowerCase()}`) || t.includes(p.name.toLowerCase().split(' ')[0])) return p;
  }
  if (/\bprodukt\s*c\b/.test(t)) return products.find((p) => p.id === 'C') ?? null;
  if (/ultraboost/.test(t)) return products.find((p) => p.id === 'A') ?? null;
  if (/vapor|strike/.test(t)) return products.find((p) => p.id === 'B') ?? null;
  if (/numen|rmx|runner/.test(t)) return products.find((p) => p.id === 'C') ?? null;
  if (/arche|platinum|sync/.test(t)) return products.find((p) => p.id === 'D') ?? null;
  if (/core|flux/.test(t)) return products.find((p) => p.id === 'E') ?? null;
  const m = t.match(/prod-?([a-e])/);
  if (m) return products.find((p) => p.id === m[1].toUpperCase()) ?? null;
  return null;
}

let mid = 10;

export default function DifyChat({ products, crawling, onCrawl, notify, log, seed, onConsumeSeed }: Props) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      id: 1, role: 'bot', time: tnow(),
      text: '// CORE ONLINE // Ich bin NUMEN-RMX, dein aktiver Preis-Agent. Ich lese nicht nur Supabase aus — ich greife ein: sage z. B. „Crawle Produkt C jetzt neu!“ oder „Analysiere den Preisdrop von UltraBoost X“.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [openTool, setOpenTool] = useState<number | null>(null);
  const [convId] = useState(() => `conv-${Math.random().toString(36).slice(2, 8)}`);
  const boxRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);

  useEffect(() => { boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs, busy]);

  useEffect(() => {
    if (seed && seed.text) { onConsumeSeed(); void send(seed.text); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed?.n]);

  const push = (m: Omit<ChatMsg, 'id'>) => setMsgs((prev) => [...prev, { ...m, id: ++mid }]);

  async function send(raw?: string) {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    setInput('');
    push({ role: 'user', text, time: tnow() });
    setBusy(true);
    log({ label: 'chat → dify', detail: text.slice(0, 80), kind: 'out' });
    await new Promise((r) => setTimeout(r, 650));

    const t = text.toLowerCase();
    const skuHit = findSku(text, products);
    const wantsCrawl = /crawl|scann|aktualisier|neu|reload|abruf|jetzt/.test(t);
    const wantsAnalysis = /analys|preisdrop|drop|warum|billiger|teurer|entwicklung|grund/.test(t);
    const wantsCompare = /vergleich|alle|übersicht|tabelle|ranking|besten/.test(t);
    const wantsStatus = /status|system|health|verbindung|verbindungstest|online/.test(t);

    if (wantsCrawl && skuHit) {
      const started = Date.now();
      const res = await onCrawl(skuHit.sku);
      const ms = Date.now() - started + 412;
      const np = res && typeof res === 'object' ? (res as { newPrice: number }).newPrice : skuHit.price;
      const op = res && typeof res === 'object' ? (res as { oldPrice: number }).oldPrice : skuHit.price;
      const d = ((np - op) / op) * 100;
      push({
        role: 'bot', time: tnow(),
        text: `// TOOL OK // Crawl für ${skuHit.name} (${skuHit.sku}) abgeschlossen. ${eur(op)} → ${eur(np)} (${d <= 0 ? '' : '+'}${d.toFixed(1)} %). Supabase-Queries wurden neu geladen, Charts sind aktuell.`,
        tool: {
          name: 'crawl_product',
          args: JSON.stringify({ sku: skuHit.sku, depth: 'quick', notify: true }),
          result: JSON.stringify({ sku: skuHit.sku, old_price: op, new_price: np, job: 'done', reloaded: ['products', 'price_history', 'chart'] }),
          ms,
        },
      });
      log({ label: 'dify tool', detail: `crawl_product(${skuHit.sku}) → done`, kind: 'ai' });
    } else if (wantsCrawl && !skuHit) {
      push({
        role: 'bot', time: tnow(),
        text: `// RÜCKFRAGE // Welches Produkt soll ich neu crawlen? Aktuell kenne ich ${products.map((p) => p.sku).join(', ')}. Sag z. B. „Crawle Produkt C jetzt neu!“ — ich rufe dann sofort das Tool crawl_product auf.`,
      });
    } else if (wantsAnalysis && skuHit) {
      const p = skuHit;
      const drop = ((p.prevPrice - p.price) / p.prevPrice) * 100;
      const min = Math.min(...p.history);
      const max = Math.max(...p.history);
      const verdict = drop >= 5 ? 'Starker Drop — Kaufzone.' : drop > 0 ? 'Leichter Rückgang — beobachten.' : drop < 0 ? 'Preis gestiegen — Abwarten lohnt.' : 'Seit 14 Crawls stabil — kein Handlungsdruck.';
      const started = Date.now();
      await new Promise((r) => setTimeout(r, 700));
      push({
        role: 'bot', time: tnow(),
        text: `// ANALYSE ${p.sku} // ${p.name} bei ${p.shop}: ${eur(p.prevPrice)} → ${eur(p.price)} (${drop >= 0 ? '−' : '+'}${Math.abs(drop).toFixed(1)} %). Spanne 14 Tage: ${eur(min)} – ${eur(max)}. Bestand: ${p.stock} Stk. ${verdict} Empfehlung: ${drop >= 5 ? 'Jetzt zuschlagen, Alert in ToolJet aktiv lassen.' : 'Alert-Schwelle 5 % aktiv lassen, nächster Auto-Crawl in ~15 Min.'}`,
        tool: { name: 'analyze_pricedrop', args: JSON.stringify({ sku: p.sku, window_days: 14, threshold_pct: 5 }), result: JSON.stringify({ drop_pct: +drop.toFixed(2), verdict }), ms: Date.now() - started },
      });
      log({ label: 'dify tool', detail: `analyze_pricedrop(${p.sku})`, kind: 'ai' });
    } else if (wantsCompare) {
      const rows = [...products].sort((a, b) => ((a.price - a.prevPrice) / a.prevPrice) - ((b.price - b.prevPrice) / b.prevPrice));
      push({
        role: 'bot', time: tnow(),
        text: `// VERGLEICH // Schärfster Drop: ${rows[0].name} (${(((rows[0].price - rows[0].prevPrice) / rows[0].prevPrice) * 100).toFixed(1)} %). Teuerstes Produkt: ${[...products].sort((a, b) => b.price - a.price)[0].name} (${eur(Math.max(...products.map((p) => p.price)))}). Stabilste Kurve: Numen Runner RMX (±0 %). Sag „Analysiere …“, um ins Detail zu gehen.`,
        tool: { name: 'list_products', args: JSON.stringify({ only_drops: false, limit: 20 }), result: JSON.stringify({ count: products.length, source: 'supabase:products' }), ms: 320 },
      });
    } else if (wantsStatus) {
      push({
        role: 'bot', time: tnow(),
        text: `// SYSTEMSTATUS // Dify-Chatflow: verbunden (streaming, ${convId}). Supabase: products + price_history synchron, Realtime an. ToolJet: Event-Kette aktiv (Loading → Toast → Reload). ${Object.keys(crawling).length} Jobs in Warteschlange, 0 Fehler in den letzten 60 Min.`,
      });
    } else if (/hallo|hi |hey|moin|wer bist|was kannst/.test(t)) {
      push({
        role: 'bot', time: tnow(),
        text: `// IDENTITÄT // Ich bin der Dify-Agent auf diesem Dashboard: Ich analysiere Preisdrops, vergleiche Produkte und stoße per Tool-Call echte Crawls an — per Text oder Sprache. Probier: „Crawle Produkt C jetzt neu!“`,
      });
    } else {
      const guess = findSku(text, products);
      push({
        role: 'bot', time: tnow(),
        text: guess
          ? `// VERSTANDEN // Meintest du ${guess.name}? Sag „Analysiere ${guess.name}“ für die Analyse oder „Crawle ${guess.sku} neu“ für einen Live-Crawl — ich führe es sofort aus.`
          : `// BEREIT // Ich kann crawlen, analysieren und vergleichen. Beispiele: „Analysiere den Preisdrop von UltraBoost X“, „Crawle Produkt C jetzt neu!“, „Vergleiche alle Preise“.`,
      });
    }
    setBusy(false);
  }

  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      notify({ title: 'SPRACHE NICHT VERFÜGBAR', msg: 'Dieser Browser unterstützt keine Spracherkennung — nutze das Textfeld.', kind: 'warn' });
      return;
    }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    try {
      const rec = new SR();
      recRef.current = rec;
      rec.lang = 'de-DE';
      rec.interimResults = false;
      rec.onresult = (e: any) => {
        const txt = e.results[0][0].transcript;
        setListening(false);
        void send(txt);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      rec.start();
      setListening(true);
      notify({ title: 'SPRACHEINGABE AKTIV', msg: 'Sprich jetzt — z. B. „Crawle Produkt C jetzt neu!“', kind: 'info' });
    } catch { setListening(false); }
  }

  return (
    <div id="chat" className="panel panel-corner flex h-full min-h-[560px] scroll-mt-24 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-teal-300/10 bg-black/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-teal-300/40 bg-teal-400/10 text-teal-200">
            <Bot size={20} />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0b1819] bg-emerald-400" />
          </span>
          <div>
            <p className="font-mono2 text-[13px] font-bold tracking-wider text-teal-50">NUMEN-RMX · DIFY AGENT</p>
            <p className="font-mono2 text-[10.5px] tracking-widest text-emerald-300/80">● ONLINE · TOOL-CALLING AKTIV · {convId}</p>
          </div>
        </div>
        <span className="hidden rounded-md border border-[#d29a5b]/40 bg-[#d29a5b]/10 px-2 py-1 font-mono2 text-[10px] tracking-widest text-[#e8b87a] sm:block">CHATFLOW · STREAMING</span>
      </div>

      <div ref={boxRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ maxHeight: 460 }}>
        <AnimatePresence initial={false}>
          {msgs.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'bot' && <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-teal-300/30 bg-teal-400/10 text-teal-300"><Bot size={15} /></span>}
              <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${m.role === 'user' ? 'border border-[#d29a5b]/40 bg-[#d29a5b]/15 text-amber-50' : 'border border-teal-300/20 bg-teal-300/[0.06] text-teal-50'}`}>
                <p>{m.text}</p>
                {m.tool && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-cyan-300/25 bg-black/50">
                    <button onClick={() => setOpenTool(openTool === m.id ? null : m.id)} className="flex w-full items-center gap-2 px-2.5 py-1.5 font-mono2 text-[11px] font-bold text-cyan-200 hover:bg-cyan-300/5">
                      <Wrench size={12} /> ⚙ {m.tool.name} · {m.tool.ms} ms
                      <ChevronDown size={12} className={`ml-auto transition ${openTool === m.id ? 'rotate-180' : ''}`} />
                    </button>
                    {openTool === m.id && (
                      <div className="space-y-1.5 border-t border-cyan-300/15 px-2.5 py-2 font-mono2 text-[10.5px] leading-relaxed">
                        <p className="text-teal-300/60">args</p>
                        <pre className="whitespace-pre-wrap rounded bg-black/60 p-1.5 text-cyan-200">{m.tool.args}</pre>
                        <p className="text-teal-300/60">result</p>
                        <pre className="whitespace-pre-wrap rounded bg-black/60 p-1.5 text-emerald-200">{m.tool.result}</pre>
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-1 font-mono2 text-[10px] text-teal-300/40">{m.time}</p>
              </div>
              {m.role === 'user' && <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#d29a5b]/40 bg-[#d29a5b]/15 text-[#e8b87a]"><User size={15} /></span>}
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && (
          <div className="flex items-center gap-2 text-teal-200">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-teal-300/30 bg-teal-400/10"><Sparkles size={14} className="tick" /></span>
            <span className="flex gap-1 rounded-xl border border-teal-300/20 bg-teal-300/[0.06] px-3 py-2.5">
              {[0, 1, 2].map((i) => <span key={i} className="tick h-1.5 w-1.5 rounded-full bg-teal-300" style={{ animationDelay: `${i * 0.25}s` }} />)}
            </span>
            <span className="font-mono2 text-[11px] text-teal-300/60">Agent denkt nach / ruft Tools …</span>
          </div>
        )}
      </div>

      <div className="border-t border-teal-300/10 px-4 pb-4 pt-3">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((q) => (
            <button key={q} onClick={() => void send(q)} disabled={busy} className="rounded-full border border-teal-300/25 bg-teal-300/[0.05] px-2.5 py-1 text-[11.5px] text-teal-100 transition hover:border-teal-300/60 hover:bg-teal-300/10 disabled:opacity-40">
              {q}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleVoice} title="Spracheingabe" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${listening ? 'border-rose-400/60 bg-rose-400/15 text-rose-200' : 'border-teal-300/30 bg-teal-300/[0.06] text-teal-200 hover:bg-teal-300/10'}`}>
            {listening ? <CircleStop size={17} /> : <Mic size={17} />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void send(); }}
            placeholder={listening ? 'Höre zu … sprich jetzt!' : 'Befehl an den Agenten — z. B. „Crawle Produkt C jetzt neu!“'}
            className="h-10 min-w-0 flex-1 rounded-lg border border-teal-300/25 bg-black/40 px-3 text-[13px] text-teal-50 placeholder:text-teal-300/35"
          />
          <button onClick={() => void send()} disabled={busy || !input.trim()} className="btn-cyan flex h-10 w-10 shrink-0 items-center justify-center rounded-lg disabled:opacity-40">
            <SendHorizonal size={17} />
          </button>
        </div>
        <p className="mt-2 font-mono2 text-[10px] tracking-wider text-teal-300/40">DIFY CHATFLOW · MODEL gpt-4o-mini · TOOLS: crawl_product / analyze_pricedrop / list_products</p>
      </div>
    </div>
  );
}

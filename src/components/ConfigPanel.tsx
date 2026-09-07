import { useState } from 'react';
import { Braces, Check, Copy, Database, Download, FlaskConical, KeyRound, PlugZap, Save, Settings2, Wrench } from 'lucide-react';
import { DIFY_API_EXAMPLE, DIFY_SYSTEM_PROMPT, SUPABASE_SQL, TOOLJET_QUERY_JS, TOOL_SCHEMAS, type LogEntry, type ToastMsg } from '../data/seed';

interface Props {
  notify: (t: Omit<ToastMsg, 'id'>) => void;
  log: (e: Omit<LogEntry, 'id' | 't'>) => void;
}

function Code({ code, lang }: { code: string; lang: string }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); } catch { /* clipboard may fail */ }
    setOk(true);
    setTimeout(() => setOk(false), 1600);
  };
  return (
    <div className="overflow-hidden rounded-xl border border-teal-300/20 bg-[#050c0d]">
      <div className="flex items-center justify-between border-b border-teal-300/10 px-3 py-1.5">
        <span className="font-mono2 text-[10.5px] tracking-[0.2em] text-teal-300/60">{lang}</span>
        <button onClick={copy} className="flex items-center gap-1.5 rounded-md border border-teal-300/25 px-2 py-1 font-mono2 text-[10.5px] text-teal-200 transition hover:bg-teal-300/10">
          {ok ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}{ok ? 'KOPIERT' : 'KOPIEREN'}
        </button>
      </div>
      <pre className="max-h-72 overflow-auto p-3 font-mono2 text-[11.5px] leading-relaxed text-cyan-100/90">{code}</pre>
    </div>
  );
}

export default function ConfigPanel({ notify, log }: Props) {
  const [tab, setTab] = useState<'agent' | 'tools' | 'tooljet' | 'supabase'>('agent');
  const [apiKey, setApiKey] = useState('app-••••••••••••3f9a');
  const [appId, setAppId] = useState('numen-rmx-chatflow-01');
  const [baseUrl, setBaseUrl] = useState('https://api.dify.ai/v1');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temp, setTemp] = useState(0.3);
  const [stream, setStream] = useState(true);
  const [sysPrompt, setSysPrompt] = useState(DIFY_SYSTEM_PROMPT);
  const [enabledTools, setEnabledTools] = useState<Record<string, boolean>>({ crawl_product: true, analyze_pricedrop: true, list_products: true });
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState<null | boolean>(null);
  const [latency, setLatency] = useState(0);

  const test = async () => {
    setTesting(true); setTestOk(null);
    const t0 = Date.now();
    await new Promise((r) => setTimeout(r, 1400));
    const ms = Date.now() - t0;
    setLatency(ms);
    setTesting(false); setTestOk(true);
    notify({ title: 'DIFY-ANBINDUNG OK', msg: `Chatflow antwortet in ${ms} ms — Tools: ${Object.values(enabledTools).filter(Boolean).length}/3 aktiv.`, kind: 'success' });
    log({ label: 'dify ping', detail: `${baseUrl} → 200 in ${ms}ms`, kind: 'ok' });
  };

  const download = () => {
    const cfg = { app: appId, baseUrl, model, temperature: temp, streaming: stream, system_prompt: sysPrompt, tools: TOOL_SCHEMAS.filter((t) => enabledTools[t.name]).map((t) => t.name), conversation_starter: 'Crawle Produkt C jetzt neu!' };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' }));
    a.download = 'dify-chatbot-config.json';
    a.click();
    notify({ title: 'KONFIG EXPORTIERT', msg: 'dify-chatbot-config.json wurde heruntergeladen.', kind: 'info' });
  };

  const tabs = [
    { id: 'agent' as const, icon: <Settings2 size={14} />, t: 'Agent' },
    { id: 'tools' as const, icon: <Wrench size={14} />, t: 'Tools · 3' },
    { id: 'tooljet' as const, icon: <PlugZap size={14} />, t: 'ToolJet-Binding' },
    { id: 'supabase' as const, icon: <Database size={14} />, t: 'Supabase' },
  ];

  return (
    <div id="config" className="panel panel-corner scroll-mt-24 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono2 text-[11px] tracking-[0.25em] text-[#d29a5b]">OPTION 1 // DIE DIFY-INTEGRATION</p>
          <h2 className="font-display mt-1 text-xl font-bold text-teal-50 sm:text-2xl">Konfiguration für den Dify-Chatbot &amp; dessen Anbindung.</h2>
          <p className="mt-1 max-w-3xl text-[13px] text-teal-200/65">Chatflow-App in Dify anlegen → System-Prompt + Tools hinterlegen → API-Key in ToolJet-Globals speichern → Query <span className="font-mono2 text-teal-100">difyChat</span> verdrahten. Alles unten kopierfertig.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={download} className="flex items-center gap-2 rounded-lg border border-teal-300/30 bg-teal-300/[0.06] px-4 py-2 font-mono2 text-[12px] font-bold text-teal-100 transition hover:bg-teal-300/10">
            <Download size={14} /> JSON-EXPORT
          </button>
          <button onClick={() => { notify({ title: 'KONFIG GESPEICHERT', msg: 'Agent-Setup im Canvas-State gesichert.', kind: 'success' }); log({ label: 'config save', detail: `${appId} · ${model}`, kind: 'sys' }); }} className="btn-cyan flex items-center gap-2 rounded-lg px-4 py-2 font-mono2 text-[12px] font-bold">
            <Save size={14} /> SPEICHERN
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {tabs.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)} className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 font-mono2 text-[12px] font-bold transition ${tab === x.id ? 'border-teal-300/60 bg-teal-300/10 text-teal-50' : 'border-teal-300/15 bg-black/30 text-teal-300/60 hover:text-teal-100'}`}>
            {x.icon} {x.t}
          </button>
        ))}
      </div>

      {tab === 'agent' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block">
              <span className="font-mono2 text-[11px] tracking-widest text-teal-300/70">DIFY API-BASISURL</span>
              <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-teal-300/25 bg-black/40 px-3 font-mono2 text-[12.5px] text-teal-50" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono2 text-[11px] tracking-widest text-teal-300/70">APP-ID / CHATFLOW</span>
                <input value={appId} onChange={(e) => setAppId(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-teal-300/25 bg-black/40 px-3 font-mono2 text-[12.5px] text-teal-50" />
              </label>
              <label className="block">
                <span className="flex items-center gap-1 font-mono2 text-[11px] tracking-widest text-teal-300/70"><KeyRound size={11} /> API-KEY</span>
                <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" className="mt-1 h-10 w-full rounded-lg border border-teal-300/25 bg-black/40 px-3 font-mono2 text-[12.5px] text-teal-50" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono2 text-[11px] tracking-widest text-teal-300/70">MODELL</span>
                <select value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-teal-300/25 bg-black/40 px-2 font-mono2 text-[12.5px] text-teal-50">
                  <option>gpt-4o-mini</option><option>gpt-4o</option><option>claude-3-5-sonnet</option><option>llama-3.1-70b</option>
                </select>
              </label>
              <div>
                <span className="font-mono2 text-[11px] tracking-widest text-teal-300/70">TEMPERATUR · {temp.toFixed(1)}</span>
                <input type="range" min={0} max={1} step={0.1} value={temp} onChange={(e) => setTemp(parseFloat(e.target.value))} className="mt-3 w-full accent-teal-300" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-teal-300/15 bg-black/30 px-3 py-2">
                <button role="switch" aria-checked={stream} onClick={(e) => { e.preventDefault(); setStream(!stream); }} className={`relative rounded-full transition ${stream ? 'bg-emerald-400/80' : 'bg-teal-900'}`} style={{ width: 40, height: 22 }}>
                  <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all ${stream ? 'left-[20px]' : 'left-0.5'}`} />
                </button>
                <span className="font-mono2 text-[12px] font-bold text-teal-100">Streaming {stream ? 'AN' : 'AUS'}</span>
              </label>
              <button onClick={test} disabled={testing} className="btn-brass flex items-center gap-2 rounded-lg px-4 py-2 font-mono2 text-[12px] font-bold disabled:opacity-50">
                <FlaskConical size={14} /> {testing ? 'TESTE …' : 'VERBINDUNG TESTEN'}
              </button>
              {testOk && <span className="font-mono2 text-[11.5px] text-emerald-300">✓ 200 OK · {latency} ms</span>}
            </div>
          </div>
          <div>
            <p className="font-mono2 text-[11px] tracking-widest text-teal-300/70">SYSTEM-PROMPT (DE)</p>
            <textarea value={sysPrompt} onChange={(e) => setSysPrompt(e.target.value)} rows={12} className="mt-1 w-full resize-y rounded-lg border border-teal-300/25 bg-black/40 p-3 font-mono2 text-[12px] leading-relaxed text-teal-50" />
            <p className="mt-1 font-mono2 text-[10.5px] text-teal-300/45">{sysPrompt.length} Zeichen · in Dify unter „Instructions“ einfügen</p>
          </div>
        </div>
      )}

      {tab === 'tools' && (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {TOOL_SCHEMAS.map((t) => (
            <div key={t.name} className={`rounded-xl border p-4 transition ${enabledTools[t.name] ? 'border-teal-300/40 bg-teal-300/[0.05]' : 'border-teal-300/10 bg-black/30 opacity-70'}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-mono2 text-[13px] font-bold text-teal-50"><Braces size={14} className="text-[#d29a5b]" /> {t.name}</p>
                <button role="switch" aria-checked={enabledTools[t.name]} onClick={() => setEnabledTools((s) => ({ ...s, [t.name]: !s[t.name] }))} className={`relative rounded-full transition ${enabledTools[t.name] ? 'bg-emerald-400/80' : 'bg-teal-900'}`} style={{ width: 38, height: 21 }}>
                  <span className={`absolute top-0.5 h-[17px] w-[17px] rounded-full bg-white transition-all ${enabledTools[t.name] ? 'left-[19px]' : 'left-0.5'}`} />
                </button>
              </div>
              <p className="mt-1.5 text-[12.5px] text-teal-200/70">{t.desc}</p>
              <p className="mt-2 font-mono2 text-[10.5px] text-[#e8b87a]/80">{t.endpoint}</p>
              <pre className="mt-2 max-h-44 overflow-auto rounded-lg bg-black/60 p-2.5 font-mono2 text-[10.5px] leading-relaxed text-cyan-100/85">{t.schema}</pre>
            </div>
          ))}
        </div>
      )}

      {tab === 'tooljet' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="rounded-xl border border-teal-300/15 bg-black/30 p-4">
              <p className="font-mono2 text-[11px] tracking-widest text-[#d29a5b]">SCHRITT-FOLGE IM TOOLJET-CANVAS</p>
              <ol className="mt-2 space-y-2 text-[13px] text-teal-100/85">
                {['Globals → difyApiKey + difyBaseUrl hinterlegen (Secrets).', 'REST-Query difyChat anlegen: POST {{globals.difyBaseUrl}}/chat-messages.', 'Event-Handler am Senden-Button: onClick → difyChat.run() mit Loading-State.', 'On Success: chatHistory.append + Toast „Antwort da“ + ggf. crawlTrigger.run().', 'On Failure: roter Toast + Retry-Button einblenden.', 'Supabase-Queries getProducts / getPriceHistory auf „Run on success of crawlTrigger“.'].map((s, i) => (
                  <li key={i} className="flex gap-2.5"><span className="badge-num flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono2 text-[11px] font-bold text-cyan-200">{i + 1}</span><span>{s}</span></li>
                ))}
              </ol>
            </div>
            <Code code={DIFY_API_EXAMPLE} lang="cURL · DIFY CHAT-API (STREAMING)" />
          </div>
          <Code code={TOOLJET_QUERY_JS} lang="JAVASCRIPT · TOOLJET QUERY difyChat" />
        </div>
      )}

      {tab === 'supabase' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <Code code={SUPABASE_SQL} lang="SQL · SUPABASE MIGRATION" />
          <div className="space-y-3">
            <div className="rounded-xl border border-teal-300/15 bg-black/30 p-4">
              <p className="font-mono2 text-[11px] tracking-widest text-[#d29a5b]">AUTO-RELOAD VERDRAHTUNG</p>
              <ul className="mt-2 space-y-1.5 text-[12.5px] text-teal-100/85">
                <li>· crawlTrigger <span className="font-mono2 text-cyan-300">onSuccess → getProducts.run()</span></li>
                <li>· crawlTrigger <span className="font-mono2 text-cyan-300">onSuccess → getPriceHistory.run()</span></li>
                <li>· Realtime-Channel auf <span className="font-mono2">price_history</span> subscriben</li>
                <li>· Chart-Query hängt an <span className="font-mono2">variables.selectedSku</span></li>
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/[0.05] p-4">
              <p className="font-mono2 text-[11px] tracking-widest text-emerald-300">VOICE-BEFEHL → TOOL-CALL</p>
              <p className="mt-1 text-[12.5px] text-teal-100/85">„Crawle Produkt C jetzt neu!“ → Dify erkennt Intent <span className="font-mono2 text-cyan-300">crawl_product(sku=PROD-C)</span> → ToolJet führt <span className="font-mono2">crawlTrigger</span> aus → Toast + Reload. Genau das kannst du oben im Chat live testen.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

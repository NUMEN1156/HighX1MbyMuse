export interface Product {
  id: string;
  sku: string;
  name: string;
  shop: string;
  url: string;
  price: number;
  prevPrice: number;
  history: number[];
  lastCrawl: string;
  status: 'live' | 'drop' | 'watch' | 'fresh';
  stock: number;
  img: string | null;
}

export interface CrawlResult {
  sku: string;
  name: string;
  oldPrice: number;
  newPrice: number;
}

export interface ToastMsg {
  id: number;
  title: string;
  msg: string;
  kind: 'success' | 'info' | 'warn' | 'error';
}

export interface LogEntry {
  id: number;
  t: string;
  label: string;
  detail: string;
  kind: 'out' | 'ok' | 'ai' | 'sys';
}

export const eur = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

export const nowT = () =>
  new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'A', sku: 'PROD-A', name: 'UltraBoost X', shop: 'runstore.de',
    url: 'https://runstore.de/p/ultraboost-x', price: 139.99, prevPrice: 189.99,
    history: [189.99, 189.99, 184.5, 184.5, 179.0, 179.0, 169.99, 169.99, 159.99, 159.99, 149.99, 149.99, 144.5, 139.99],
    lastCrawl: 'vor 4 Min', status: 'drop', stock: 14, img: '/images/prod-ultraboost.jpg',
  },
  {
    id: 'B', sku: 'PROD-B', name: 'Vapor Strike Pro', shop: 'kickzone.de',
    url: 'https://kickzone.de/p/vapor-strike-pro', price: 214.0, prevPrice: 219.0,
    history: [229.0, 229.0, 225.0, 225.0, 222.0, 222.0, 219.0, 219.0, 219.0, 217.5, 217.5, 216.0, 216.0, 214.0],
    lastCrawl: 'vor 9 Min', status: 'watch', stock: 32, img: '/images/prod-vapor.jpg',
  },
  {
    id: 'C', sku: 'PROD-C', name: 'Numen Runner RMX', shop: 'arche-store.de',
    url: 'https://arche-store.de/p/numen-runner-rmx', price: 298.81, prevPrice: 298.81,
    history: [298.81, 298.81, 298.81, 298.81, 298.81, 298.81, 298.81, 298.81, 298.81, 298.81, 298.81, 298.81, 298.81, 298.81],
    lastCrawl: 'vor 26 Min', status: 'live', stock: 7, img: '/images/prod-numen.jpg',
  },
  {
    id: 'D', sku: 'PROD-D', name: 'Arche Platinum Sync', shop: 'platinum-kicks.de',
    url: 'https://platinum-kicks.de/p/arche-platinum', price: 349.0, prevPrice: 329.0,
    history: [319.0, 319.0, 322.0, 322.0, 325.0, 325.0, 329.0, 329.0, 335.0, 335.0, 342.0, 342.0, 345.0, 349.0],
    lastCrawl: 'vor 12 Min', status: 'watch', stock: 5, img: null,
  },
  {
    id: 'E', sku: 'PROD-E', name: 'Core Flux 29.881', shop: 'core-supply.de',
    url: 'https://core-supply.de/p/core-flux', price: 119.5, prevPrice: 129.9,
    history: [139.9, 139.9, 136.0, 136.0, 134.0, 134.0, 129.9, 129.9, 127.0, 127.0, 124.0, 124.0, 121.0, 119.5],
    lastCrawl: 'vor 2 Min', status: 'fresh', stock: 48, img: null,
  },
];

export const QUICK_PROMPTS = [
  'Analysiere den Preisdrop von UltraBoost X',
  'Crawle Produkt C jetzt neu!',
  'Vergleiche alle Preise',
  'Systemstatus bitte',
];

export const DIFY_SYSTEM_PROMPT = `Du bist NUMEN-RMX, der autonome Preis-Analyst des Crawler-Dashboards.
Du liest NICHT nur Daten – du greifst aktiv ein.

Regeln:
1. Antworte immer auf Deutsch, kurz, präzise, im HUD-Ton (// CORE //).
2. Bei Preisdrop > 5 %: analysiere Ursache (Historie, Shop, Bestand) + Kaufempfehlung.
3. Bei Befehlen wie "crawle X neu" rufe SOFORT das Tool crawl_product auf – kein Nachfragen.
4. Nach jedem Tool-Call: Ergebnis in 2-3 Sätzen zusammenfassen + Delta in % und EUR nennen.
5. Du kennst 5 Produkte (PROD-A … PROD-E) aus der Supabase-Tabelle "products".
6. Niemals API-Keys oder interne URLs preisgeben.`;

export const TOOL_SCHEMAS = [
  {
    name: 'crawl_product',
    desc: 'Stößt einen Live-Crawl für eine SKU an (Backend-Job + Supabase-Reload).',
    schema: `{
  "type": "object",
  "properties": {
    "sku": { "type": "string", "description": "z.B. PROD-C" },
    "depth": { "type": "string", "enum": ["quick", "full"], "default": "quick" },
    "notify": { "type": "boolean", "default": true }
  },
  "required": ["sku"]
}`,
    endpoint: 'POST https://crawler.api/v1/crawl',
  },
  {
    name: 'analyze_pricedrop',
    desc: 'Analysiert Preis-Historie einer SKU aus Supabase + LLM-Reasoning.',
    schema: `{
  "type": "object",
  "properties": {
    "sku": { "type": "string" },
    "window_days": { "type": "integer", "default": 14 },
    "threshold_pct": { "type": "number", "default": 5.0 }
  },
  "required": ["sku"]
}`,
    endpoint: 'POST https://crawler.api/v1/analyze',
  },
  {
    name: 'list_products',
    desc: 'Liest alle Produkte + aktuelle Preise aus Supabase (read-only).',
    schema: `{
  "type": "object",
  "properties": {
    "only_drops": { "type": "boolean", "default": false },
    "limit": { "type": "integer", "default": 20 }
  }
}`,
    endpoint: 'GET https://xyz.supabase.co/rest/v1/products?select=*',
  },
];

export const DIFY_API_EXAMPLE = `POST https://api.dify.ai/v1/chat-messages
Authorization: Bearer app-••••••••••••
Content-Type: application/json

{
  "inputs": { "sku_context": "PROD-C" },
  "query": "Crawle Produkt C jetzt neu!",
  "response_mode": "streaming",
  "conversation_id": "",
  "user": "tooljet-dashboard-01",
  "auto_generate_name": true
}`;

export const TOOLJET_QUERY_JS = `// ToolJet JS-Query: difyChat  (Run on success -> toast + reload)
const res = await fetch('https://api.dify.ai/v1/chat-messages', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + globals.difyApiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inputs: { sku_context: variables.selectedSku ?? '' },
    query: components.chatInput.value,
    response_mode: 'blocking',
    conversation_id: variables.difyConversationId ?? '',
    user: 'tooljet-dashboard-01'
  })
});
const data = await res.json();
variables.setVariable('difyConversationId', data.conversation_id);
return data; // -> components.chatHistory, danach queries laden neu`; 

export const SUPABASE_SQL = `-- Supabase-Schema: products / price_history / crawl_jobs
create table if not exists products (
  sku text primary key,
  name text not null,
  shop text not null,
  url text not null,
  price numeric not null,
  prev_price numeric,
  stock int default 0,
  last_crawl timestamptz default now()
);

create table if not exists price_history (
  id bigint generated always as identity primary key,
  sku text references products(sku) on delete cascade,
  price numeric not null,
  crawled_at timestamptz default now()
);
create index if not exists idx_history_sku_time
  on price_history (sku, crawled_at desc);

create table if not exists crawl_jobs (
  id bigint generated always as identity primary key,
  sku text not null,
  status text default 'queued',   -- queued | running | done | failed
  triggered_by text default 'tooljet',
  created_at timestamptz default now()
);

-- Realtime für Auto-Reload im Canvas aktivieren:
-- Database > Replication > price_history + products einschalten`; 

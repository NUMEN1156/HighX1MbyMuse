import { motion } from 'framer-motion';
import { Bot, Database, Globe, Layers, MonitorSmartphone, Webhook, Zap } from 'lucide-react';

const NODES = [
  { icon: <MonitorSmartphone size={17} />, t: 'ToolJet-Canvas', s: 'Buttons · Chat · Charts', x: '8%', y: '12%' },
  { icon: <Bot size={17} />, t: 'Dify Chatflow', s: 'Agent + 3 Tools', x: '62%', y: '6%' },
  { icon: <Zap size={17} />, t: 'Crawler-Backend', s: 'Jobs · Parser', x: '36%', y: '56%' },
  { icon: <Database size={17} />, t: 'Supabase', s: 'products · history', x: '70%', y: '58%' },
  { icon: <Globe size={17} />, t: 'Shops (5)', s: 'runstore · kickzone …', x: '6%', y: '60%' },
];

export default function ArchDiagram() {
  return (
    <div className="panel panel-corner overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono2 text-[11px] tracking-[0.25em] text-[#d29a5b]">INFRASTRUKTUR // ALLES GREIFT INEINANDER</p>
          <h2 className="font-display mt-1 text-xl font-bold text-teal-50">Architektur: Crawling · Datenbank · Frontend · Agent.</h2>
        </div>
        <span className="flex items-center gap-1.5 font-mono2 text-[11px] text-emerald-300"><span className="pulse-dot inline-block h-2 w-2 rounded-full bg-emerald-400" /> ALLE SYSTEME NOMINAL</span>
      </div>
      <div className="relative mt-4 h-[300px] overflow-hidden rounded-xl border border-teal-300/15 bg-black/40 sm:h-[280px]">
        <div className="circuit-bg absolute inset-0" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="fl" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#d29a5b" /><stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
          {["M14,26 L62,18", "M20,34 L40,62", "M52,64 L70,64", "M44,70 L14,72", "M66,30 L48,58", "M76,30 L76,52"].map((d, i) => (
            <path key={i} d={d} fill="none" stroke="url(#fl)" strokeWidth="0.5" strokeDasharray="2 1.4" vectorEffect="non-scaling-stroke" opacity={0.8}>
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur={`${1.6 + i * 0.3}s`} repeatCount="indefinite" />
            </path>
          ))}
        </svg>
        {NODES.map((n, i) => (
          <motion.div
            key={n.t}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="absolute w-[150px] rounded-xl border border-teal-300/30 bg-[#0b1819]/95 p-2.5 shadow-[0_0_20px_rgba(34,211,238,0.15)] sm:w-[170px]"
            style={{ left: n.x, top: n.y }}
          >
            <p className="flex items-center gap-1.5 font-mono2 text-[11.5px] font-bold text-teal-50"><span className="text-[#e8b87a]">{n.icon}</span>{n.t}</p>
            <p className="mt-0.5 text-[10.5px] text-teal-200/60">{n.s}</p>
          </motion.div>
        ))}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 font-mono2 text-[10px] text-teal-300/50">
          <Webhook size={11} /> webhook: crawl.done → supabase realtime → canvas reload
        </div>
        <div className="absolute bottom-2.5 right-3 hidden items-center gap-1.5 font-mono2 text-[10px] text-teal-300/50 sm:flex">
          <Layers size={11} /> numen-rmx · core 29,881.0x
        </div>
      </div>
    </div>
  );
}

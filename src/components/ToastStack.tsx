import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import type { ToastMsg } from '../data/seed';

const ICON = {
  success: <CheckCircle2 size={18} className="text-emerald-300" />,
  info: <Info size={18} className="text-cyan-300" />,
  warn: <TriangleAlert size={18} className="text-amber-300" />,
  error: <XCircle size={18} className="text-rose-400" />,
};

export default function ToastStack({ toasts, dismiss }: { toasts: ToastMsg[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex w-[330px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.96 }}
            className="panel flex items-start gap-3 border-l-2 px-4 py-3"
            style={{ borderLeftColor: t.kind === 'success' ? '#34d399' : t.kind === 'error' ? '#fb7185' : t.kind === 'warn' ? '#fbbf24' : '#22d3ee' }}
          >
            <div className="mt-0.5 flex items-center gap-2">
              <Bell size={12} className="text-teal-500" />
              {ICON[t.kind]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono2 text-[12px] font-bold tracking-wide text-teal-100">{t.title}</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-teal-200/70">{t.msg}</p>
            </div>
            <button onClick={() => dismiss(t.id)} className="text-teal-400/60 transition hover:text-teal-200">
              <X size={15} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

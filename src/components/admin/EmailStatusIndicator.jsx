import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Mail, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function EmailStatusIndicator({ bookingId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    base44.entities.EmailLog.filter({ booking_id: bookingId }, '-sent_at', 10)
      .then(data => { setLogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [bookingId]);

  if (loading) return null;
  if (!logs.length) return (
    <div className="flex items-center gap-2 text-halide/40 font-mono text-[10px] tracking-wider">
      <Mail size={11} /> NO EMAILS SENT YET
    </div>
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] tracking-widest text-halide/50">EMAIL LOG</p>
        <button onClick={fetchLogs} className="text-halide/30 hover:text-halide transition-colors">
          <RefreshCw size={10} />
        </button>
      </div>
      {logs.map((log, i) => (
        <div key={i} className="flex items-start gap-2">
          {log.status === 'sent'
            ? <CheckCircle2 size={12} className="text-green-400 shrink-0 mt-0.5" />
            : <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
          }
          <div className="min-w-0">
            <p className={`font-mono text-[10px] truncate ${log.status === 'sent' ? 'text-ivory/70' : 'text-red-400/80'}`}>
              {log.subject}
            </p>
            {log.error && (
              <p className="font-mono text-[9px] text-red-400/60 truncate">{log.error}</p>
            )}
            <p className="font-mono text-[9px] text-halide/30">
              {log.sent_at ? format(new Date(log.sent_at), 'MMM d, h:mm a') : '—'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
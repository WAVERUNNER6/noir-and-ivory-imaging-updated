import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Check, X, Camera, Building2, Clock, ChevronDown, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
  pending:   { label: 'PENDING',   bg: 'bg-halide/10',  text: 'text-halide',  border: 'border-halide/30' },
  confirmed: { label: 'CONFIRMED', bg: 'bg-green-900/20', text: 'text-green-400', border: 'border-green-800/40' },
  completed: { label: 'COMPLETED', bg: 'bg-blue-900/20',  text: 'text-blue-400',  border: 'border-blue-800/40' },
  cancelled: { label: 'CANCELLED', bg: 'bg-red-900/20',   text: 'text-red-400',   border: 'border-red-800/40' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-3 py-1 border font-mono text-[10px] tracking-widest ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function BookingRow({ booking, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAction = async (newStatus) => {
    setLoading(true);
    await base44.entities.Booking.update(booking.id, { status: newStatus });
    toast.success(`Booking ${newStatus}.`);
    onStatusChange(booking.id, newStatus);
    setLoading(false);
  };

  const shootTypeLabel = booking.shoot_type === 'real_estate' ? 'Real Estate' : 'Event';
  const ShootIcon = booking.shoot_type === 'real_estate' ? Building2 : Camera;

  return (
    <div className="border border-halide/15 hover:border-halide/30 transition-colors">
      {/* Main Row */}
      <button
        className="w-full text-left px-6 py-5 flex items-center gap-6"
        onClick={() => setExpanded(!expanded)}
      >
        <ShootIcon size={16} className="text-halide shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-body text-ivory truncate">{booking.client_name}</p>
          <p className="font-mono text-[11px] text-halide/60 mt-0.5">{booking.client_email}</p>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <p className="font-mono text-[11px] text-halide tracking-wider">{booking.shoot_date}</p>
          <p className="font-mono text-[10px] text-halide/50 mt-0.5">{booking.shoot_time || 'Flexible'}</p>
        </div>
        <StatusBadge status={booking.status} />
        <ChevronDown size={14} className={`text-halide/40 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Details + Actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-halide/10 pt-5 space-y-5">
              {/* Details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  ['SHOOT TYPE', shootTypeLabel],
                  ['DATE', booking.shoot_date],
                  ['TIME', booking.shoot_time || 'Flexible'],
                  ['LOCATION', booking.location || 'TBD'],
                  ['PACKAGE', booking.package_request || 'Not specified'],
                  ['PHONE', booking.client_phone || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="font-mono text-[9px] tracking-widest text-halide/50 mb-1">{label}</p>
                    <p className="font-body text-sm text-ivory/80">{val}</p>
                  </div>
                ))}
              </div>
              {booking.details && (
                <div>
                  <p className="font-mono text-[9px] tracking-widest text-halide/50 mb-1">DETAILS</p>
                  <p className="font-body text-sm text-ivory/70 leading-relaxed">{booking.details}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction('confirmed')}
                      disabled={loading}
                      className="flex items-center gap-2 bg-ivory text-noir px-5 py-2.5 font-mono text-[11px] tracking-widest hover:bg-green-400 transition-colors disabled:opacity-40"
                    >
                      <Check size={13} /> CONFIRM SESSION
                    </button>
                    <button
                      onClick={() => handleAction('cancelled')}
                      disabled={loading}
                      className="flex items-center gap-2 border border-red-800/40 text-red-400 px-5 py-2.5 font-mono text-[11px] tracking-widest hover:bg-red-900/20 transition-colors disabled:opacity-40"
                    >
                      <X size={13} /> DECLINE
                    </button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => handleAction('completed')}
                      disabled={loading}
                      className="flex items-center gap-2 bg-ivory text-noir px-5 py-2.5 font-mono text-[11px] tracking-widest hover:bg-blue-400 transition-colors disabled:opacity-40"
                    >
                      <Check size={13} /> MARK COMPLETE
                    </button>
                    <button
                      onClick={() => handleAction('cancelled')}
                      disabled={loading}
                      className="flex items-center gap-2 border border-red-800/40 text-red-400 px-5 py-2.5 font-mono text-[11px] tracking-widest hover:bg-red-900/20 transition-colors disabled:opacity-40"
                    >
                      <X size={13} /> CANCEL
                    </button>
                  </>
                )}
                {(booking.status === 'completed' || booking.status === 'cancelled') && (
                  <p className="font-mono text-[10px] text-halide/40 tracking-widest pt-2">
                    {booking.status === 'completed' ? '✓ Session complete — client notified' : '✗ Cancelled — client notified'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    base44.entities.Booking.list('-created_date', 100).then(data => {
      setBookings(data);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-noir">
      <div className="pt-32 md:pt-40 pb-12">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4">STUDIO MANAGEMENT</p>
              <h1 className="font-display text-ivory text-5xl md:text-7xl leading-[0.9]">Bookings</h1>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 bg-ivory/10 border border-ivory/20 px-4 py-2 mb-2">
                <Clock size={13} className="text-ivory" />
                <span className="font-mono text-[11px] text-ivory tracking-widest">{pendingCount} PENDING</span>
              </div>
            )}
          </div>
          <p className="font-body text-halide/60 mt-6 text-sm">Confirming a booking automatically emails the client and updates your Outlook calendar.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-8">
        <div className="flex gap-0 border border-halide/20 w-fit overflow-x-auto">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 font-mono text-[10px] tracking-[0.15em] uppercase whitespace-nowrap transition-colors
                ${filter === f ? 'bg-ivory text-noir' : 'text-halide hover:text-ivory'}`}
            >
              {f}{f === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border border-halide border-t-ivory rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-mono text-[11px] text-halide/40 tracking-widest">NO BOOKINGS</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(booking => (
              <BookingRow key={booking.id} booking={booking} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
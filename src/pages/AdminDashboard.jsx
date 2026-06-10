import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, Clock, CheckCircle2, AlertCircle, CalendarDays, TrendingUp } from 'lucide-react';
import { format, isAfter, isBefore, addDays, parseISO } from 'date-fns';

const STATUS_CONFIG = {
  pending:          { label: 'Pending',          color: 'text-halide',     bg: 'bg-halide/10' },
  invoice_sent:     { label: 'Invoice Sent',      color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  confirmed:        { label: 'Confirmed',         color: 'text-green-400',  bg: 'bg-green-900/20' },
  selecting_photos: { label: 'Selecting Photos',  color: 'text-purple-400', bg: 'bg-purple-900/20' },
  editing:          { label: 'Editing',           color: 'text-blue-300',   bg: 'bg-blue-900/20' },
  completed:        { label: 'Completed',         color: 'text-blue-400',   bg: 'bg-blue-900/20' },
  cancelled:        { label: 'Cancelled',         color: 'text-red-400',    bg: 'bg-red-900/20' },
};

function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-halide/15 p-6 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] tracking-[0.3em] text-halide/50">{label}</p>
        <Icon size={14} className={accent || 'text-halide/30'} />
      </div>
      <p className={`font-display text-5xl ${accent || 'text-ivory'}`}>{value}</p>
      {sub && <p className="font-mono text-[10px] text-halide/50 tracking-wider">{sub}</p>}
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Booking.list('-created_date', 200).then(data => {
      setBookings(data);
      setLoading(false);
    });
  }, []);

  const today = new Date();
  const in48h = addDays(today, 2);
  const in7d = addDays(today, 7);

  const pending = bookings.filter(b => b.status === 'pending');
  const needsAction = bookings.filter(b => ['pending', 'editing'].includes(b.status));
  const upcoming = bookings.filter(b =>
    ['confirmed', 'selecting_photos'].includes(b.status) &&
    b.shoot_date &&
    isAfter(parseISO(b.shoot_date), today) &&
    isBefore(parseISO(b.shoot_date), in7d)
  );
  const shootingSoon = bookings.filter(b =>
    b.shoot_date &&
    isAfter(parseISO(b.shoot_date), today) &&
    isBefore(parseISO(b.shoot_date), in48h) &&
    b.status !== 'cancelled'
  );
  const active = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
  const completed = bookings.filter(b => b.status === 'completed');

  // Status breakdown
  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  // Upcoming shoots (next 30 days)
  const upcomingAll = bookings
    .filter(b => b.shoot_date && isAfter(parseISO(b.shoot_date), today) && b.status !== 'cancelled')
    .sort((a, b) => a.shoot_date.localeCompare(b.shoot_date))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center">
        <div className="w-6 h-6 border border-halide border-t-ivory rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noir">
      <div className="pt-32 md:pt-40 pb-12">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4">STUDIO OVERVIEW</p>
          <h1 className="font-display text-ivory text-5xl md:text-7xl leading-[0.9]">Dashboard</h1>
          <p className="font-body text-halide/60 mt-4 text-sm">{format(today, 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 space-y-10 pb-24">

        {/* Alert: shoots in 48h */}
        {shootingSoon.length > 0 && (
          <div className="border border-yellow-800/40 bg-yellow-900/10 px-6 py-4 flex items-center gap-3">
            <AlertCircle size={15} className="text-yellow-400 shrink-0" />
            <p className="font-mono text-[11px] text-yellow-400 tracking-widest">
              {shootingSoon.length} SHOOT{shootingSoon.length > 1 ? 'S' : ''} WITHIN 48 HOURS —{' '}
              {shootingSoon.map(b => b.client_name).join(', ')}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="NEEDS ATTENTION" value={needsAction.length} icon={AlertCircle} accent={needsAction.length > 0 ? 'text-yellow-400' : 'text-ivory'} sub={needsAction.length > 0 ? 'ACTION REQUIRED' : 'ALL CLEAR'} />
          <StatCard label="ACTIVE BOOKINGS" value={active.length} icon={Camera} sub="IN PROGRESS" />
          <StatCard label="THIS WEEK" value={upcoming.length} icon={CalendarDays} sub="UPCOMING SHOOTS" accent="text-green-400" />
          <StatCard label="COMPLETED" value={completed.length} icon={CheckCircle2} sub="ALL TIME" accent="text-blue-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Upcoming shoots */}
          <div className="border border-halide/15 p-6">
            <div className="flex items-center justify-between mb-6">
              <p className="font-mono text-[9px] tracking-[0.3em] text-halide/50">UPCOMING SHOOTS</p>
              <Link to="/admin/bookings" className="font-mono text-[9px] tracking-widest text-halide hover:text-ivory transition-colors flex items-center gap-1 group">
                VIEW ALL <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            {upcomingAll.length === 0 ? (
              <p className="font-mono text-[10px] text-halide/30 tracking-widest py-4">NO UPCOMING SHOOTS</p>
            ) : (
              <div className="space-y-3">
                {upcomingAll.map(b => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                  const daysUntil = Math.ceil((parseISO(b.shoot_date) - today) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={b.id} className="flex items-center justify-between py-3 border-t border-halide/10">
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-ivory text-sm truncate">{b.client_name}</p>
                        <p className="font-mono text-[10px] text-halide/50 mt-0.5">
                          {b.shoot_date}{b.shoot_time ? ` · ${b.shoot_time}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-[9px] text-halide/40">
                          {daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `${daysUntil}D`}
                        </span>
                        <span className={`font-mono text-[9px] tracking-widest px-2 py-1 border ${cfg.bg} ${cfg.color} border-current/20`}>
                          {cfg.label.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status breakdown */}
          <div className="border border-halide/15 p-6">
            <p className="font-mono text-[9px] tracking-[0.3em] text-halide/50 mb-6">BOOKINGS BY STATUS</p>
            <div className="space-y-3">
              {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                const count = statusCounts[status] || 0;
                const pct = bookings.length > 0 ? (count / bookings.length) * 100 : 0;
                return (
                  <div key={status} className="flex items-center gap-4">
                    <span className={`font-mono text-[9px] tracking-widest w-36 shrink-0 ${cfg.color}`}>{cfg.label.toUpperCase()}</span>
                    <div className="flex-1 h-[2px] bg-halide/10">
                      <div className={`h-full ${cfg.bg.replace('/20', '/60').replace('/10', '/60')}`} style={{ width: `${pct}%`, backgroundColor: undefined }} />
                    </div>
                    <span className="font-mono text-[10px] text-halide/50 w-6 text-right shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-halide/10 mt-6 pt-4 flex items-center justify-between">
              <span className="font-mono text-[9px] text-halide/30 tracking-widest">TOTAL</span>
              <span className="font-display text-ivory text-2xl">{bookings.length}</span>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/admin/bookings" className="border border-halide/15 hover:border-halide/40 px-6 py-5 flex items-center justify-between group transition-colors">
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] text-halide/50 mb-1">MANAGE</p>
              <p className="font-body text-ivory">All Bookings</p>
            </div>
            <ArrowRight size={14} className="text-halide group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/booking" className="border border-halide/15 hover:border-halide/40 px-6 py-5 flex items-center justify-between group transition-colors">
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] text-halide/50 mb-1">CREATE</p>
              <p className="font-body text-ivory">New Booking</p>
            </div>
            <ArrowRight size={14} className="text-halide group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
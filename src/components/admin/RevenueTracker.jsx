import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import {
  startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear,
  isAfter, parseISO
} from 'date-fns';

const PERIODS = [
  { key: 'daily',    label: 'Today' },
  { key: 'weekly',   label: 'This Week' },
  { key: 'monthly',  label: 'This Month' },
  { key: 'quarterly',label: 'This Quarter' },
  { key: 'ytd',      label: 'YTD' },
  { key: 'all',      label: 'All Time' },
];

function getPeriodStart(key) {
  const now = new Date();
  switch (key) {
    case 'daily':     return startOfDay(now);
    case 'weekly':    return startOfWeek(now, { weekStartsOn: 1 });
    case 'monthly':   return startOfMonth(now);
    case 'quarterly': return startOfQuarter(now);
    case 'ytd':       return startOfYear(now);
    default:          return null;
  }
}

export default function RevenueTracker({ bookings }) {
  const [period, setPeriod] = useState('ytd');

  const periodStart = getPeriodStart(period);

  const filtered = bookings.filter(b => {
    const hasPayment = (b.deposit_paid || 0) + (b.total_paid || 0) > 0;
    if (!hasPayment) return false;
    if (!periodStart) return true;
    const date = b.shoot_date ? parseISO(b.shoot_date) : (b.created_date ? new Date(b.created_date) : null);
    return date && isAfter(date, periodStart);
  });

  const totalDeposits = filtered.reduce((sum, b) => sum + (b.deposit_paid || 0), 0);
  const totalFull = filtered.reduce((sum, b) => sum + (b.total_paid || 0), 0);
  const grandTotal = totalDeposits + totalFull;

  const fmt = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="border border-halide/15 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <DollarSign size={13} className="text-green-400" />
          <p className="font-mono text-[9px] tracking-[0.3em] text-halide/50">REVENUE</p>
        </div>
        {/* Period tabs */}
        <div className="flex gap-0 border border-halide/20 overflow-x-auto">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 font-mono text-[9px] tracking-widest whitespace-nowrap transition-colors
                ${period === p.key ? 'bg-ivory text-noir' : 'text-halide hover:text-ivory'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-2 mb-6">
        <p className="font-display text-ivory text-5xl">{fmt(grandTotal)}</p>
        <p className="font-mono text-[9px] text-halide/40 tracking-widest mb-2">TOTAL RECEIVED</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-halide/5 border border-halide/10 px-4 py-3">
          <p className="font-mono text-[9px] tracking-widest text-halide/50 mb-1">DEPOSITS</p>
          <p className="font-display text-ivory text-2xl">{fmt(totalDeposits)}</p>
          <p className="font-mono text-[9px] text-halide/30 mt-1">{filtered.filter(b => b.deposit_paid > 0).length} BOOKINGS</p>
        </div>
        <div className="bg-halide/5 border border-halide/10 px-4 py-3">
          <p className="font-mono text-[9px] tracking-widest text-halide/50 mb-1">FULL PAYMENTS</p>
          <p className="font-display text-ivory text-2xl">{fmt(totalFull)}</p>
          <p className="font-mono text-[9px] text-halide/30 mt-1">{filtered.filter(b => b.total_paid > 0).length} BOOKINGS</p>
        </div>
      </div>
    </div>
  );
}
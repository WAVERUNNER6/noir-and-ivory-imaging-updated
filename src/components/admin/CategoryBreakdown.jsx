import React from 'react';
import { Camera, Building2, Users } from 'lucide-react';

const CATEGORIES = [
  {
    key: 'personal',
    label: 'Personal Events',
    icon: Users,
    color: 'text-purple-400',
    bg: 'bg-purple-900/20',
    border: 'border-purple-800/30',
    match: (b) => b.shoot_type === 'event' && (b.package_request || '').startsWith('Personal'),
  },
  {
    key: 'business',
    label: 'Business Events',
    icon: Camera,
    color: 'text-blue-300',
    bg: 'bg-blue-900/20',
    border: 'border-blue-800/30',
    match: (b) => b.shoot_type === 'event' && !(b.package_request || '').startsWith('Personal'),
  },
  {
    key: 'real_estate',
    label: 'Real Estate',
    icon: Building2,
    color: 'text-green-400',
    bg: 'bg-green-900/20',
    border: 'border-green-800/30',
    match: (b) => b.shoot_type === 'real_estate',
  },
];

export default function CategoryBreakdown({ bookings }) {
  const total = bookings.length;

  return (
    <div className="border border-halide/15 p-6">
      <p className="font-mono text-[9px] tracking-[0.3em] text-halide/50 mb-6">BOOKINGS BY CATEGORY</p>
      <div className="space-y-4">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const count = bookings.filter(cat.match).length;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={cat.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon size={12} className={cat.color} />
                  <span className={`font-mono text-[10px] tracking-widest ${cat.color}`}>{cat.label.toUpperCase()}</span>
                </div>
                <span className="font-mono text-[11px] text-ivory">{count}</span>
              </div>
              <div className="h-[3px] bg-halide/10 w-full">
                <div
                  className={`h-full transition-all duration-500 ${cat.bg}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="font-mono text-[9px] text-halide/30 mt-1">{pct.toFixed(0)}% OF TOTAL</p>
            </div>
          );
        })}
      </div>
      <div className="border-t border-halide/10 mt-5 pt-4 flex items-center justify-between">
        <span className="font-mono text-[9px] text-halide/30 tracking-widest">TOTAL</span>
        <span className="font-display text-ivory text-2xl">{total}</span>
      </div>
    </div>
  );
}
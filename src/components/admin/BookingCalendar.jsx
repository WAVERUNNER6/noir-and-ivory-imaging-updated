import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_DOT = {
  pending:          'bg-halide',
  invoice_sent:     'bg-yellow-400',
  confirmed:        'bg-green-400',
  selecting_photos: 'bg-purple-400',
  editing:          'bg-blue-300',
  completed:        'bg-blue-400',
  cancelled:        'bg-red-400',
};

export default function BookingCalendar({ bookings }) {
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the start with empty slots for correct day-of-week alignment
  const startPad = monthStart.getDay(); // 0=Sun

  const bookingsByDate = {};
  bookings.forEach(b => {
    if (!b.shoot_date) return;
    const key = b.shoot_date; // 'YYYY-MM-DD'
    if (!bookingsByDate[key]) bookingsByDate[key] = [];
    bookingsByDate[key].push(b);
  });

  const selectedBookings = selected ? (bookingsByDate[format(selected, 'yyyy-MM-dd')] || []) : [];

  return (
    <div className="border border-halide/15 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono text-[9px] tracking-[0.3em] text-halide/50">SHOOT CALENDAR</p>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrent(subMonths(current, 1))} className="text-halide/40 hover:text-ivory transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="font-mono text-[11px] text-ivory tracking-widest">
            {format(current, 'MMMM yyyy').toUpperCase()}
          </span>
          <button onClick={() => setCurrent(addMonths(current, 1))} className="text-halide/40 hover:text-ivory transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
          <div key={d} className="text-center font-mono text-[8px] text-halide/30 tracking-widest py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-px">
        {/* Padding for start of month */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDate[key] || [];
          const isSelected = selected && isSameDay(day, selected);
          const today = isToday(day);

          return (
            <button
              key={key}
              onClick={() => setSelected(isSelected ? null : day)}
              className={`relative flex flex-col items-center p-1.5 min-h-[44px] transition-colors
                ${isSelected ? 'bg-ivory/10' : 'hover:bg-halide/5'}
                ${today ? 'ring-1 ring-inset ring-halide/30' : ''}
              `}
            >
              <span className={`font-mono text-[11px] leading-none mb-1
                ${today ? 'text-ivory font-bold' : isSameMonth(day, current) ? 'text-ivory/70' : 'text-halide/20'}
              `}>
                {format(day, 'd')}
              </span>
              {dayBookings.length > 0 && (
                <div className="flex flex-wrap gap-[2px] justify-center">
                  {dayBookings.slice(0, 3).map((b, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[b.status] || 'bg-halide'}`} />
                  ))}
                  {dayBookings.length > 3 && (
                    <span className="font-mono text-[7px] text-halide/50">+{dayBookings.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day bookings */}
      {selected && (
        <div className="border-t border-halide/10 mt-4 pt-4">
          <p className="font-mono text-[9px] tracking-widest text-halide/50 mb-3">
            {format(selected, 'MMMM d, yyyy').toUpperCase()}
          </p>
          {selectedBookings.length === 0 ? (
            <p className="font-mono text-[10px] text-halide/30 tracking-widest">NO SHOOTS SCHEDULED</p>
          ) : (
            <div className="space-y-2">
              {selectedBookings.map(b => (
                <div key={b.id} className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[b.status] || 'bg-halide'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm text-ivory truncate">{b.client_name}</p>
                    <p className="font-mono text-[9px] text-halide/50">
                      {b.shoot_time || 'Time TBD'}{b.shoot_end_time ? ` — ${b.shoot_end_time}` : ''}
                      {b.location ? ` · ${b.location}` : ''}
                    </p>
                  </div>
                  <span className={`font-mono text-[8px] tracking-widest px-1.5 py-0.5 shrink-0
                    ${b.status === 'confirmed' ? 'text-green-400' :
                      b.status === 'pending' ? 'text-halide' :
                      b.status === 'cancelled' ? 'text-red-400' : 'text-blue-300'}
                  `}>
                    {b.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-halide/10">
        {[
          ['Pending', 'bg-halide'],
          ['Confirmed', 'bg-green-400'],
          ['Selecting', 'bg-purple-400'],
          ['Editing', 'bg-blue-300'],
          ['Completed', 'bg-blue-400'],
          ['Cancelled', 'bg-red-400'],
        ].map(([label, cls]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cls}`} />
            <span className="font-mono text-[8px] text-halide/40 tracking-wider">{label.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
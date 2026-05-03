import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isBefore, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export default function BookingCalendar({ selectedDate, onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="text-halide hover:text-ivory transition-colors p-2"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="font-mono text-sm text-ivory tracking-widest">
          {format(currentMonth, 'MMMM yyyy').toUpperCase()}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="text-halide hover:text-ivory transition-colors p-2"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center font-mono text-[10px] text-halide/50 tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const isPast = isBefore(day, today);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => !isPast && onSelectDate(day)}
              disabled={isPast}
              className={`
                aspect-square flex items-center justify-center font-mono text-xs transition-all duration-300
                ${isPast ? 'text-halide/20 cursor-not-allowed' : 'text-halide hover:text-ivory hover:bg-ivory/10 cursor-pointer'}
                ${isSelected ? 'bg-ivory text-noir' : ''}
                ${isTodayDate && !isSelected ? 'border border-halide/40' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
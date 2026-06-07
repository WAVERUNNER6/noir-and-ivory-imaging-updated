import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isBefore, isSameDay, addMonths, subMonths } from 'date-fns';
import { ArrowLeft, ArrowRight, Check, Camera, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const STEPS = ['TYPE', 'DATE', 'DETAILS', 'CONFIRM'];
const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

function ShootTypeSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { type: 'event', label: 'Event Photography', Icon: Camera, desc: 'Galas, weddings, corporate events, concerts' },
        { type: 'real_estate', label: 'Property Photography', Icon: Building2, desc: 'Residential, commercial, architectural' },
      ].map(({ type, label, Icon, desc }) => (
        <button key={type} onClick={() => onSelect(type)}
          className={`text-left p-8 border transition-all duration-300 ${selected === type ? 'border-ivory bg-ivory/5' : 'border-halide/20 hover:border-halide/50'}`}>
          <Icon size={24} className={selected === type ? 'text-ivory' : 'text-halide'} />
          <h3 className={`font-display text-2xl mt-4 ${selected === type ? 'text-ivory' : 'text-halide'}`}>{label}</h3>
          <p className="font-body text-sm text-halide/60 mt-2">{desc}</p>
        </button>
      ))}
    </div>
  );
}

function BookingCalendar({ selectedDate, onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [fullyBookedDates, setFullyBookedDates] = useState(new Set());
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startDay = getDay(startOfMonth(currentMonth));

  useEffect(() => {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    base44.entities.Booking.filter({ shoot_date: { $gte: start, $lte: end } }).then(bookings => {
      const slotsByDate = {};
      bookings.forEach(b => {
        if (b.shoot_time && b.status !== 'cancelled') {
          if (!slotsByDate[b.shoot_date]) slotsByDate[b.shoot_date] = new Set();
          slotsByDate[b.shoot_date].add(b.shoot_time);
        }
      });
      const fullyBooked = new Set(
        Object.entries(slotsByDate)
          .filter(([, slots]) => slots.size >= TIME_SLOTS.length)
          .map(([date]) => date)
      );
      setFullyBookedDates(fullyBooked);
    });
  }, [currentMonth]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-halide hover:text-ivory transition-colors p-2">
          <ChevronLeft size={20} />
        </button>
        <h3 className="font-mono text-sm text-ivory tracking-widest">{format(currentMonth, 'MMMM yyyy').toUpperCase()}</h3>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-halide hover:text-ivory transition-colors p-2">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map(d => <div key={d} className="text-center font-mono text-[10px] text-halide/50 tracking-widest py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
        {days.map((day) => {
          const isPast = isBefore(day, today);
          const dateStr = format(day, 'yyyy-MM-dd');
          const isFullyBooked = fullyBookedDates.has(dateStr);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isDisabled = isPast || isFullyBooked;
          return (
            <button key={day.toISOString()} onClick={() => !isDisabled && onSelectDate(day)} disabled={isDisabled}
              title={isFullyBooked ? 'Fully booked' : undefined}
              className={`aspect-square flex flex-col items-center justify-center font-mono text-xs transition-all duration-200 relative
                ${isDisabled ? 'cursor-not-allowed' : 'hover:text-ivory hover:bg-ivory/10 cursor-pointer'}
                ${isPast ? 'text-halide/20' : isFullyBooked ? 'text-halide/30' : 'text-halide'}
                ${isSelected ? 'bg-ivory !text-noir' : ''}
                ${isToday(day) && !isSelected ? 'border border-halide/40' : ''}`}>
              {format(day, 'd')}
              {isFullyBooked && !isPast && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-500/60" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-6 font-mono text-[10px] text-halide/50 tracking-wider">
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500/60 inline-block" /> FULLY BOOKED</span>
        <span className="flex items-center gap-2"><span className="w-2 h-2 bg-ivory inline-block" /> SELECTED</span>
      </div>
    </div>
  );
}

function BookingForm({ form, setForm, bookedSlots }) {
  return (
    <div className="space-y-6">
      {[
        { label: 'FULL NAME *', key: 'client_name', type: 'text', placeholder: 'Your full name' },
        { label: 'EMAIL *', key: 'client_email', type: 'email', placeholder: 'your@email.com' },
        { label: 'PHONE', key: 'client_phone', type: 'tel', placeholder: '+1 (555) 000-0000' },
        { label: 'LOCATION / VENUE', key: 'location', type: 'text', placeholder: 'Venue name or address' },
      ].map(({ label, key, type, placeholder }) => (
        <div key={key}>
          <label className="font-mono text-[11px] text-halide tracking-widest block mb-3">{label}</label>
          <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder}
            className="w-full bg-transparent border-b border-halide/30 pb-3 font-body text-ivory text-lg focus:outline-none focus:border-ivory transition-colors placeholder:text-halide/30" />
        </div>
      ))}
      <div>
        <label className="font-mono text-[11px] text-halide tracking-widest block mb-3">PACKAGE REQUEST</label>
        <select
          value={form.package_request || ''}
          onChange={e => setForm({ ...form, package_request: e.target.value })}
          className="w-full bg-noir border-b border-halide/30 pb-3 font-body text-ivory text-lg focus:outline-none focus:border-ivory transition-colors appearance-none cursor-pointer"
        >
          <option value="" disabled className="bg-noir text-halide">Select a package...</option>
          <optgroup label="Business Events" className="bg-noir text-halide font-mono text-xs">
            <option value="Business Events — Silver" className="bg-noir text-ivory">Silver — $850 (Up to 3 hours)</option>
            <option value="Business Events — Gold" className="bg-noir text-ivory">Gold — $1,450 (Up to 6 hours)</option>
            <option value="Business Events — Platinum" className="bg-noir text-ivory">Platinum — $2,200 (Full day)</option>
          </optgroup>
          <optgroup label="Personal Events" className="bg-noir text-halide font-mono text-xs">
            <option value="Personal Events — Celebrations" className="bg-noir text-ivory">Celebrations — Starting at $175</option>
            <option value="Personal Events — Wedding" className="bg-noir text-ivory">Wedding — Starting at $1,200</option>
          </optgroup>
          <optgroup label="Real Estate" className="bg-noir text-halide font-mono text-xs">
            <option value="Real Estate — Limited Time Special" className="bg-noir text-ivory">Limited Time Special — $350</option>
          </optgroup>
        </select>
      </div>
      <div>
        <label className="font-mono text-[11px] text-halide tracking-widest block mb-3">PREFERRED TIME</label>
        <div className="grid grid-cols-3 gap-2">
          {TIME_SLOTS.map(time => {
            const isBooked = bookedSlots.includes(time);
            return (
              <button key={time} type="button" onClick={() => !isBooked && setForm({ ...form, shoot_time: time })} disabled={isBooked}
                className={`py-2.5 font-mono text-[11px] tracking-wider border transition-all relative
                  ${isBooked
                    ? 'border-halide/10 text-halide/30 cursor-not-allowed'
                    : form.shoot_time === time
                      ? 'border-ivory bg-ivory/10 text-ivory'
                      : 'border-halide/20 text-halide hover:border-halide/50'}`}>
                {isBooked ? (
                  <span className="relative inline-block">
                    <span className="absolute inset-x-0 top-1/2 h-[1px] bg-halide/40 -translate-y-1/2" />
                    {time}
                  </span>
                ) : time}
                {isBooked && <span className="block text-[9px] tracking-wider mt-0.5 text-halide/30">RESERVED</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="font-mono text-[11px] text-halide tracking-widest block mb-3">ADDITIONAL DETAILS</label>
        <textarea rows={3} value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="Tell us about your project..."
          className="w-full bg-transparent border-b border-halide/30 pb-3 font-body text-ivory text-lg focus:outline-none focus:border-ivory transition-colors resize-none placeholder:text-halide/30" />
      </div>
    </div>
  );
}

const TAB_TO_SHOOT_TYPE = {
  business: 'event',
  personal: 'event',
  realestate: 'real_estate',
};

export default function Booking() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedPackage = urlParams.get('package');
  const preselectedTab = urlParams.get('tab');

  const initialShootType = preselectedTab ? (TAB_TO_SHOOT_TYPE[preselectedTab] || '') : '';
  const initialPackage = preselectedPackage
    ? `${preselectedTab === 'business' ? 'Business Events' : preselectedTab === 'personal' ? 'Personal Events' : 'Real Estate'} — ${preselectedPackage}`
    : '';

  const [step, setStep] = useState(preselectedPackage ? 1 : 0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [form, setForm] = useState({
    client_name: '', client_email: '', client_phone: '',
    shoot_type: initialShootType,
    shoot_time: '', location: '',
    package_request: initialPackage,
    details: ''
  });

  // Load booked time slots whenever selected date changes
  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    base44.entities.Booking.filter({ shoot_date: dateStr }).then(bookings => {
      const reserved = bookings
        .filter(b => b.status !== 'cancelled' && b.shoot_time)
        .map(b => b.shoot_time);
      setBookedSlots(reserved);
    });
  }, [selectedDate]);

  const canProceed = () => {
    if (step === 0) return !!form.shoot_type;
    if (step === 1) return !!selectedDate;
    if (step === 2) return !!(form.client_name && form.client_email);
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const shootDate = format(selectedDate, 'yyyy-MM-dd');
    await base44.entities.Booking.create({ ...form, shoot_date: shootDate, status: 'pending' });

    // Fire outlook notification without blocking the confirmation screen
    base44.functions.invoke('outlookBookingConfirmation', {
      booking: { ...form, shoot_date: shootDate },
    }).catch(() => {}); // non-blocking — don't let this hang the user

    toast.success('Booking request submitted!');
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border border-ivory mx-auto flex items-center justify-center mb-8">
            <Check size={24} className="text-ivory" />
          </div>
          <h2 className="font-display text-ivory text-4xl md:text-5xl mb-4">Capture Initiated</h2>
          <p className="font-body text-halide text-lg mb-2">{format(selectedDate, 'MMMM d, yyyy')}{form.shoot_time ? ` at ${form.shoot_time}` : ''}</p>
          <p className="font-body text-halide/60 mb-10">We'll reach out within 24 hours to confirm your session details.</p>
          <a href="/" className="inline-flex items-center gap-3 font-mono text-xs tracking-widest text-halide border-b border-halide pb-1 hover:text-ivory hover:border-ivory transition-colors">
            RETURN HOME
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noir">
      <div className="pt-32 md:pt-40 pb-12">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4">BOOKING</p>
          <h1 className="font-display text-ivory text-5xl md:text-7xl leading-[0.9]">Initiate Capture</h1>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="max-w-3xl mx-auto px-6 md:px-12 mb-12">
        <div className="flex items-center gap-4">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 flex items-center justify-center font-mono text-[10px] transition-colors ${i <= step ? 'bg-ivory text-noir' : 'border border-halide/30 text-halide/30'}`}>
                  {i < step || (i === 0 && !!preselectedPackage) ? <Check size={12} /> : i + 1}
                </div>
                <span className={`font-mono text-[10px] tracking-widest hidden sm:block ${i <= step ? 'text-ivory' : 'text-halide/30'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-[1px] ${i < step ? 'bg-ivory' : 'bg-halide/20'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-3xl mx-auto px-6 md:px-12 pb-24">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {step === 0 && (
              <div>
                <h2 className="font-display text-ivory text-3xl mb-8">Select shoot type</h2>
                <ShootTypeSelector selected={form.shoot_type} onSelect={type => setForm({ ...form, shoot_type: type })} />
              </div>
            )}
            {step === 1 && (
              <div>
                <h2 className="font-display text-ivory text-3xl mb-8">Choose your date</h2>
                <BookingCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                {selectedDate && <p className="font-mono text-ivory/60 text-sm mt-6 text-center">Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>}
              </div>
            )}
            {step === 2 && (
              <div>
                <h2 className="font-display text-ivory text-3xl mb-8">Your details</h2>
                <BookingForm form={form} setForm={setForm} bookedSlots={bookedSlots} />
              </div>
            )}
            {step === 3 && (
              <div>
                <h2 className="font-display text-ivory text-3xl mb-8">Review & confirm</h2>
                <div className="border border-halide/20 p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      ['SHOOT TYPE', form.shoot_type?.replace('_', ' ')],
                      ['DATE', selectedDate && format(selectedDate, 'MMMM d, yyyy')],
                      ['TIME', form.shoot_time || 'Flexible'],
                      ['LOCATION', form.location || 'TBD'],
                      ['PACKAGE', form.package_request || 'Not specified'],
                      ['NAME', form.client_name],
                      ['EMAIL', form.client_email],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="font-mono text-[10px] text-halide tracking-widest mb-1">{label}</p>
                        <p className="font-body text-ivory capitalize">{val}</p>
                      </div>
                    ))}
                  </div>
                  {form.details && (
                    <div>
                      <p className="font-mono text-[10px] text-halide tracking-widest mb-1">DETAILS</p>
                      <p className="font-body text-ivory/80">{form.details}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-12 pt-8 border-t border-halide/10">
          <button onClick={() => setStep(step - 1)} className={`flex items-center gap-2 font-mono text-xs tracking-widest text-halide hover:text-ivory transition-colors ${step === 0 || (step === 1 && !!preselectedPackage) ? 'invisible' : ''}`}>
            <ArrowLeft size={14} /> BACK
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canProceed()}
              className="flex items-center gap-2 bg-ivory text-noir px-8 py-3.5 font-mono text-xs tracking-[0.15em] hover:bg-halide hover:text-ivory transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              CONTINUE <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 bg-ivory text-noir px-10 py-4 font-mono text-xs tracking-[0.2em] hover:bg-halide hover:text-ivory transition-colors disabled:opacity-50">
              {submitting ? 'PROCESSING...' : 'INITIATE CAPTURE'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
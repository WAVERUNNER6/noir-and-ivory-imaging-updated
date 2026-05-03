import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ShootTypeSelector from '../components/booking/ShootTypeSelector';
import BookingCalendar from '../components/booking/BookingCalendar';
import BookingForm from '../components/booking/BookingForm';

const STEPS = ['TYPE', 'DATE', 'DETAILS', 'CONFIRM'];

export default function Booking() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    shoot_type: '',
    shoot_time: '',
    location: '',
    details: '',
  });

  const canProceed = () => {
    if (step === 0) return !!form.shoot_type;
    if (step === 1) return !!selectedDate;
    if (step === 2) return form.client_name && form.client_email;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await base44.entities.Booking.create({
      ...form,
      shoot_date: format(selectedDate, 'yyyy-MM-dd'),
      status: 'pending',
    });
    toast.success('Booking request submitted!');
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 border border-ivory mx-auto flex items-center justify-center mb-8">
            <Check size={24} className="text-ivory" />
          </div>
          <h2 className="font-display text-ivory text-4xl md:text-5xl mb-4">Capture Initiated</h2>
          <p className="font-body text-halide text-lg mb-2">
            {format(selectedDate, 'MMMM d, yyyy')} {form.shoot_time && `at ${form.shoot_time}`}
          </p>
          <p className="font-body text-halide/60 mb-10">
            We'll reach out within 24 hours to confirm your session details.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-3 font-mono text-xs tracking-widest text-halide border-b border-halide pb-1 hover:text-ivory hover:border-ivory transition-colors"
          >
            RETURN HOME
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noir">
      {/* Header */}
      <div className="pt-32 md:pt-40 pb-12">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4"
          >
            BOOKING
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-ivory text-5xl md:text-7xl leading-[0.9]"
          >
            Initiate Capture
          </motion.h1>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="max-w-3xl mx-auto px-6 md:px-12 mb-12">
        <div className="flex items-center gap-4">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 flex items-center justify-center font-mono text-[10px] transition-colors ${
                  i <= step ? 'bg-ivory text-noir' : 'border border-halide/30 text-halide/30'
                }`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className={`font-mono text-[10px] tracking-widest hidden sm:block ${
                  i <= step ? 'text-ivory' : 'text-halide/30'
                }`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-[1px] ${i < step ? 'bg-ivory' : 'bg-halide/20'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-3xl mx-auto px-6 md:px-12 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <div>
                <h2 className="font-display text-ivory text-3xl mb-8">Select shoot type</h2>
                <ShootTypeSelector selected={form.shoot_type} onSelect={(type) => setForm({ ...form, shoot_type: type })} />
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-display text-ivory text-3xl mb-8">Choose your date</h2>
                <BookingCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                {selectedDate && (
                  <p className="font-mono text-ivory/60 text-sm mt-6 text-center">
                    Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-display text-ivory text-3xl mb-8">Your details</h2>
                <BookingForm form={form} setForm={setForm} />
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-display text-ivory text-3xl mb-8">Review & confirm</h2>
                <div className="border border-halide/20 p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="font-mono text-[10px] text-halide tracking-widest mb-1">SHOOT TYPE</p>
                      <p className="font-body text-ivory capitalize">{form.shoot_type?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-halide tracking-widest mb-1">DATE</p>
                      <p className="font-body text-ivory">{selectedDate && format(selectedDate, 'MMMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-halide tracking-widest mb-1">TIME</p>
                      <p className="font-body text-ivory">{form.shoot_time || 'Flexible'}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-halide tracking-widest mb-1">LOCATION</p>
                      <p className="font-body text-ivory">{form.location || 'TBD'}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-halide tracking-widest mb-1">NAME</p>
                      <p className="font-body text-ivory">{form.client_name}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-halide tracking-widest mb-1">EMAIL</p>
                      <p className="font-body text-ivory">{form.client_email}</p>
                    </div>
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

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t border-halide/10">
          <button
            onClick={() => setStep(step - 1)}
            className={`flex items-center gap-2 font-mono text-xs tracking-widest text-halide hover:text-ivory transition-colors ${
              step === 0 ? 'invisible' : ''
            }`}
          >
            <ArrowLeft size={14} /> BACK
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-ivory text-noir px-8 py-3.5 font-mono text-xs tracking-[0.15em] hover:bg-halide hover:text-ivory transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              CONTINUE <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-ivory text-noir px-10 py-4 font-mono text-xs tracking-[0.2em] hover:bg-halide hover:text-ivory transition-colors disabled:opacity-50"
            >
              {submitting ? 'PROCESSING...' : 'INITIATE CAPTURE'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
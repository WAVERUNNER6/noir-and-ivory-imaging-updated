import React from 'react';

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

export default function BookingForm({ form, setForm }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="font-mono text-[11px] text-halide tracking-widest block mb-3">FULL NAME *</label>
        <input
          type="text"
          required
          value={form.client_name}
          onChange={(e) => setForm({ ...form, client_name: e.target.value })}
          className="w-full bg-transparent border-b border-halide/30 pb-3 font-body text-ivory text-lg focus:outline-none focus:border-ivory transition-colors placeholder:text-halide/30"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label className="font-mono text-[11px] text-halide tracking-widest block mb-3">EMAIL *</label>
        <input
          type="email"
          required
          value={form.client_email}
          onChange={(e) => setForm({ ...form, client_email: e.target.value })}
          className="w-full bg-transparent border-b border-halide/30 pb-3 font-body text-ivory text-lg focus:outline-none focus:border-ivory transition-colors placeholder:text-halide/30"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="font-mono text-[11px] text-halide tracking-widest block mb-3">PHONE</label>
        <input
          type="tel"
          value={form.client_phone}
          onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
          className="w-full bg-transparent border-b border-halide/30 pb-3 font-body text-ivory text-lg focus:outline-none focus:border-ivory transition-colors placeholder:text-halide/30"
          placeholder="+1 (555) 000-0000"
        />
      </div>

      <div>
        <label className="font-mono text-[11px] text-halide tracking-widest block mb-3">PREFERRED TIME</label>
        <div className="grid grid-cols-3 gap-2">
          {TIME_SLOTS.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => setForm({ ...form, shoot_time: time })}
              className={`py-2.5 font-mono text-[11px] tracking-wider border transition-all ${
                form.shoot_time === time
                  ? 'border-ivory bg-ivory/10 text-ivory'
                  : 'border-halide/20 text-halide hover:border-halide/50'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="font-mono text-[11px] text-halide tracking-widest block mb-3">LOCATION / VENUE</label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="w-full bg-transparent border-b border-halide/30 pb-3 font-body text-ivory text-lg focus:outline-none focus:border-ivory transition-colors placeholder:text-halide/30"
          placeholder="Venue name or address"
        />
      </div>

      <div>
        <label className="font-mono text-[11px] text-halide tracking-widest block mb-3">ADDITIONAL DETAILS</label>
        <textarea
          rows={3}
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
          className="w-full bg-transparent border-b border-halide/30 pb-3 font-body text-ivory text-lg focus:outline-none focus:border-ivory transition-colors resize-none placeholder:text-halide/30"
          placeholder="Tell us about your project..."
        />
      </div>
    </div>
  );
}
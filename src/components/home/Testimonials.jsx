import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "Noir & Ivory captured our corporate gala in a way that felt cinematic and timeless. Every frame told a story we didn't even know was happening.",
    author: "Marcus T.",
    role: "Event Director, Los Angeles",
  },
  {
    quote: "Our listing went from average to stunning overnight. The way they use light and contrast transformed spaces I walk through every day into something extraordinary.",
    author: "Priya S.",
    role: "Real Estate Agent, Beverly Hills",
  },
  {
    quote: "There's a stillness and intentionality to their work that you just don't find elsewhere. Booking them was one of the best decisions we made for our event.",
    author: "James & Elena R.",
    role: "Wedding Clients",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-ivory py-24 md:py-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-16">CLIENT WORDS</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              className="border-t border-noir/10 pt-8"
            >
              <p className="font-display text-noir text-2xl leading-relaxed mb-8 italic">
                "{t.quote}"
              </p>
              <div>
                <p className="font-mono text-[11px] text-noir tracking-widest">{t.author}</p>
                <p className="font-mono text-[10px] text-halide tracking-wider mt-1">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
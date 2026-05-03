import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="bg-ivory py-24 md:py-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-mono text-[11px] text-halide tracking-[0.3em] mb-8"
        >
          START YOUR PROJECT
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-display text-noir text-5xl md:text-7xl lg:text-8xl leading-[0.9] max-w-4xl mx-auto mb-12"
        >
          Ready to initiate<br />
          <span className="text-halide">your capture?</span>
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link
            to="/booking"
            className="inline-flex items-center gap-4 bg-noir text-ivory px-12 py-5 font-mono text-xs tracking-[0.2em] hover:bg-halide transition-colors group"
          >
            BOOK A SESSION
            <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
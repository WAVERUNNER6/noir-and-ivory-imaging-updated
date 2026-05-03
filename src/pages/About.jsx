import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-noir pt-32 md:pt-40 pb-24 md:pb-40">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4"
          >
            ABOUT US
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-ivory text-5xl md:text-7xl lg:text-8xl leading-[0.9] max-w-4xl"
          >
            The eye behind<br />
            <span className="text-halide">the lens</span>
          </motion.h1>
        </div>
      </div>

      {/* Story Section */}
      <div className="bg-ivory py-24 md:py-40">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-5">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="font-mono text-[11px] text-halide tracking-[0.3em] mb-6"
              >
                OUR STORY
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-display text-noir text-4xl md:text-5xl leading-[1] mb-8"
              >
                Born from a passion for light and shadow
              </motion.h2>
            </div>
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="font-body text-lg text-noir/60 leading-relaxed">
                  Noir & Ivory Imaging was founded on a simple belief: photography is not about 
                  capturing what is — it's about revealing what could be. We see the world in 
                  contrasts, in the interplay between darkness and light, between silence and 
                  movement.
                </p>
                <p className="font-body text-lg text-noir/60 leading-relaxed">
                  Our dual focus on event and real estate photography stems from a fascination 
                  with two fundamental aspects of human experience — the moments we share and 
                  the spaces we inhabit. In both, we find stories waiting to be told through 
                  the language of light.
                </p>
                <p className="font-body text-lg text-noir/60 leading-relaxed">
                  Based in Los Angeles, we bring a cinematic sensibility to every shoot. 
                  Our monochromatic approach isn't a limitation — it's a liberation. By 
                  stripping away color, we reveal the essential architecture of each moment, 
                  the raw geometry of emotion and space.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="bg-noir py-24 md:py-40">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-mono text-[11px] text-halide tracking-[0.3em] mb-12"
          >
            THE PROCESS
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {[
              {
                num: '01',
                title: 'Consultation',
                desc: 'We begin with a detailed conversation to understand your vision, the space, and the story you want to tell.',
              },
              {
                num: '02',
                title: 'The Capture',
                desc: 'On the day, we work with precision and intuition — reading light, anticipating moments, and composing each frame with intention.',
              },
              {
                num: '03',
                title: 'The Develop',
                desc: 'Every image is meticulously processed in our digital darkroom, crafting the final visual narrative with care and artistry.',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="border-t border-halide/20 pt-8"
              >
                <p className="font-mono text-halide text-sm mb-4">{step.num}</p>
                <h3 className="font-display text-ivory text-3xl mb-4">{step.title}</h3>
                <p className="font-body text-halide/80 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-ivory py-24">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 text-center">
          <h2 className="font-display text-noir text-4xl md:text-6xl mb-8">
            Let's create together
          </h2>
          <Link
            to="/booking"
            className="inline-flex items-center gap-4 bg-noir text-ivory px-12 py-5 font-mono text-xs tracking-[0.2em] hover:bg-halide transition-colors group"
          >
            BOOK A SESSION
            <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
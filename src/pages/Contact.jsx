import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MapPin, Mail, Phone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: 'hello@noirandivory.com',
      subject: `Contact Form: ${form.name}`,
      body: `Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
    });
    toast.success('Message sent successfully');
    setForm({ name: '', email: '', message: '' });
    setSending(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-noir pt-32 md:pt-40 pb-24 md:pb-32">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4">
            
            GET IN TOUCH
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-ivory text-5xl md:text-7xl lg:text-8xl leading-[0.9]">
            
            Contact
          </motion.h1>
        </div>
      </div>

      {/* Contact Content */}
      <div className="bg-ivory py-24 md:py-40">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Info */}
            <div>
              <h2 className="font-display text-noir text-3xl md:text-4xl mb-8">
                Let's discuss your vision
              </h2>
              <p className="font-body text-noir/60 text-lg leading-relaxed mb-12">
                Whether you have a grand event approaching or a property ready to be showcased,
                we'd love to hear from you. Reach out and let's start creating something extraordinary.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 border border-noir/10 flex items-center justify-center">
                    <MapPin size={16} className="text-noir/40" />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] text-halide tracking-widest mb-1">LOCATION</p>
                    <p className="font-body text-noir">Los Angeles, California</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 border border-noir/10 flex items-center justify-center">
                    <Mail size={16} className="text-noir/40" />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] text-halide tracking-widest mb-1">EMAIL</p>
                    <a href="mailto:hello@noirandivory.com" className="font-body text-noir hover:text-halide transition-colors">noirandivoryimaging

                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 border border-noir/10 flex items-center justify-center">
                    <Phone size={16} className="text-noir/40" />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] text-halide tracking-widest mb-1">PHONE</p>
                    <p className="font-body text-noir">(310) 924</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-8">
              
              <div>
                <label className="font-mono text-[11px] text-halide tracking-widest block mb-3">YOUR NAME</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-transparent border-b border-noir/20 pb-3 font-body text-noir text-lg focus:outline-none focus:border-noir transition-colors"
                  placeholder="John Doe" />
                
              </div>
              <div>
                <label className="font-mono text-[11px] text-halide tracking-widest block mb-3">YOUR EMAIL</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-transparent border-b border-noir/20 pb-3 font-body text-noir text-lg focus:outline-none focus:border-noir transition-colors"
                  placeholder="john@example.com" />
                
              </div>
              <div>
                <label className="font-mono text-[11px] text-halide tracking-widest block mb-3">MESSAGE</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-transparent border-b border-noir/20 pb-3 font-body text-noir text-lg focus:outline-none focus:border-noir transition-colors resize-none"
                  placeholder="Tell us about your project..." />
                
              </div>
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-3 bg-noir text-ivory px-10 py-4 font-mono text-xs tracking-[0.2em] hover:bg-halide transition-colors disabled:opacity-50">
                
                {sending ? 'SENDING...' : 'SEND MESSAGE'}
                <Send size={14} />
              </button>
            </motion.form>
          </div>
        </div>
      </div>
    </div>);

}
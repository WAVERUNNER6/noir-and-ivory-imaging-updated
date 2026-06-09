import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-noir text-ivory">
      {/* Brand Display */}
      <div className="border-t border-halide/20">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-16 md:py-24">
          <div className="overflow-hidden">
            <h2 className="font-display text-5xl sm:text-7xl md:text-[10vw] leading-[0.85] text-ivory/10 select-none">
              NOIR & IVORY
            </h2>
          </div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="border-t border-halide/20">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <p className="font-mono text-xs text-halide tracking-widest uppercase mb-4">Navigation</p>
              <div className="flex flex-col gap-3">
                {[
                { label: 'Events', path: '/events' },
                { label: 'Real Estate', path: '/real-estate' },
                { label: 'About', path: '/about' },
                { label: 'Contact', path: '/contact' },
                { label: 'Book a Session', path: '/booking' }].
                map((link) =>
                <Link
                  key={link.path}
                  to={link.path}
                  className="font-body text-sm text-ivory/60 hover:text-ivory transition-colors flex items-center gap-1 group">
                  
                    {link.label}
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                )}
              </div>
            </div>

            <div>
              <p className="font-mono text-xs text-halide tracking-widest uppercase mb-4">Services</p>
              <div className="flex flex-col gap-3">
                <span className="font-body text-sm text-ivory/60">Event Photography</span>
                <span className="font-body text-sm text-ivory/60">Real Estate Photography</span>
                <span className="font-body text-sm text-ivory/60">Architectural Photography</span>
                <span className="font-body text-sm text-ivory/60">Corporate Events</span>
              </div>
            </div>

            <div>
              <p className="font-mono text-xs text-halide tracking-widest uppercase mb-4">Contact</p>
              <div className="flex flex-col gap-3">
                <a href="mailto:studio@noirandivoryimaging.com" className="font-body text-sm text-ivory/60 hover:text-ivory transition-colors">studio@noirandivoryimaging.com</a>
                <span className="font-body text-sm text-ivory/60">instagram.com/_noirandivoryimaging_</span>
                <span className="font-body text-sm text-ivory/60">Los Angeles, CA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-halide/20">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-mono text-[11px] text-halide/60 tracking-wider">
            © {new Date().getFullYear()} NOIR & IVORY IMAGING. ALL RIGHTS RESERVED.
          </p>
          <p className="font-mono text-[11px] text-halide/60 tracking-wider">
            CAPTURING LIGHT. DEFINING SPACE.
          </p>
        </div>
      </div>
    </footer>);

}
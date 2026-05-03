import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-noir flex items-center justify-center px-6">
      <div className="text-center">
        <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4">ERROR 404</p>
        <h1 className="font-display text-ivory text-6xl md:text-8xl mb-6">Lost Frame</h1>
        <p className="font-body text-halide text-lg mb-10 max-w-md mx-auto">
          This page doesn't exist in our collection. Let's get you back to the gallery.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-3 bg-ivory text-noir px-10 py-4 font-mono text-xs tracking-[0.2em] hover:bg-halide hover:text-ivory transition-colors"
        >
          <ArrowLeft size={14} /> RETURN HOME
        </Link>
      </div>
    </div>
  );
}
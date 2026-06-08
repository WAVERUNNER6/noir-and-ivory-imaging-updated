import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, Check, ChevronLeft, ChevronRight, X, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import SignaturePad from '@/components/portal/SignaturePad';

const PHOTO_LIMITS = {
  'Business Events \u2014 Silver': 50,
  'Business Events \u2014 Gold': 100,
  'Business Events \u2014 Platinum': 150,
  'Personal Events \u2014 Celebrations': 15,
  'Personal Events \u2014 Wedding': 50,
  'Real Estate \u2014 Limited Time Special': 25,
};

function getPhotoLimit(pkg) {
  return PHOTO_LIMITS[pkg] || 25;
}

function InvoiceStep({ booking, portalToken, onDone }) {
  const [uploading, setUploading] = useState(false);

  const handleSigned = async (signatureFile) => {
    setUploading(true);

    // If there's an original invoice PDF, embed the signature into it
    let finalFile = signatureFile;
    if (booking.invoice_url) {
      try {
        const { PDFDocument } = await import('pdf-lib');
        const pdfRes = await fetch(booking.invoice_url);
        const pdfBytes = await pdfRes.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Convert signature PNG to array buffer
        const sigBytes = await signatureFile.arrayBuffer();
        const sigImage = await pdfDoc.embedPng(sigBytes);

        const pages = pdfDoc.getPages();
        const page = pages[0];
        const { height } = page.getSize();

        // Signature box coordinates matching InvoiceGenerator layout
        const sigBoxX = 40;
        const sigBoxY = height - 510;
        const sigBoxW = 320;
        const sigBoxH = 60;

        // Draw date signed
        const dateSigned = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const { StandardFonts } = await import('pdf-lib');
        const reg = await pdfDoc.embedFont(StandardFonts.Helvetica);
        page.drawText(dateSigned, { x: 384, y: sigBoxY + 12, font: reg, size: 10, color: { type: 'RGB', red: 26/255, green: 26/255, blue: 26/255 } });

        // Embed signature image into the signature box
        page.drawImage(sigImage, {
          x: sigBoxX + 8,
          y: sigBoxY + 8,
          width: sigBoxW - 16,
          height: sigBoxH - 16,
        });

        const signedPdfBytes = await pdfDoc.save();
        const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
        finalFile = new File([blob], 'signed-invoice.pdf', { type: 'application/pdf' });
      } catch (e) {
        // If PDF embedding fails, fall back to just saving the signature image
        console.warn('PDF embed failed, saving signature image instead', e);
      }
    }

    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: finalFile });
    await base44.functions.invoke('clientPortalAction', {
      portal_token: portalToken,
      action: 'upload_signed_invoice',
      data: { file_uri },
    });
    toast.success('Signature submitted. Your booking is now confirmed!');
    onDone();
    setUploading(false);
  };

  // Already signed — show confirmation
  if (booking.signed_invoice_url) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
          <Check size={22} className="text-green-400" />
        </div>
        <h2 className="font-display text-ivory text-3xl mb-3">Invoice Signed</h2>
        <p className="font-body text-halide/70">Your signed invoice has been received. Your booking is confirmed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="font-display text-ivory text-4xl mb-3">Review &amp; Sign Your Invoice</h2>
      <p className="font-body text-halide/70 mb-8 leading-relaxed">
        Review your invoice below, then draw your signature to confirm your booking.
      </p>

      {/* Step 1 — View Invoice */}
      <div className="mb-8">
        <p className="font-mono text-[9px] tracking-[0.25em] text-halide/50 mb-3">STEP 1 — REVIEW YOUR INVOICE</p>
        {booking.invoice_url ? (
          <div className="border border-halide/20 bg-halide/5 p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-halide shrink-0" />
              <div>
                <p className="font-mono text-[11px] text-ivory tracking-wider">INVOICE</p>
                <p className="font-mono text-[10px] text-halide/50 mt-0.5">{booking.shoot_date} &middot; {booking.package_request || booking.shoot_type}</p>
              </div>
            </div>
            <a
              href={booking.invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-halide/30 text-halide px-4 py-2.5 font-mono text-[10px] tracking-widest hover:border-ivory hover:text-ivory transition-colors shrink-0"
            >
              <Download size={12} /> VIEW
            </a>
          </div>
        ) : (
          <div className="border border-halide/10 p-5 text-center">
            <p className="font-mono text-[10px] text-halide/40 tracking-widest">Invoice will appear here once sent by your photographer.</p>
          </div>
        )}
      </div>

      {/* Step 2 — Draw Signature */}
      <div>
        <p className="font-mono text-[9px] tracking-[0.25em] text-halide/50 mb-3">STEP 2 — SIGN BELOW</p>
        {uploading ? (
          <div className="flex items-center justify-center gap-3 py-10 border border-halide/20">
            <Loader2 size={16} className="animate-spin text-halide" />
            <span className="font-mono text-[11px] text-halide tracking-widest">SUBMITTING...</span>
          </div>
        ) : (
          <SignaturePad onSigned={handleSigned} />
        )}
      </div>
    </div>
  );
}

function PhotoSelectionStep({ booking, gallery, rawPhotoUrls, portalToken, onDone }) {
  const limit = getPhotoLimit(booking.package_request);
  const [selected, setSelected] = useState(new Set(gallery.selected_photos || []));
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const alreadySubmitted = !!gallery.selection_submitted_at;

  const toggle = (i) => {
    if (alreadySubmitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else if (next.size < limit) {
        next.add(i);
      } else {
        toast.error(`You can only select ${limit} photos with your package.`);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) { toast.error('Please select at least one photo.'); return; }
    setSubmitting(true);
    await base44.functions.invoke('clientPortalAction', {
      portal_token: portalToken,
      action: 'submit_photo_selection',
      data: { gallery_id: gallery.id, selected_indices: Array.from(selected) },
    });
    toast.success('Your selection has been submitted!');
    onDone();
    setSubmitting(false);
  };

  const prevLightbox = () => setLightbox(i => (i > 0 ? i - 1 : rawPhotoUrls.length - 1));
  const nextLightbox = () => setLightbox(i => (i < rawPhotoUrls.length - 1 ? i + 1 : 0));

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-ivory text-4xl mb-3">
          {alreadySubmitted ? 'Your Selection' : 'Choose Your Photos'}
        </h2>
        <p className="font-body text-halide/70 leading-relaxed">
          {alreadySubmitted
            ? `You selected ${selected.size} photo${selected.size !== 1 ? 's' : ''} for editing. We will notify you when they are ready.`
            : `Select up to ${limit} photos to be edited. Your package: ${booking.package_request || 'Standard'}.`}
        </p>
        {!alreadySubmitted && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-halide/10">
              <div className="h-full bg-ivory/60 transition-all" style={{ width: `${(selected.size / limit) * 100}%` }} />
            </div>
            <span className="font-mono text-[11px] text-halide tracking-wider shrink-0">{selected.size} / {limit}</span>
          </div>
        )}
      </div>

      <div className="columns-2 sm:columns-3 lg:columns-4 gap-2 space-y-2 mb-10">
        {rawPhotoUrls.map((url, i) => {
          const isSelected = selected.has(i);
          return (
            <div key={i} className="break-inside-avoid relative group cursor-pointer" onClick={() => toggle(i)}>
              <img src={url} alt={`Photo ${i + 1}`}
                className={`w-full object-cover transition-all duration-200 ${isSelected ? 'brightness-110' : 'brightness-75 group-hover:brightness-90'}`} />
              <div className={`absolute inset-0 border-2 transition-colors ${isSelected ? 'border-ivory' : 'border-transparent'}`} />
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-ivory flex items-center justify-center">
                  <Check size={13} className="text-noir" />
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox(i); }}
                className="absolute bottom-2 right-2 bg-noir/70 text-ivory/70 hover:text-ivory px-2 py-1 font-mono text-[9px] tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
              >
                VIEW
              </button>
              <span className="absolute bottom-2 left-2 font-mono text-[9px] text-ivory/50">{i + 1}</span>
            </div>
          );
        })}
      </div>

      {!alreadySubmitted && selected.size > 0 && (
        <div className="sticky bottom-6 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-ivory text-noir px-10 py-4 font-mono text-[11px] tracking-[0.2em] hover:bg-halide hover:text-ivory transition-colors disabled:opacity-40 flex items-center gap-2 shadow-2xl"
          >
            {submitting
              ? <><Loader2 size={13} className="animate-spin" /> SUBMITTING...</>
              : `SUBMIT ${selected.size} PHOTO${selected.size !== 1 ? 'S' : ''} FOR EDITING`}
          </button>
        </div>
      )}

      <AnimatePresence>
        {lightbox !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-noir/95 z-50 flex items-center justify-center"
            onClick={() => setLightbox(null)}>
            <button onClick={(e) => { e.stopPropagation(); prevLightbox(); }}
              className="absolute left-4 text-halide hover:text-ivory p-2"><ChevronLeft size={28} /></button>
            <motion.img key={lightbox} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              src={rawPhotoUrls[lightbox]} alt=""
              className="max-h-[88vh] max-w-[88vw] object-contain"
              onClick={e => e.stopPropagation()} />
            <button onClick={(e) => { e.stopPropagation(); nextLightbox(); }}
              className="absolute right-4 text-halide hover:text-ivory p-2"><ChevronRight size={28} /></button>
            <button onClick={() => setLightbox(null)} className="absolute top-5 right-5 text-halide hover:text-ivory"><X size={22} /></button>
            <p className="absolute bottom-5 font-mono text-[11px] text-halide/50">{lightbox + 1} / {rawPhotoUrls.length}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FinalGalleryStep({ editedPhotoUrls }) {
  const [lightbox, setLightbox] = useState(null);
  const prev = () => setLightbox(i => (i > 0 ? i - 1 : editedPhotoUrls.length - 1));
  const next = () => setLightbox(i => (i < editedPhotoUrls.length - 1 ? i + 1 : 0));

  return (
    <div>
      <h2 className="font-display text-ivory text-4xl mb-3">Your Gallery</h2>
      <p className="font-body text-halide/70 mb-8">{editedPhotoUrls.length} edited image{editedPhotoUrls.length !== 1 ? 's' : ''} ready for you.</p>
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-2 space-y-2">
        {editedPhotoUrls.map((url, i) => (
          <div key={i} className="break-inside-avoid cursor-pointer overflow-hidden group" onClick={() => setLightbox(i)}>
            <img src={url} alt={`Photo ${i + 1}`}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        ))}
      </div>
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-noir/95 z-50 flex items-center justify-center"
            onClick={() => setLightbox(null)}>
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 text-halide hover:text-ivory p-2"><ChevronLeft size={28} /></button>
            <motion.img key={lightbox} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              src={editedPhotoUrls[lightbox]} alt=""
              className="max-h-[88vh] max-w-[88vw] object-contain"
              onClick={e => e.stopPropagation()} />
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 text-halide hover:text-ivory p-2"><ChevronRight size={28} /></button>
            <button onClick={() => setLightbox(null)} className="absolute top-5 right-5 text-halide hover:text-ivory"><X size={22} /></button>
            <p className="absolute bottom-5 font-mono text-[11px] text-halide/50">{lightbox + 1} / {editedPhotoUrls.length}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ClientPortal() {
  const token = new URLSearchParams(window.location.search).get('token');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    if (!token) { setError('Invalid portal link.'); setLoading(false); return; }
    const res = await base44.functions.invoke('clientPortalData', { portal_token: token });
    if (res.data?.error) { setError('Portal not found or link has expired.'); }
    else { setData(res.data); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-noir flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-halide" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-noir flex items-center justify-center px-6">
      <div className="text-center">
        <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4">CLIENT PORTAL</p>
        <h2 className="font-display text-ivory text-4xl mb-4">Link Not Found</h2>
        <p className="font-body text-halide/60">{error}</p>
      </div>
    </div>
  );

  const { booking, gallery, raw_photo_urls, edited_photo_urls } = data;
  const status = booking.status;

  const renderStep = () => {
    if (status === 'invoice_sent' || status === 'pending') {
      return <InvoiceStep booking={booking} portalToken={token} onDone={load} />;
    }
    if (status === 'selecting_photos' && gallery && raw_photo_urls.length > 0) {
      return <PhotoSelectionStep booking={booking} gallery={gallery} rawPhotoUrls={raw_photo_urls} portalToken={token} onDone={load} />;
    }
    if (status === 'editing') {
      return (
        <div className="text-center py-16">
          <div className="w-14 h-14 border border-halide/30 flex items-center justify-center mx-auto mb-6">
            <Loader2 size={20} className="text-halide animate-spin" />
          </div>
          <h2 className="font-display text-ivory text-3xl mb-3">Editing in Progress</h2>
          <p className="font-body text-halide/70">Your selected photos are being edited. We will email you when they are ready.</p>
        </div>
      );
    }
    if (status === 'completed' && edited_photo_urls.length > 0) {
      return <FinalGalleryStep editedPhotoUrls={edited_photo_urls} />;
    }
    if (status === 'confirmed') {
      return (
        <div className="text-center py-16">
          <div className="w-14 h-14 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
            <Check size={22} className="text-green-400" />
          </div>
          <h2 className="font-display text-ivory text-3xl mb-3">Booking Confirmed</h2>
          <p className="font-body text-halide/70">Your session is confirmed for {booking.shoot_date}. We will be in touch soon.</p>
        </div>
      );
    }
    if (status === 'cancelled') {
      return (
        <div className="text-center py-16">
          <h2 className="font-display text-ivory text-3xl mb-3">Booking Cancelled</h2>
          <p className="font-body text-halide/70">This booking has been cancelled. Please contact us if you would like to rebook.</p>
        </div>
      );
    }
    return (
      <div className="text-center py-16">
        <p className="font-mono text-[11px] text-halide/40 tracking-widest">NOTHING TO ACTION RIGHT NOW</p>
        <p className="font-body text-halide/50 mt-3 text-sm">We will email you when there is something for you here.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-noir">
      <div className="pt-16 pb-10 px-6 md:px-12 max-w-[1400px] mx-auto border-b border-halide/10">
        <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-3">NOIR &amp; IVORY IMAGING &mdash; CLIENT PORTAL</p>
        <h1 className="font-display text-ivory text-4xl md:text-5xl leading-tight">{booking.client_name}</h1>
        <p className="font-mono text-[11px] text-halide/50 tracking-wider mt-2">{booking.shoot_date} &middot; {booking.package_request || booking.shoot_type}</p>
      </div>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-14 pb-28">
        {renderStep()}
      </div>
    </div>
  );
}
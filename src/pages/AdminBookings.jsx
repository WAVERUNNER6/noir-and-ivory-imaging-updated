import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Check, X, Camera, Building2, Clock, ChevronDown, Paperclip, Send, Loader2, Upload, Image, FileText, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceLineItemModal from '@/components/admin/InvoiceLineItemModal.jsx';
import EditedPhotoUploader from '@/components/admin/EditedPhotoUploader.jsx';
import GalleryViewer from '@/components/admin/GalleryViewer.jsx';
import EmailStatusIndicator from '@/components/admin/EmailStatusIndicator.jsx';

const STATUS_CONFIG = {
  pending:          { label: 'PENDING',          bg: 'bg-halide/10',     text: 'text-halide',     border: 'border-halide/30' },
  invoice_sent:     { label: 'INVOICE SENT',      bg: 'bg-yellow-900/20', text: 'text-yellow-400', border: 'border-yellow-800/40' },
  confirmed:        { label: 'CONFIRMED',         bg: 'bg-green-900/20',  text: 'text-green-400',  border: 'border-green-800/40' },
  selecting_photos: { label: 'SELECTING PHOTOS',  bg: 'bg-purple-900/20', text: 'text-purple-400', border: 'border-purple-800/40' },
  editing:          { label: 'EDITING',           bg: 'bg-blue-900/20',   text: 'text-blue-300',   border: 'border-blue-800/40' },
  completed:        { label: 'COMPLETED',         bg: 'bg-blue-900/20',   text: 'text-blue-400',   border: 'border-blue-800/40' },
  cancelled:        { label: 'CANCELLED',         bg: 'bg-red-900/20',    text: 'text-red-400',    border: 'border-red-800/40' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-3 py-1 border font-mono text-[10px] tracking-widest ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

const BATCH_SIZE = 5;
async function uploadBatch(files) {
  return Promise.all(
    files.map(file => base44.integrations.Core.UploadPrivateFile({ file }).then(r => ({ uri: r.file_uri })))
  );
}

function PhotoPreviewThumbnail({ fileUri, onDelete }) {
  const [signedUrl, setSignedUrl] = useState(null);

  useEffect(() => {
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 3600 })
      .then(r => setSignedUrl(r.signed_url))
      .catch(() => {});
  }, [fileUri]);

  return (
    <div className="relative group">
      {signedUrl ? (
        <img src={signedUrl} alt="preview" className="w-full aspect-square object-cover border border-halide/20" />
      ) : (
        <div className="w-full aspect-square bg-halide/10 border border-halide/20 flex items-center justify-center">
          <Loader2 size={12} className="animate-spin text-halide/30" />
        </div>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 hover:bg-red-600 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function RawPhotoUploader({ booking, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [sending, setSending] = useState(false);
  const [gallery, setGallery] = useState(null);
  const fileInputRef = useRef();

  // Load gallery on mount
  useEffect(() => {
    base44.entities.Gallery.filter({ booking_id: booking.id }).then(gs => {
      if (gs.length) setGallery(gs[0]);
    });
  }, [booking.id]);



  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;
    setUploading(true);
    setProgress({ done: 0, total: fileArray.length });

    // Get or create gallery
    let galleries = await base44.entities.Gallery.filter({ booking_id: booking.id });
    let gallery = galleries[0];
    if (!gallery) {
      const token = Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
      // Expires 7 days from now
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      gallery = await base44.entities.Gallery.create({
        booking_id: booking.id,
        client_name: booking.client_name,
        client_email: booking.client_email,
        shoot_date: booking.shoot_date,
        shoot_type: booking.shoot_type,
        package_request: booking.package_request,
        access_token: token,
        photos: [],
        videos: [],
        edited_photos: [],
        phase: 'raw',
        expires_at: expiresAt,
      });
    }

    const newUris = [];
    for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
      const batch = fileArray.slice(i, i + BATCH_SIZE);
      const results = await uploadBatch(batch);
      results.forEach(({ uri }) => newUris.push(uri));
      setProgress({ done: Math.min(i + BATCH_SIZE, fileArray.length), total: fileArray.length });
    }

    const updated = [...(gallery.photos || []), ...newUris];
    await base44.entities.Gallery.update(gallery.id, { photos: updated, phase: 'raw' });
    setGallery(prev => prev ? { ...prev, photos: updated } : null);
    toast.success(`Uploaded ${newUris.length} raw photo${newUris.length !== 1 ? 's' : ''}`);
    setUploading(false);
    onUploaded && onUploaded(gallery.id, updated.length);
  };

  const handleSendSelectionLink = async () => {
    setSending(true);
    const appUrl = window.location.origin;
    await base44.functions.invoke('sendClientPortalLink', { booking_id: booking.id, app_url: appUrl, purpose: 'photo_selection' });
    await base44.entities.Booking.update(booking.id, { status: 'selecting_photos' });
    toast.success(`Photo selection link sent to ${booking.client_email}`);
    onUploaded && onUploaded(null, null, 'selecting_photos');
    setSending(false);
  };

  return (
    <div className="space-y-3 mt-4">
      <p className="font-mono text-[9px] tracking-widest text-halide/50">UPLOAD RAW PHOTOS FOR CLIENT SELECTION</p>
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        className="border border-dashed border-halide/20 hover:border-halide/40 transition-colors p-5 text-center cursor-pointer"
      >
        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
          onChange={e => handleFiles(e.target.files)} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={14} className="animate-spin text-halide" />
            <span className="font-mono text-[10px] text-halide tracking-wider">UPLOADING {progress.done} / {progress.total}</span>
            <div className="w-40 h-[2px] bg-halide/10">
              <div className="h-full bg-halide/60 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Upload size={13} className="text-halide/40" />
            <span className="font-mono text-[10px] text-halide/50 tracking-wider">DROP OR CLICK TO UPLOAD RAW PHOTOS</span>
          </div>
        )}
      </div>

      {gallery?.photos?.length > 0 && (
        <div className="border border-halide/10 p-4 space-y-3">
          <p className="font-mono text-[9px] tracking-widest text-halide/50">{gallery.photos.length} PHOTOS UPLOADED</p>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {gallery.photos.map((photoUri, idx) => (
              <PhotoPreviewThumbnail 
                key={idx} 
                fileUri={photoUri}
                onDelete={async () => {
                  const updated = gallery.photos.filter((_, i) => i !== idx);
                  await base44.entities.Gallery.update(gallery.id, { photos: updated });
                  setGallery(prev => prev ? { ...prev, photos: updated } : null);
                  toast.success('Photo removed');
                }}
              />
            ))}
          </div>
        </div>
      )}



      <button
        onClick={handleSendSelectionLink}
        disabled={sending || !gallery?.photos?.length}
        className="flex items-center gap-2 bg-purple-900/30 border border-purple-800/40 text-purple-300 px-5 py-2.5 font-mono text-[11px] tracking-widest hover:bg-purple-900/50 transition-colors disabled:opacity-40"
      >
        {sending ? <Loader2 size={12} className="animate-spin" /> : <Image size={12} />}
        {sending ? 'SENDING...' : 'SEND PHOTO SELECTION LINK'}
      </button>
    </div>
  );
}

function PaymentPanel({ booking }) {
  const [deposit, setDeposit] = useState(booking.deposit_paid || '');
  const [total, setTotal] = useState(booking.total_paid || '');
  const [note, setNote] = useState(booking.payment_note || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Booking.update(booking.id, {
      deposit_paid: deposit !== '' ? parseFloat(deposit) : null,
      total_paid: total !== '' ? parseFloat(total) : null,
      payment_note: note,
    });
    toast.success('Payment info saved');
    setSaving(false);
  };

  return (
    <div className="border-t border-halide/10 pt-4 space-y-3">
      <p className="font-mono text-[9px] tracking-widest text-halide/50">PAYMENT RECEIVED</p>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9px] text-halide/40 tracking-widest">DEPOSIT ($)</label>
          <input
            type="number" min="0" step="0.01" value={deposit}
            onChange={e => setDeposit(e.target.value)}
            placeholder="0.00"
            className="bg-noir border border-halide/20 focus:border-halide/50 outline-none font-mono text-sm text-ivory px-3 py-2 w-32 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9px] text-halide/40 tracking-widest">FULL PAYMENT ($)</label>
          <input
            type="number" min="0" step="0.01" value={total}
            onChange={e => setTotal(e.target.value)}
            placeholder="0.00"
            className="bg-noir border border-halide/20 focus:border-halide/50 outline-none font-mono text-sm text-ivory px-3 py-2 w-36 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <label className="font-mono text-[9px] text-halide/40 tracking-widest">NOTE</label>
          <input
            type="text" value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Zelle, Venmo, Cash"
            className="bg-noir border border-halide/20 focus:border-halide/50 outline-none font-body text-sm text-ivory px-3 py-2 w-full transition-colors"
          />
        </div>
        <div className="flex flex-col justify-end">
          <button
            onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-ivory/10 border border-halide/20 hover:border-ivory/50 text-ivory px-4 py-2 font-mono text-[11px] tracking-widest transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 size={11} className="animate-spin" /> : <DollarSign size={11} />}
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingRow({ booking, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [localStatus, setLocalStatus] = useState(booking.status);
  const [editingGallery, setEditingGallery] = useState(null);
  const [signedInvoiceUrl, setSignedInvoiceUrl] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState(booking.client_email);
  const [savingEmail, setSavingEmail] = useState(false);
  const invoiceInputRef = useRef();

  // Load gallery for editing step & watermark tracking
  useEffect(() => {
    if (expanded && localStatus === 'editing') {
      base44.entities.Gallery.filter({ booking_id: booking.id }).then(gs => {
        if (gs.length) {
          setEditingGallery(gs[0]);
        }
      });
    }
  }, [localStatus, expanded]);

  // Load signed invoice URL when confirmed and expanded
  useEffect(() => {
    if (localStatus === 'confirmed' && expanded && booking.signed_invoice_url && !signedInvoiceUrl) {
      base44.integrations.Core.CreateFileSignedUrl({ file_uri: booking.signed_invoice_url, expires_in: 3600 })
        .then(r => setSignedInvoiceUrl(r.signed_url))
        .catch(() => {});
    }
  }, [localStatus, expanded]);

  const handleAction = async (newStatus) => {
    setLoading(true);
    await base44.entities.Booking.update(booking.id, { status: newStatus });
    toast.success(`Status updated to ${newStatus}.`);
    setLocalStatus(newStatus);
    onStatusChange(booking.id, newStatus);
    setLoading(false);
  };

  const handleSendInvoice = async () => {
    if (!invoiceFile) return;
    setSendingInvoice(true);
    try {
      // 1. Upload invoice publicly so client can view/download it in portal
      const { file_url } = await base44.integrations.Core.UploadFile({ file: invoiceFile });

      // 2. Save to booking immediately — data is never lost even if emails fail
      await base44.entities.Booking.update(booking.id, { invoice_url: file_url, status: 'invoice_sent' });
      setInvoiceFile(null);
      setLocalStatus('invoice_sent');
      onStatusChange(booking.id, 'invoice_sent');

      // 3. Send emails — if either fails, show a warning but don't block the UI
      const appUrl = window.location.origin;
      const updatedBooking = { ...booking, invoice_url: file_url };
      try {
        await base44.functions.invoke('sendInvoiceEmail', { booking: updatedBooking, invoice_url: file_url, app_url: appUrl });
        await base44.functions.invoke('sendClientPortalLink', { booking_id: booking.id, app_url: appUrl, purpose: 'invoice' });
        toast.success(`Invoice uploaded and sent to ${booking.client_email}`);
      } catch (emailErr) {
        toast.warning(`Invoice saved, but email failed: ${emailErr.message}. The client can still access the portal.`);
      }
    } catch (err) {
      toast.error(`Failed to upload invoice: ${err.message}`);
    } finally {
      setSendingInvoice(false);
    }
  };

  const handleSaveEmail = async () => {
    setSavingEmail(true);
    await base44.entities.Booking.update(booking.id, { client_email: emailValue });
    toast.success('Email updated');
    setEditingEmail(false);
    setSavingEmail(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this booking? This cannot be undone.')) return;
    await base44.entities.Booking.delete(booking.id);
    onDelete(booking.id);
    toast.success('Booking deleted');
  };

  const ShootIcon = booking.shoot_type === 'real_estate' ? Building2 : Camera;
  const shootTypeLabel = booking.shoot_type === 'real_estate' ? 'Real Estate' : 'Event';

  return (
    <div className="border border-halide/15 hover:border-halide/30 transition-colors">
      <button className="w-full text-left px-6 py-5 flex items-center gap-6" onClick={() => setExpanded(!expanded)}>
        <ShootIcon size={16} className="text-halide shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-body text-ivory truncate">{booking.client_name}</p>
          <p className="font-mono text-[11px] text-halide/60 mt-0.5">{booking.client_email}</p>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <p className="font-mono text-[11px] text-halide tracking-wider">{booking.shoot_date}</p>
          <p className="font-mono text-[10px] text-halide/50 mt-0.5">{booking.shoot_time ? `${booking.shoot_time}${booking.shoot_end_time ? ` — ${booking.shoot_end_time}` : ''}` : 'Flexible'}</p>
        </div>
        <StatusBadge status={localStatus} />
        <ChevronDown size={14} className={`text-halide/40 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        <button
          onClick={e => { e.stopPropagation(); handleDelete(); }}
          className="shrink-0 text-halide/20 hover:text-red-400 transition-colors"
          title="Delete booking"
        >
          <Trash2 size={14} />
        </button>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-halide/10 pt-5 space-y-5">
              {/* Details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  ['SHOOT TYPE', shootTypeLabel],
                  ['DATE', booking.shoot_date],
                  ['TIME', booking.shoot_time ? `${booking.shoot_time}${booking.shoot_end_time ? ` — ${booking.shoot_end_time}` : ''}` : 'Flexible'],
                  ['LOCATION', booking.location || 'TBD'],
                  ['PACKAGE', booking.package_request || 'Not specified'],
                  ['PHONE', booking.client_phone || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="font-mono text-[9px] tracking-widest text-halide/50 mb-1">{label}</p>
                    <p className="font-body text-sm text-ivory/80">{val}</p>
                  </div>
                ))}
              </div>
              {/* Editable email */}
              <div>
                <p className="font-mono text-[9px] tracking-widest text-halide/50 mb-1">CLIENT EMAIL</p>
                {editingEmail ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={emailValue}
                      onChange={e => setEmailValue(e.target.value)}
                      className="bg-noir border border-halide/40 focus:border-ivory outline-none font-mono text-sm text-ivory px-3 py-1.5 transition-colors"
                    />
                    <button onClick={handleSaveEmail} disabled={savingEmail}
                      className="flex items-center gap-1 bg-ivory text-noir px-3 py-1.5 font-mono text-[10px] tracking-widest hover:bg-halide hover:text-ivory transition-colors disabled:opacity-40">
                      {savingEmail ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} SAVE
                    </button>
                    <button onClick={() => { setEditingEmail(false); setEmailValue(booking.client_email); }}
                      className="font-mono text-[10px] text-halide/50 hover:text-halide tracking-widest">
                      CANCEL
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="font-body text-sm text-ivory/80">{emailValue}</p>
                    <button onClick={() => setEditingEmail(true)}
                      className="font-mono text-[9px] text-halide/40 hover:text-halide tracking-widest underline transition-colors">
                      EDIT
                    </button>
                  </div>
                )}
              </div>

              {booking.details && (
                <div>
                  <p className="font-mono text-[9px] tracking-widest text-halide/50 mb-1">DETAILS</p>
                  <p className="font-body text-sm text-ivory/70 leading-relaxed">{booking.details}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                {localStatus === 'pending' && (
                  <>
                    <button onClick={() => handleAction('confirmed')} disabled={loading}
                      className="flex items-center gap-2 bg-ivory text-noir px-5 py-2.5 font-mono text-[11px] tracking-widest hover:bg-green-400 transition-colors disabled:opacity-40">
                      <Check size={13} /> CONFIRM SESSION
                    </button>
                    <button onClick={() => handleAction('cancelled')} disabled={loading}
                      className="flex items-center gap-2 border border-red-800/40 text-red-400 px-5 py-2.5 font-mono text-[11px] tracking-widest hover:bg-red-900/20 transition-colors disabled:opacity-40">
                      <X size={13} /> DECLINE
                    </button>
                  </>
                )}
                {localStatus === 'invoice_sent' && (
                  <p className="font-mono text-[10px] text-yellow-400/70 tracking-widest pt-1">
                    Awaiting signed invoice from client...
                  </p>
                )}
                {localStatus === 'confirmed' && (
                  <>
                    <button onClick={() => handleAction('cancelled')} disabled={loading}
                      className="flex items-center gap-2 border border-red-800/40 text-red-400 px-5 py-2.5 font-mono text-[11px] tracking-widest hover:bg-red-900/20 transition-colors disabled:opacity-40">
                      <X size={13} /> CANCEL
                    </button>
                  </>
                )}
                {localStatus === 'selecting_photos' && (
                  <p className="font-mono text-[10px] text-purple-400/70 tracking-widest pt-1">
                    Awaiting client photo selection...
                  </p>
                )}
                {localStatus === 'editing' && (
                  <p className="font-mono text-[10px] text-blue-300/70 tracking-widest pt-1">
                    Upload edited photos below when ready.
                  </p>
                )}
                {localStatus === 'cancelled' && (
                  <p className="font-mono text-[10px] text-halide/40 tracking-widest pt-2">
                    Cancelled — client notified
                  </p>
                )}
              </div>

              {/* Invoice section — always visible unless cancelled/completed */}
              {!['cancelled', 'completed'].includes(localStatus) && (
                <div className="border-t border-halide/10 pt-4 mt-2 space-y-3">
                  <p className="font-mono text-[9px] tracking-widest text-halide/50">INVOICE</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        console.log('🔵 BUTTON CLICKED - opening modal');
                        setShowInvoiceModal(true);
                      }}
                      className="flex items-center gap-2 border border-halide/30 text-halide px-5 py-2.5 font-mono text-[11px] tracking-widest hover:border-ivory hover:text-ivory transition-colors"
                    >
                      <FileText size={13} /> DOWNLOAD INVOICE
                    </button>
                  {showInvoiceModal && (
                    <InvoiceLineItemModal booking={booking} onClose={() => setShowInvoiceModal(false)} />
                  )}
                    <input ref={invoiceInputRef} type="file" accept="application/pdf" className="hidden"
                      onChange={e => setInvoiceFile(e.target.files[0])} />
                    <button onClick={() => invoiceInputRef.current?.click()}
                      className="flex items-center gap-2 border border-halide/30 text-halide px-5 py-2.5 font-mono text-[11px] tracking-widest hover:border-ivory hover:text-ivory transition-colors">
                      <Paperclip size={13} /> {invoiceFile ? invoiceFile.name : 'ATTACH INVOICE'}
                    </button>
                    {invoiceFile && (
                      <button onClick={handleSendInvoice} disabled={sendingInvoice}
                        className="flex items-center gap-2 bg-ivory text-noir px-5 py-2.5 font-mono text-[11px] tracking-widest hover:bg-halide hover:text-ivory transition-colors disabled:opacity-40">
                        {sendingInvoice ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        {sendingInvoice ? 'SENDING...' : 'SEND TO CLIENT'}
                      </button>
                    )}
                    {localStatus === 'confirmed' && signedInvoiceUrl && (
                      <a href={signedInvoiceUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 border border-green-800/40 text-green-400 px-5 py-2.5 font-mono text-[11px] tracking-widest hover:bg-green-900/20 transition-colors">
                        <Check size={12} /> VIEW SIGNED INVOICE
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Payment tracking */}
              <PaymentPanel booking={booking} />

              {/* Email status log */}
              <div className="border-t border-halide/10 pt-4">
                <EmailStatusIndicator bookingId={booking.id} />
              </div>

              {/* Raw photo upload — show for confirmed status */}
              {localStatus === 'confirmed' && (
                <div className="border-t border-halide/10 pt-4">
                  <RawPhotoUploader
                    booking={booking}
                    onUploaded={(galleryId, count, newStatus) => {
                      if (newStatus) {
                        setLocalStatus(newStatus);
                        onStatusChange(booking.id, newStatus);
                      }
                    }}
                  />
                  <GalleryViewer booking={{ ...booking, status: localStatus }} />
                </div>
              )}

              {/* Raw photo uploader also available during selecting_photos — add more photos after link sent */}
              {localStatus === 'selecting_photos' && (
                <div className="border-t border-halide/10 pt-4">
                  <RawPhotoUploader
                    booking={booking}
                    onUploaded={(galleryId, count, newStatus) => {
                      if (newStatus) {
                        setLocalStatus(newStatus);
                        onStatusChange(booking.id, newStatus);
                      }
                    }}
                  />
                </div>
              )}

              {/* Gallery viewer for selecting_photos — see what was uploaded + what client picks */}
              {(localStatus === 'selecting_photos' || localStatus === 'editing') && (
                <div className="border-t border-halide/10 pt-4">
                  <GalleryViewer booking={{ ...booking, status: localStatus }} />
                </div>
              )}

              {/* Final edited photos — show for completed status */}
              {localStatus === 'completed' && (
                <div className="border-t border-halide/10 pt-4">
                  <GalleryViewer booking={{ ...booking, status: localStatus }} />
                </div>
              )}

              {/* Edited photo upload — show for editing status */}
              {localStatus === 'editing' && editingGallery && (
                <div className="border-t border-halide/10 pt-4">
                  <EditedPhotoUploader
                    booking={{ ...booking, status: localStatus }}
                    gallery={editingGallery}
                    onComplete={() => {
                      setLocalStatus('completed');
                      onStatusChange(booking.id, 'completed');
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FILTERS = ['all', 'pending', 'invoice_sent', 'confirmed', 'selecting_photos', 'editing', 'completed', 'cancelled'];

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    base44.entities.Booking.list('-created_date', 100).then(data => {
      setBookings(data);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const handleDelete = (id) => {
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const actionableCount = bookings.filter(b => ['pending', 'editing'].includes(b.status)).length;

  return (
    <div className="min-h-screen bg-noir">
      <div className="pt-32 md:pt-40 pb-12">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4">STUDIO MANAGEMENT</p>
              <h1 className="font-display text-ivory text-5xl md:text-7xl leading-[0.9]">Bookings</h1>
            </div>
            {actionableCount > 0 && (
              <div className="flex items-center gap-2 bg-ivory/10 border border-ivory/20 px-4 py-2 mb-2">
                <Clock size={13} className="text-ivory" />
                <span className="font-mono text-[11px] text-ivory tracking-widest">{actionableCount} NEED ATTENTION</span>
              </div>
            )}
          </div>
          <p className="font-body text-halide/60 mt-6 text-sm">Manage the full client workflow from booking to final delivery.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-8">
        <div className="flex gap-0 border border-halide/20 w-fit overflow-x-auto">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2.5 font-mono text-[10px] tracking-[0.1em] uppercase whitespace-nowrap transition-colors
                ${filter === f ? 'bg-ivory text-noir' : 'text-halide hover:text-ivory'}`}>
              {f.replace('_', ' ')}{f === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border border-halide border-t-ivory rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-mono text-[11px] text-halide/40 tracking-widest">NO BOOKINGS</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(booking => (
              <BookingRow key={booking.id} booking={booking} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
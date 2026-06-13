import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, Send, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const BATCH_SIZE = 5;

async function uploadBatch(files) {
  return Promise.all(
    files.map(file => base44.integrations.Core.UploadPrivateFile({ file }).then(r => ({ uri: r.file_uri, type: file.type })))
  );
}

export default function EditedPhotoUploader({ booking, gallery, onComplete }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null); // { total, failed }
  const [editedCount, setEditedCount] = useState((gallery?.edited_photos || []).length);
  const fileInputRef = useRef();

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;
    setUploading(true);
    setVerifyResult(null);
    setProgress({ done: 0, total: fileArray.length });

    const newUris = [];
    for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
      const batch = fileArray.slice(i, i + BATCH_SIZE);
      const results = await uploadBatch(batch);
      results.forEach(({ uri }) => newUris.push(uri));
      setProgress({ done: Math.min(i + BATCH_SIZE, fileArray.length), total: fileArray.length });
    }

    const existing = gallery?.edited_photos || [];
    await base44.entities.Gallery.update(gallery.id, { edited_photos: [...existing, ...newUris], phase: 'edited' });
    setEditedCount(existing.length + newUris.length);
    toast.success(`Uploaded ${newUris.length} edited photo${newUris.length !== 1 ? 's' : ''}`);
    setUploading(false);
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    // Refresh gallery to get latest edited_photos list
    const galleries = await base44.entities.Gallery.filter({ booking_id: booking.id });
    const latestGallery = galleries[0];
    const uris = latestGallery?.edited_photos || [];
    let failed = 0;
    for (const uri of uris) {
      try {
        const r = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 300 });
        if (!r?.signed_url) failed++;
      } catch (_) {
        failed++;
      }
    }
    setVerifyResult({ total: uris.length, failed });
    setVerifying(false);
    if (failed === 0) {
      toast.success(`All ${uris.length} photos verified successfully.`);
    } else {
      toast.error(`${failed} of ${uris.length} photos failed to load. Re-upload the missing ones before sending.`);
    }
  };

  const handleNotifyClient = async () => {
    setSending(true);
    const appUrl = window.location.origin;
    await base44.functions.invoke('sendClientPortalLink', { booking_id: booking.id, app_url: appUrl, purpose: 'final_gallery' });
    await base44.entities.Booking.update(booking.id, { status: 'completed' });
    toast.success(`Final gallery sent to ${booking.client_email}`);
    onComplete && onComplete();
    setSending(false);
  };

  return (
    <div className="space-y-4 mt-4">
      <p className="font-mono text-[9px] tracking-widest text-halide/50">UPLOAD EDITED PHOTOS</p>
      {editedCount > 0 && (
        <p className="font-mono text-[10px] text-green-400/70 tracking-wider flex items-center gap-1.5">
          <Check size={11} /> {editedCount} EDITED PHOTO{editedCount !== 1 ? 'S' : ''} UPLOADED
        </p>
      )}
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
            <span className="font-mono text-[10px] text-halide/50 tracking-wider">DROP OR CLICK TO UPLOAD EDITED PHOTOS</span>
          </div>
        )}
      </div>

      {editedCount > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          {/* Verify button — always shown when photos exist */}
          <button
            onClick={handleVerify}
            disabled={verifying || uploading}
            className="flex items-center gap-2 border border-halide/30 text-halide px-5 py-2.5 font-mono text-[11px] tracking-widest hover:border-ivory hover:text-ivory transition-colors disabled:opacity-40"
          >
            {verifying ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {verifying ? `VERIFYING...` : 'VERIFY ALL PHOTOS LOAD'}
          </button>

          {/* Send button — disabled if verify found failures */}
          <button
            onClick={handleNotifyClient}
            disabled={sending || verifying || (verifyResult?.failed > 0)}
            title={verifyResult?.failed > 0 ? 'Fix failed photos before sending' : ''}
            className="flex items-center gap-2 bg-ivory text-noir px-5 py-2.5 font-mono text-[11px] tracking-widest hover:bg-blue-400 transition-colors disabled:opacity-40"
          >
            {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            {sending ? 'SENDING...' : 'SEND FINAL GALLERY & COMPLETE'}
          </button>
        </div>
      )}

      {/* Verify result banner */}
      {verifyResult && (
        <div className={`flex items-center gap-3 px-4 py-3 border font-mono text-[10px] tracking-widest ${
          verifyResult.failed === 0
            ? 'border-green-800/40 bg-green-900/20 text-green-400'
            : 'border-red-800/40 bg-red-900/20 text-red-400'
        }`}>
          {verifyResult.failed === 0
            ? <><Check size={12} /> ALL {verifyResult.total} PHOTOS VERIFIED — SAFE TO SEND</>
            : <><AlertTriangle size={12} /> {verifyResult.failed} OF {verifyResult.total} PHOTOS FAILED — RE-UPLOAD MISSING PHOTOS BEFORE SENDING</>
          }
        </div>
      )}
    </div>
  );
}
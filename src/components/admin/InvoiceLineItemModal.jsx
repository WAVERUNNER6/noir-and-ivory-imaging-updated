import React, { useState } from 'react';
import { X, Plus, Trash2, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PACKAGE_DEFAULTS = {
  'Business Events \u2014 Silver':           [{ service: 'Photography Services', description: 'Business Event / Silver Package (Up to 3 hours)', price: '850' }],
  'Business Events \u2014 Gold':             [{ service: 'Photography Services', description: 'Business Event / Gold Package (Up to 6 hours)', price: '1450' }],
  'Business Events \u2014 Platinum':         [{ service: 'Photography Services', description: 'Business Event / Platinum Package (Full Day)', price: '2200' }],
  'Personal Events \u2014 Celebrations':     [{ service: 'Photography Services', description: 'Personal Event / Celebrations Package', price: '175' }],
  'Personal Events \u2014 Wedding':          [{ service: 'Photography Services', description: 'Personal Event / Wedding Package', price: '1200' }],
  'Real Estate \u2014 Limited Time Special': [{ service: 'Photography Services', description: 'Real Estate / Limited Time Special', price: '350' }],
};

function c(r, g, b) {
  return rgb(r / 255, g / 255, b / 255);
}

function formatPrice(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return val || 'TBD';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calcTotal(items) {
  const sum = items.reduce((acc, item) => {
    const n = parseFloat(item.price);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);
  return sum;
}

async function generatePDF(booking, items, notes) {
  const invoiceNum = `NIV-${(booking.id?.slice(-6) || Date.now().toString().slice(-6)).toUpperCase()}`;
  const today = format(new Date(), 'MMMM d, yyyy');
  const total = calcTotal(items);
  const totalStr = total > 0 ? formatPrice(total) : 'TBD';

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const reg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const noir      = c(10, 10, 10);
  const ivory     = c(249, 247, 245);
  const halide    = c(142, 142, 142);
  const dark      = c(26, 26, 26);
  const mid       = c(80, 80, 80);
  const lightGray = c(220, 220, 220);
  const offWhite  = c(248, 247, 245);

  // ── Header ──
  page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: noir });
  page.drawText('NOIR & IVORY IMAGING', { x: 40, y: height - 36, font: bold, size: 10, color: ivory });
  page.drawText('INVOICE', { x: 40, y: height - 74, font: bold, size: 28, color: ivory });

  const invNoText = `Invoice No: ${invoiceNum}`;
  page.drawText(invNoText, { x: width - 40 - reg.widthOfTextAtSize(invNoText, 9), y: height - 36, font: reg, size: 9, color: ivory });

  const dateText = `Date: ${today}`;
  page.drawText(dateText, { x: width - 40 - reg.widthOfTextAtSize(dateText, 9), y: height - 52, font: reg, size: 9, color: ivory });

  // ── Divider ──
  page.drawLine({ start: { x: 40, y: height - 140 }, end: { x: width - 40, y: height - 140 }, thickness: 0.5, color: lightGray });

  // ── Bill To ──
  page.drawText('BILL TO', { x: 40, y: height - 162, font: bold, size: 8, color: halide });
  page.drawText(booking.client_name || '\u2014', { x: 40, y: height - 180, font: bold, size: 14, color: dark });
  page.drawText(booking.client_email || '', { x: 40, y: height - 197, font: reg, size: 10, color: mid });
  if (booking.client_phone) {
    page.drawText(booking.client_phone, { x: 40, y: height - 212, font: reg, size: 10, color: mid });
  }

  // ── Session Details ──
  const sX = 330;
  page.drawText('SESSION DETAILS', { x: sX, y: height - 162, font: bold, size: 8, color: halide });
  const sessionRows = [
    ['Date',     booking.shoot_date || 'TBD'],
    ['Time',     booking.shoot_time ? `${booking.shoot_time}${booking.shoot_end_time ? ` \u2014 ${booking.shoot_end_time}` : ''}` : 'TBD'],
    ['Location', booking.location || 'TBD'],
  ];
  sessionRows.forEach(([label, val], i) => {
    const y = height - 180 - i * 18;
    page.drawText(`${label}:`, { x: sX, y, font: bold, size: 9, color: halide });
    const maxW = width - 40 - (sX + 58);
    const safeVal = reg.widthOfTextAtSize(val, 9) > maxW
      ? val.substring(0, Math.floor(val.length * maxW / reg.widthOfTextAtSize(val, 9))) + '...'
      : val;
    page.drawText(safeVal, { x: sX + 58, y, font: reg, size: 9, color: dark });
  });

  // ── Divider ──
  page.drawLine({ start: { x: 40, y: height - 238 }, end: { x: width - 40, y: height - 238 }, thickness: 0.5, color: lightGray });

  // ── Table Header ──
  page.drawRectangle({ x: 40, y: height - 262, width: width - 80, height: 22, color: offWhite });
  page.drawText('SERVICE', { x: 52, y: height - 254, font: bold, size: 8, color: halide });
  page.drawText('DESCRIPTION', { x: 180, y: height - 254, font: bold, size: 8, color: halide });
  page.drawText('AMOUNT', { x: width - 52 - bold.widthOfTextAtSize('AMOUNT', 8), y: height - 254, font: bold, size: 8, color: halide });

  // ── Line Items ──
  let rowY = height - 290;
  items.forEach((item, idx) => {
    if (rowY < 200) return; // safety cutoff

    page.drawText(item.service || 'Service', { x: 52, y: rowY, font: reg, size: 10, color: dark });

    // Wrap description
    const maxDescW = 200;
    const words = (item.description || '').split(' ');
    let line = '';
    let descY = rowY;
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (reg.widthOfTextAtSize(test, 10) > maxDescW) {
        page.drawText(line, { x: 180, y: descY, font: reg, size: 10, color: dark });
        line = word;
        descY -= 14;
      } else {
        line = test;
      }
    });
    if (line) page.drawText(line, { x: 180, y: descY, font: reg, size: 10, color: dark });

    const priceStr = formatPrice(item.price);
    page.drawText(priceStr, { x: width - 52 - bold.widthOfTextAtSize(priceStr, 11), y: rowY, font: bold, size: 11, color: dark });

    // Subtle row divider
    if (idx < items.length - 1) {
      page.drawLine({ start: { x: 40, y: rowY - 12 }, end: { x: width - 40, y: rowY - 12 }, thickness: 0.3, color: c(235, 235, 235) });
    }

    rowY -= 32;
  });

  // ── Divider ──
  const dividerY = rowY + 8;
  page.drawLine({ start: { x: 40, y: dividerY }, end: { x: width - 40, y: dividerY }, thickness: 0.5, color: lightGray });

  // ── Total Due block ──
  const totalBlockY = dividerY - 34;
  page.drawRectangle({ x: 350, y: totalBlockY, width: 205, height: 28, color: noir });
  page.drawText('TOTAL DUE', { x: 360, y: totalBlockY + 10, font: bold, size: 9, color: ivory });

  const form = pdfDoc.getForm();
  // Draw total as static text (not a form field) so color renders correctly
  const totalW = bold.widthOfTextAtSize(totalStr, 11);
  page.drawText(totalStr, { x: width - 52 - totalW, y: totalBlockY + 10, font: bold, size: 11, color: ivory });

  // ── Notes ──
  let notesEndY = totalBlockY - 14;
  if (notes && notes.trim()) {
    page.drawText('NOTES', { x: 40, y: totalBlockY - 2, font: bold, size: 8, color: halide });
    page.drawText(notes.trim(), { x: 40, y: totalBlockY - 18, font: reg, size: 9, color: mid });
    notesEndY = totalBlockY - 36;
  }

  // ── Payment Methods ──
  page.drawText('PAYMENT METHODS ACCEPTED', { x: 40, y: notesEndY - 10, font: bold, size: 9, color: dark });
  page.drawText('Zelle  \u00b7  Venmo  \u00b7  Cash  \u00b7  Check', { x: 40, y: notesEndY - 26, font: reg, size: 9, color: mid });

  // ── Studio authorization (off-page) ──
  const studioSigField = form.createTextField('studio_authorization');
  studioSigField.setText(`Authorized by Noir & Ivory Imaging — ${today}`);
  studioSigField.addToPage(page, { x: 0, y: -50, width: 1, height: 1, textColor: c(255,255,255), backgroundColor: c(255,255,255), borderWidth: 0, font: reg, fontSize: 1 });

  // ── Client Signature ──
  const sigSectionY = notesEndY - 60;
  page.drawLine({ start: { x: 40, y: sigSectionY }, end: { x: width - 40, y: sigSectionY }, thickness: 0.5, color: lightGray });
  page.drawText('CLIENT SIGNATURE', { x: 40, y: sigSectionY - 20, font: bold, size: 8, color: halide });
  page.drawText('By signing below, you confirm the Total Due and authorize Noir & Ivory Imaging to proceed.', {
    x: 40, y: sigSectionY - 34, font: reg, size: 8, color: mid,
  });

  const sigBoxY = sigSectionY - 94;
  page.drawRectangle({ x: 40, y: sigBoxY, width: 320, height: 60, color: c(250,250,250), borderColor: c(160,160,160), borderWidth: 0.75 });
  page.drawText('Draw Signature Here', { x: 54, y: sigBoxY + 26, font: reg, size: 10, color: c(200,200,200), opacity: 0.6 });
  page.drawLine({ start: { x: 54, y: sigBoxY + 14 }, end: { x: 346, y: sigBoxY + 14 }, thickness: 0.5, color: c(180,180,180) });
  page.drawText('Client Signature', { x: 40, y: sigBoxY - 12, font: reg, size: 7, color: halide });

  const dateSigField = form.createTextField('date_signed');
  dateSigField.addToPage(page, { x: 380, y: sigBoxY, width: 155, height: 34, textColor: dark, backgroundColor: c(247,247,247), borderColor: c(180,180,180), borderWidth: 0.5, font: reg, fontSize: 11 });
  page.drawText('Date', { x: 380, y: sigBoxY - 12, font: reg, size: 7, color: halide });

  // ── Thank you note ──
  const thankY = sigBoxY - 28;
  page.drawLine({ start: { x: 40, y: thankY }, end: { x: width - 40, y: thankY }, thickness: 0.5, color: lightGray });
  page.drawText('Thank you for choosing Noir & Ivory Imaging. We look forward to capturing your moments.', { x: 40, y: thankY - 16, font: reg, size: 8, color: halide });
  page.drawText('Contact us: studio@noirandivoryimaging.com', { x: 40, y: thankY - 30, font: reg, size: 8, color: halide });

  // ── Footer ──
  page.drawRectangle({ x: 0, y: 0, width, height: 44, color: offWhite });
  page.drawText('\u00a9 Noir & Ivory Imaging', { x: 40, y: 18, font: reg, size: 8, color: halide });
  page.drawText('noirandivoryimaging@outlook.com', { x: width - 40 - reg.widthOfTextAtSize('noirandivoryimaging@outlook.com', 8), y: 18, font: reg, size: 8, color: halide });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice-${invoiceNum}-${(booking.client_name || 'Client').replace(/\s+/g, '-')}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InvoiceLineItemModal({ booking, onClose }) {
  const defaults = PACKAGE_DEFAULTS[booking.package_request] || [
    { service: 'Photography Services', description: booking.package_request || 'Photography Services', price: '' }
  ];

  const [items, setItems] = useState(defaults.map(d => ({ ...d })));
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  const updateItem = (i, field, value) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    setItems(prev => [...prev, { service: '', description: '', price: '' }]);
  };

  const removeItem = (i) => {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  };

  const total = calcTotal(items);

  const handleGenerate = async () => {
    setGenerating(true);
    await generatePDF(booking, items, notes);
    setGenerating(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-noir/90 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="bg-[#111] border border-halide/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-halide/15">
            <div>
              <p className="font-mono text-[9px] tracking-[0.3em] text-halide/50 mb-1">INVOICE BUILDER</p>
              <p className="font-body text-ivory">{booking.client_name}</p>
            </div>
            <button onClick={onClose} className="text-halide hover:text-ivory transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Line Items Table */}
          <div className="px-6 pt-5">
            <p className="font-mono text-[9px] tracking-[0.25em] text-halide/50 mb-3">LINE ITEMS</p>

            {/* Column headers */}
            <div className="grid grid-cols-[2fr_3fr_1fr_auto] gap-3 mb-2">
              <p className="font-mono text-[8px] tracking-widest text-halide/40">SERVICE</p>
              <p className="font-mono text-[8px] tracking-widest text-halide/40">DESCRIPTION</p>
              <p className="font-mono text-[8px] tracking-widest text-halide/40">PRICE ($)</p>
              <div className="w-6" />
            </div>

            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[2fr_3fr_1fr_auto] gap-3 items-center border border-halide/10 px-3 py-2.5 bg-noir/40">
                  <input
                    value={item.service}
                    onChange={e => updateItem(i, 'service', e.target.value)}
                    placeholder="Service name"
                    className="bg-transparent font-body text-sm text-ivory placeholder-halide/30 outline-none border-b border-halide/20 focus:border-halide/50 pb-0.5 transition-colors"
                  />
                  <input
                    value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                    placeholder="Description"
                    className="bg-transparent font-body text-sm text-ivory placeholder-halide/30 outline-none border-b border-halide/20 focus:border-halide/50 pb-0.5 transition-colors"
                  />
                  <input
                    value={item.price}
                    onChange={e => updateItem(i, 'price', e.target.value)}
                    placeholder="0.00"
                    type="number"
                    min="0"
                    step="0.01"
                    className="bg-transparent font-mono text-sm text-ivory placeholder-halide/30 outline-none border-b border-halide/20 focus:border-halide/50 pb-0.5 transition-colors w-full"
                  />
                  <button
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="text-halide/30 hover:text-red-400 transition-colors disabled:opacity-20"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Row */}
            <button
              onClick={addItem}
              className="flex items-center gap-2 mt-3 text-halide hover:text-ivory font-mono text-[10px] tracking-widest transition-colors"
            >
              <Plus size={12} /> ADD LINE ITEM
            </button>
          </div>

          {/* Notes */}
          <div className="px-6 mt-5">
            <p className="font-mono text-[9px] tracking-[0.25em] text-halide/50 mb-2">NOTES (OPTIONAL)</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes for the client..."
              rows={2}
              className="w-full bg-noir/40 border border-halide/10 focus:border-halide/30 outline-none font-body text-sm text-ivory placeholder-halide/30 px-3 py-2.5 resize-none transition-colors"
            />
          </div>

          {/* Total + Actions */}
          <div className="px-6 py-5 mt-3 border-t border-halide/15 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[9px] tracking-widest text-halide/50">TOTAL DUE</span>
              <span className="font-display text-ivory text-2xl">
                {total > 0 ? formatPrice(total) : '—'}
              </span>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || items.length === 0}
              className="flex items-center gap-2 bg-ivory text-noir px-6 py-3 font-mono text-[11px] tracking-widest hover:bg-halide hover:text-ivory transition-colors disabled:opacity-40"
            >
              {generating ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
              {generating ? 'GENERATING...' : 'DOWNLOAD PDF'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
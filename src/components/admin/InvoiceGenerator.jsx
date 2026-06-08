import React, { useState, useRef } from 'react';
import { FileText, Loader2, Upload } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { toast } from 'sonner';

const DEFAULT_PRICES = {
  'Business Events — Silver':           '$850',
  'Business Events — Gold':             '$1,450',
  'Business Events — Platinum':         '$2,200',
  'Personal Events — Celebrations':     '$175',
  'Personal Events — Wedding':          '$1,200',
  'Real Estate — Limited Time Special': '$350',
};

function normalizeKey(str) {
  return (str || '').replace(/\s*[\u2014\u2013-]\s*/g, ' \u2014 ').trim();
}

function getDefaultPrice(packageRequest) {
  const normalized = normalizeKey(packageRequest);
  return DEFAULT_PRICES[normalized] || '';
}

export default function InvoiceGenerator({ booking, onGenerated }) {
  const defaultPrice = getDefaultPrice(booking.package_request);
  const [amount, setAmount] = useState(defaultPrice);
  const [generating, setGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef();

  const generateInvoice = async () => {
    setGenerating(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();

      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const reg = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const c = (r, g, b) => rgb(r / 255, g / 255, b / 255);
      const noir = c(10, 10, 10);
      const ivory = c(249, 247, 245);
      const dark = c(26, 26, 26);
      const mid = c(140, 140, 140);
      const halide = c(142, 142, 142);
      const lightGray = c(220, 220, 220);

      // ── Header ──
      page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: noir });
      page.drawText('NOIR & IVORY IMAGING', { x: 40, y: height - 30, font: bold, size: 10, color: ivory });
      page.drawText('INVOICE', { x: width - 200, y: height - 30, font: bold, size: 24, color: ivory });

      // ── Invoice Number & Date ──
      const invoiceNum = `NIV-${(booking.id?.slice(-6) || 'TEMP').toUpperCase()}`;
      page.drawText('INVOICE #', { x: 40, y: height - 110, font: bold, size: 9, color: dark });
      page.drawText(invoiceNum, { x: 40, y: height - 128, font: reg, size: 11, color: dark });
      page.drawText('DATE', { x: 280, y: height - 110, font: bold, size: 9, color: dark });
      page.drawText(new Date().toLocaleDateString(), { x: 280, y: height - 128, font: reg, size: 11, color: dark });

      // ── Bill To ──
      page.drawText('BILL TO', { x: 40, y: height - 168, font: bold, size: 9, color: dark });
      page.drawText(booking.client_name || '—', { x: 40, y: height - 188, font: bold, size: 12, color: dark });
      page.drawText(booking.client_email || '', { x: 40, y: height - 205, font: reg, size: 9, color: mid });
      if (booking.client_phone) page.drawText(booking.client_phone, { x: 40, y: height - 220, font: reg, size: 9, color: mid });

      // ── Table Header ──
      page.drawLine({ start: { x: 40, y: height - 250 }, end: { x: width - 40, y: height - 250 }, thickness: 1, color: lightGray });
      page.drawText('DESCRIPTION', { x: 40, y: height - 265, font: bold, size: 9, color: dark });
      page.drawText('DATE', { x: 280, y: height - 265, font: bold, size: 9, color: dark });
      page.drawText('AMOUNT DUE', { x: width - 140, y: height - 265, font: bold, size: 9, color: dark });
      page.drawLine({ start: { x: 40, y: height - 280 }, end: { x: width - 40, y: height - 280 }, thickness: 1, color: lightGray });

      // ── Service Item ──
      page.drawText(booking.package_request || 'Photography Services', { x: 40, y: height - 305, font: reg, size: 10, color: dark });
      page.drawText(booking.shoot_date || '—', { x: 280, y: height - 305, font: reg, size: 10, color: dark });
      page.drawText(amount || '—', { x: width - 140, y: height - 305, font: bold, size: 11, color: dark });

      // ── Subtotal/Total ──
      page.drawLine({ start: { x: 40, y: height - 340 }, end: { x: width - 40, y: height - 340 }, thickness: 0.5, color: lightGray });
      page.drawText('TOTAL DUE', { x: width - 220, y: height - 358, font: bold, size: 10, color: dark });
      page.drawRectangle({ x: width - 220, y: height - 380, width: 180, height: 28, color: noir });
      page.drawText(amount || '—', { x: width - 210, y: height - 363, font: bold, size: 14, color: ivory });

      // ── Payment Methods ──
      const isPersonal = (booking.package_request || '').startsWith('Personal');
      const paymentMethods = isPersonal ? 'Zelle  \u00b7  Venmo  \u00b7  Cash' : 'Zelle  \u00b7  Venmo  \u00b7  Cash  \u00b7  Check';
      page.drawText('PAYMENT METHODS ACCEPTED', { x: 40, y: height - 410, font: bold, size: 9, color: dark });
      page.drawText(paymentMethods, { x: 40, y: height - 428, font: reg, size: 9, color: mid });

      // ── Terms ──
      page.drawLine({ start: { x: 40, y: height - 455 }, end: { x: width - 40, y: height - 455 }, thickness: 0.5, color: lightGray });
      page.drawText('TERMS & CONDITIONS', { x: 40, y: height - 475, font: bold, size: 9, color: dark });
      page.drawText('Payment is due within 14 days of invoice. Please include the invoice number with your payment.', {
        x: 40, y: height - 493, font: reg, size: 8, color: mid,
      });

      // ── Signature Section ──
      page.drawLine({ start: { x: 40, y: height - 530 }, end: { x: width - 40, y: height - 530 }, thickness: 0.5, color: lightGray });
      page.drawText('CLIENT SIGNATURE', { x: 40, y: height - 550, font: bold, size: 8, color: halide });
      page.drawText('By signing below, you authorize Noir & Ivory Imaging to proceed.', {
        x: 40, y: height - 565, font: reg, size: 7, color: mid,
      });

      const sigBoxY = height - 620;
      page.drawRectangle({
        x: 40, y: sigBoxY,
        width: 300, height: 55,
        color: c(250, 250, 250),
        borderColor: c(180, 180, 180),
        borderWidth: 0.75,
      });
      page.drawText('Client Signature', { x: 40, y: sigBoxY + 28, font: reg, size: 8, color: c(160, 160, 160) });
      page.drawLine({
        start: { x: 50, y: sigBoxY + 10 },
        end: { x: 320, y: sigBoxY + 10 },
        thickness: 0.5, color: c(180, 180, 180),
      });

      // Date signed box
      page.drawRectangle({
        x: 370, y: sigBoxY,
        width: 150, height: 55,
        color: c(247, 247, 247),
        borderColor: c(180, 180, 180),
        borderWidth: 0.5,
      });
      page.drawText('Date: _______________', { x: 380, y: sigBoxY + 28, font: reg, size: 8, color: dark });

      // ── Footer ──
      page.drawRectangle({ x: 0, y: 0, width, height: 40, color: c(248, 247, 245) });
      page.drawText('© Noir & Ivory Imaging — All rights reserved', { x: 40, y: 15, font: reg, size: 7, color: halide });
      page.drawText('noirandivoryimaging@outlook.com', { x: width - 250, y: 15, font: reg, size: 7, color: halide });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = `Invoice-${invoiceNum}-${(booking.client_name || 'Client').replace(/\s+/g, '-')}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      // Pass file to parent for sending
      if (onGenerated) {
        onGenerated(file);
      }

      // Also download to user's computer
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Invoice generated & ready to send');
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast.error(`Failed to generate invoice: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      setUploadedFile(file);
      if (onGenerated) {
        onGenerated(file);
      }
      toast.success('Invoice ready to send');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="font-mono text-[10px] text-halide/60 tracking-widest">AMOUNT</label>
          <input
            type="text"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. $850"
            className="bg-transparent border-b border-halide/30 text-ivory font-mono text-[12px] tracking-wider w-28 pb-1 focus:outline-none focus:border-ivory transition-colors placeholder:text-halide/30"
          />
        </div>
        <button
          onClick={generateInvoice}
          disabled={generating}
          className="flex items-center gap-2 border border-halide/30 text-halide px-5 py-2.5 font-mono text-[11px] tracking-widest hover:border-ivory hover:text-ivory transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
          {generating ? 'GENERATING...' : 'DOWNLOAD INVOICE'}
        </button>
      </div>

      {/* File upload for reviewed invoice */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 border border-halide/30 text-halide px-5 py-2.5 font-mono text-[11px] tracking-widest hover:border-ivory hover:text-ivory transition-colors"
        >
          <Upload size={13} />
          {uploadedFile ? 'INVOICE ATTACHED' : 'ATTACH REVIEWED INVOICE'}
        </button>
        {uploadedFile && (
          <span className="font-mono text-[10px] text-halide/60">{uploadedFile.name}</span>
        )}
      </div>
    </div>
  );
}
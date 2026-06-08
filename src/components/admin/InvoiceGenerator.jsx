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
      const darkGray = c(100, 100, 100);
      const lightGray = c(240, 240, 240);
      const borderGray = c(200, 200, 200);

      // ── BLACK HEADER ──
      page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: noir });
      
      // Left side: brand + title
      page.drawText('NOIR & IVORY IMAGING', { x: 40, y: height - 35, font: bold, size: 10, color: ivory });
      page.drawText('INVOICE', { x: 40, y: height - 65, font: bold, size: 32, color: ivory });
      
      // Right side: invoice details
      const invoiceNum = `NIV-${(booking.id?.slice(-6) || 'TEMP').toUpperCase()}`;
      page.drawText(`Invoice No: ${invoiceNum}`, { x: width - 200, y: height - 35, font: reg, size: 10, color: ivory });
      page.drawText(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { x: width - 200, y: height - 55, font: reg, size: 10, color: ivory });

      // ── TWO-COLUMN SECTION: BILL TO + SESSION DETAILS ──
      let y = height - 140;
      
      // Bill To (Left)
      page.drawText('BILL TO', { x: 40, y, font: bold, size: 9, color: darkGray });
      y -= 20;
      page.drawText(booking.client_name || '—', { x: 40, y, font: bold, size: 12, color: noir });
      y -= 18;
      page.drawText(booking.client_email || '', { x: 40, y, font: reg, size: 10, color: noir });
      y -= 15;
      page.drawText(booking.client_phone || '', { x: 40, y, font: reg, size: 10, color: noir });

      // Session Details (Right)
      y = height - 140;
      page.drawText('SESSION DETAILS', { x: 350, y, font: bold, size: 9, color: darkGray });
      y -= 20;
      
      const sessionDetails = [
        ['Date:', booking.shoot_date || 'TBD'],
        ['Time:', booking.shoot_time || 'TBD'],
        ['Location:', booking.location || 'TBD'],
      ];
      
      sessionDetails.forEach(([label, val]) => {
        page.drawText(label, { x: 350, y, font: reg, size: 10, color: darkGray });
        page.drawText(val, { x: 450, y, font: reg, size: 10, color: noir });
        y -= 18;
      });

      // ── SERVICE TABLE ──
      y = height - 270;
      page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: lightGray });
      y -= 20;
      
      page.drawText('SERVICE', { x: 40, y, font: bold, size: 9, color: darkGray });
      page.drawText('DESCRIPTION', { x: 180, y, font: bold, size: 9, color: darkGray });
      page.drawText('AMOUNT', { x: width - 120, y, font: bold, size: 9, color: darkGray });
      
      y -= 25;
      page.drawRectangle({ x: 40, y: y - 35, width: width - 80, height: 40, color: lightGray });
      page.drawText('Photography Description', { x: 55, y, font: reg, size: 10, color: noir });
      page.drawText('Photography Services', { x: 180, y, font: reg, size: 10, color: noir });
      page.drawText(amount || 'TBD', { x: width - 120, y, font: bold, size: 10, color: noir });
      
      y -= 60;
      page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: lightGray });

      // ── TOTAL DUE BOX (black) ──
      y -= 30;
      const totalBoxWidth = 250;
      const totalBoxX = width - totalBoxWidth - 40;
      page.drawRectangle({ x: totalBoxX, y: y - 30, width: totalBoxWidth, height: 40, color: noir });
      page.drawText('TOTAL DUE', { x: totalBoxX + 20, y: y - 15, font: bold, size: 10, color: ivory });
      page.drawText(amount || 'TBD', { x: totalBoxX + 140, y: y - 15, font: bold, size: 12, color: ivory });

      // ── PAYMENT METHODS ──
      y -= 80;
      page.drawText('PAYMENT METHODS ACCEPTED', { x: 40, y, font: bold, size: 9, color: noir });
      y -= 15;
      page.drawText('Zelle · Venmo · Cash · Check', { x: 40, y, font: reg, size: 10, color: noir });

      // ── CLIENT SIGNATURE SECTION ──
      y -= 45;
      page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: lightGray });
      
      y -= 25;
      page.drawText('CLIENT SIGNATURE', { x: 40, y, font: bold, size: 9, color: darkGray });
      y -= 15;
      page.drawText('By signing below, you confirm the Total Due and authorize Noir & Ivory Imaging to proceed.', {
        x: 40, y, font: reg, size: 8, color: darkGray,
      });

      y -= 35;
      // Signature box
      page.drawRectangle({
        x: 40, y: y - 60, width: 430, height: 70,
        color: c(255, 255, 255),
        borderColor: borderGray,
        borderWidth: 1,
      });
      page.drawText('Draw Signature Here', { x: 50, y: y - 30, font: reg, size: 11, color: c(220, 220, 220) });
      page.drawLine({
        start: { x: 50, y: y - 50 },
        end: { x: 450, y: y - 50 },
        thickness: 0.5,
        color: borderGray,
      });
      page.drawText('Client Signature', { x: 50, y: y - 60, font: reg, size: 8, color: darkGray });

      // Date box
      page.drawRectangle({
        x: 490, y: y - 60, width: 65, height: 70,
        color: c(255, 255, 255),
        borderColor: borderGray,
        borderWidth: 1,
      });
      page.drawText('Date', { x: 500, y: y - 65, font: reg, size: 8, color: darkGray });

      // ── FOOTER MESSAGE ──
      y -= 120;
      page.drawText('Thank you for choosing Noir & Ivory Imaging. We look forward to capturing your moments.', {
        x: 40, y, font: reg, size: 9, color: darkGray,
      });
      y -= 15;
      page.drawText('Contact us: noirandivoryimaging@outlook.com', { x: 40, y, font: reg, size: 9, color: darkGray });

      // ── BOTTOM FOOTER ──
      page.drawRectangle({ x: 0, y: 0, width, height: 35, color: c(248, 248, 248) });
      page.drawText('© Noir & Ivory Imaging', { x: 40, y: 10, font: reg, size: 8, color: darkGray });
      page.drawText('noirandivoryimaging@outlook.com', { x: width - 220, y: 10, font: reg, size: 8, color: darkGray });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = `Invoice-${invoiceNum}-${(booking.client_name || 'Client').replace(/\s+/g, '-')}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (onGenerated) {
        onGenerated(file);
      }

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
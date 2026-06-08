import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
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

  const generateInvoice = async () => {
    setGenerating(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();

      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const reg = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const noir = rgb(10 / 255, 10 / 255, 10 / 255);
      const ivory = rgb(249 / 255, 247 / 255, 245 / 255);
      const dark = rgb(26 / 255, 26 / 255, 26 / 255);

      // Header
      page.drawRectangle({ x: 0, y: height - 100, width, height: 100, color: noir });
      page.drawText('NOIR & IVORY IMAGING', { x: 40, y: height - 36, font: bold, size: 10, color: ivory });
      page.drawText('INVOICE', { x: 40, y: height - 74, font: bold, size: 28, color: ivory });

      // Details
      page.drawText('Bill To', { x: 40, y: height - 140, font: bold, size: 10, color: dark });
      page.drawText(booking.client_name || '—', { x: 40, y: height - 158, font: bold, size: 12, color: dark });
      page.drawText(booking.client_email || '', { x: 40, y: height - 175, font: reg, size: 9, color: dark });

      // Service Description
      page.drawText('Service', { x: 40, y: height - 240, font: bold, size: 9, color: dark });
      page.drawText(booking.package_request || 'Photography Services', { x: 40, y: height - 258, font: reg, size: 9, color: dark });

      // Amount
      page.drawText('Amount Due', { x: 40, y: height - 320, font: bold, size: 9, color: dark });
      page.drawText(amount || 'TBD', { x: 40, y: height - 338, font: bold, size: 14, color: dark });

      // Footer
      page.drawText('Thank you for choosing Noir & Ivory Imaging', { x: 40, y: 50, font: reg, size: 8, color: dark });
      page.drawText('noirandivoryimaging@outlook.com', { x: 40, y: 35, font: reg, size: 8, color: dark });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const invoiceNum = `NIV-${(booking.id?.slice(-6) || Date.now().toString().slice(-6)).toUpperCase()}`;
      const fileName = `Invoice-${invoiceNum}-${(booking.client_name || 'Client').replace(/\s+/g, '-')}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (onGenerated) {
        onGenerated(file);
        toast.success('Invoice ready to send');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast.error(`Failed to generate invoice: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
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
        {generating ? 'GENERATING...' : 'GENERATE & SEND'}
      </button>
    </div>
  );
}
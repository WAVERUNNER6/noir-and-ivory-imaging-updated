import React from 'react';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Keys must exactly match booking.package_request values (em-dash \u2014)
const PACKAGE_INFO = {
  'Business Events \u2014 Silver':           { price: '$850',               service: 'Photography Description', description: 'Business Event / Silver Package (Up to 3 hours)' },
  'Business Events \u2014 Gold':             { price: '$1,450',             service: 'Photography Description', description: 'Business Event / Gold Package (Up to 6 hours)' },
  'Business Events \u2014 Platinum':         { price: '$2,200',             service: 'Photography Description', description: 'Business Event / Platinum Package (Full Day)' },
  'Personal Events \u2014 Celebrations':     { price: 'Starting at $175',   service: 'Photography Description', description: 'Personal Event / Celebrations Package' },
  'Personal Events \u2014 Wedding':          { price: 'Starting at $1,200', service: 'Photography Description', description: 'Personal Event / Wedding Package' },
  'Real Estate \u2014 Limited Time Special': { price: '$350',               service: 'Photography Description', description: 'Real Estate / Limited Time Special' },
};

function c(r, g, b) {
  return rgb(r / 255, g / 255, b / 255);
}

export default function InvoiceGenerator({ booking }) {
  const generateInvoice = async () => {
    const pkg = PACKAGE_INFO[booking.package_request] || {
      price: 'TBD',
      service: 'Photography Description',
      description: booking.package_request || 'Photography Services',
    };

    const invoiceNum = `NIV-${(booking.id?.slice(-6) || Date.now().toString().slice(-6)).toUpperCase()}`;
    const today = format(new Date(), 'MMMM d, yyyy');

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
    const invNoW = reg.widthOfTextAtSize(invNoText, 9);
    page.drawText(invNoText, { x: width - 40 - invNoW, y: height - 36, font: reg, size: 9, color: ivory });

    const dateText = `Date: ${today}`;
    const dateW = reg.widthOfTextAtSize(dateText, 9);
    page.drawText(dateText, { x: width - 40 - dateW, y: height - 52, font: reg, size: 9, color: ivory });

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
      ['Time',     booking.shoot_time
        ? `${booking.shoot_time}${booking.shoot_end_time ? ` \u2014 ${booking.shoot_end_time}` : ''}`
        : 'TBD'],
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

    // ── Table header: SERVICE | DESCRIPTION | AMOUNT ──
    page.drawRectangle({ x: 40, y: height - 262, width: width - 80, height: 22, color: offWhite });
    page.drawText('SERVICE', { x: 52, y: height - 254, font: bold, size: 8, color: halide });
    page.drawText('DESCRIPTION', { x: 180, y: height - 254, font: bold, size: 8, color: halide });
    const amtHdrW = bold.widthOfTextAtSize('AMOUNT', 8);
    page.drawText('AMOUNT', { x: width - 52 - amtHdrW, y: height - 254, font: bold, size: 8, color: halide });

    // ── Table row ──
    // Service column
    page.drawText(pkg.service, { x: 52, y: height - 290, font: reg, size: 10, color: dark });

    // Description column (wrap if needed)
    const maxDescW = 200;
    const descWords = pkg.description.split(' ');
    let descLine = '';
    let descY = height - 290;
    descWords.forEach(word => {
      const test = descLine ? `${descLine} ${word}` : word;
      if (reg.widthOfTextAtSize(test, 10) > maxDescW) {
        page.drawText(descLine, { x: 180, y: descY, font: reg, size: 10, color: dark });
        descLine = word;
        descY -= 14;
      } else {
        descLine = test;
      }
    });
    if (descLine) page.drawText(descLine, { x: 180, y: descY, font: reg, size: 10, color: dark });

    // Amount column
    const priceW = bold.widthOfTextAtSize(pkg.price, 11);
    page.drawText(pkg.price, { x: width - 52 - priceW, y: height - 290, font: bold, size: 11, color: dark });

    // ── Divider ──
    page.drawLine({ start: { x: 40, y: height - 316 }, end: { x: width - 40, y: height - 316 }, thickness: 0.5, color: lightGray });

    // ── Total Due block ──
    page.drawRectangle({ x: 350, y: height - 348, width: 205, height: 28, color: noir });
    page.drawText('TOTAL DUE', { x: 360, y: height - 338, font: bold, size: 9, color: ivory });

    const form = pdfDoc.getForm();

    // Fillable Total Due field (pre-filled, editable by studio)
    const totalField = form.createTextField('total_due');
    totalField.setText(pkg.price);
    totalField.addToPage(page, {
      x: 458, y: height - 346,
      width: 92, height: 22,
      textColor: ivory,
      backgroundColor: c(22, 22, 22),
      borderWidth: 0,
      font: bold,
      fontSize: 11,
    });

    // ── Payment Methods ──
    page.drawText('PAYMENT METHODS ACCEPTED', { x: 40, y: height - 376, font: bold, size: 9, color: dark });
    page.drawText('Zelle  \u00b7  Venmo  \u00b7  Cash  \u00b7  Check', { x: 40, y: height - 392, font: reg, size: 9, color: mid });

    // ── Studio authorization (invisible — embedded as metadata, not shown to client) ──
    // Rendered off-page (y < 0) so it's part of the document but not visible when printed/viewed
    const studioSigField = form.createTextField('studio_authorization');
    studioSigField.setText(`Authorized by Noir & Ivory Imaging — ${today}`);
    studioSigField.addToPage(page, {
      x: 0, y: -50,       // off visible page area
      width: 1, height: 1, // 1×1 px — invisible
      textColor: c(255, 255, 255),
      backgroundColor: c(255, 255, 255),
      borderWidth: 0,
      font: reg,
      fontSize: 1,
    });

    // ── Client Signature Section ──
    page.drawLine({ start: { x: 40, y: height - 416 }, end: { x: width - 40, y: height - 416 }, thickness: 0.5, color: lightGray });
    page.drawText('CLIENT SIGNATURE', { x: 40, y: height - 436, font: bold, size: 8, color: halide });
    page.drawText('By signing below, you confirm the Total Due and authorize Noir & Ivory Imaging to proceed.', {
      x: 40, y: height - 450, font: reg, size: 8, color: mid,
    });

    // Draw-signature box for client (large, bordered, labeled)
    const sigBoxX = 40;
    const sigBoxY = height - 510;
    const sigBoxW = 320;
    const sigBoxH = 60;

    // Outer border
    page.drawRectangle({
      x: sigBoxX, y: sigBoxY,
      width: sigBoxW, height: sigBoxH,
      color: c(250, 250, 250),
      borderColor: c(160, 160, 160),
      borderWidth: 0.75,
    });

    // Faint "Draw Signature" watermark text inside the box
    page.drawText('Draw Signature Here', {
      x: sigBoxX + 14, y: sigBoxY + sigBoxH / 2 - 4,
      font: reg, size: 10, color: c(200, 200, 200),
      opacity: 0.6,
    });

    // Bottom signature line inside box
    page.drawLine({
      start: { x: sigBoxX + 14, y: sigBoxY + 14 },
      end:   { x: sigBoxX + sigBoxW - 14, y: sigBoxY + 14 },
      thickness: 0.5, color: c(180, 180, 180),
    });

    // Client signature label
    page.drawText('Client Signature', { x: sigBoxX, y: sigBoxY - 12, font: reg, size: 7, color: halide });

    // Date signed field (to the right of the sig box)
    const dateSigField = form.createTextField('date_signed');
    dateSigField.addToPage(page, {
      x: 380, y: sigBoxY,
      width: 155, height: 34,
      textColor: dark,
      backgroundColor: c(247, 247, 247),
      borderColor: c(180, 180, 180),
      borderWidth: 0.5,
      font: reg,
      fontSize: 11,
    });
    page.drawText('Date', { x: 380, y: sigBoxY - 12, font: reg, size: 7, color: halide });

    // ── Notes ──
    page.drawLine({ start: { x: 40, y: height - 548 }, end: { x: width - 40, y: height - 548 }, thickness: 0.5, color: lightGray });
    page.drawText('Thank you for choosing Noir & Ivory Imaging. We look forward to capturing your moments.', {
      x: 40, y: height - 564, font: reg, size: 8, color: halide,
    });
    page.drawText('Contact us: noirandivoryimaging@outlook.com', {
      x: 40, y: height - 578, font: reg, size: 8, color: halide,
    });

    // ── Footer ──
    page.drawRectangle({ x: 0, y: 0, width, height: 44, color: offWhite });
    page.drawText('\u00a9 Noir & Ivory Imaging', { x: 40, y: 18, font: reg, size: 8, color: halide });
    const footerEmailW = reg.widthOfTextAtSize('noirandivoryimaging@outlook.com', 8);
    page.drawText('noirandivoryimaging@outlook.com', { x: width - 40 - footerEmailW, y: 18, font: reg, size: 8, color: halide });

    // ── Download ──
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoiceNum}-${(booking.client_name || 'Client').replace(/\s+/g, '-')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={generateInvoice}
      className="flex items-center gap-2 border border-halide/30 text-halide px-5 py-2.5 font-mono text-[11px] tracking-widest hover:border-ivory hover:text-ivory transition-colors"
    >
      <FileText size={13} /> DOWNLOAD INVOICE
    </button>
  );
}
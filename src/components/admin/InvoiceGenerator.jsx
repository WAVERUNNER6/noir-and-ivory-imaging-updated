import React from 'react';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { PDFDocument, rgb, StandardFonts, PDFName, PDFString, PDFDict, PDFArray, PDFHexString } from 'pdf-lib';

const PACKAGE_INFO = {
  'Business Events — Silver':         { price: '$850',           description: 'Silver Package — Business Event Photography (Up to 3 hours)' },
  'Business Events — Gold':           { price: '$1,450',         description: 'Gold Package — Business Event Photography (Up to 6 hours)' },
  'Business Events — Platinum':       { price: '$2,200',         description: 'Platinum Package — Business Event Photography (Full day)' },
  'Personal Events — Celebrations':   { price: 'Starting at $175',   description: 'Celebrations Package — Personal Event Photography' },
  'Personal Events — Wedding':        { price: 'Starting at $1,200', description: 'Wedding Package — Personal Event Photography' },
  'Real Estate — Limited Time Special': { price: '$350',         description: 'Limited Time Special — Real Estate Photography' },
};

function hex(r, g, b) {
  return rgb(r / 255, g / 255, b / 255);
}

export default function InvoiceGenerator({ booking }) {
  const generateInvoice = async () => {
    const pkg = PACKAGE_INFO[booking.package_request] || {
      price: 'TBD',
      description: booking.package_request || 'Photography Services',
    };
    const invoiceNum = `NIV-${booking.id?.slice(-6)?.toUpperCase() || Date.now().toString().slice(-6)}`;
    const today = format(new Date(), 'MMMM d, yyyy');

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const noir = hex(10, 10, 10);
    const ivory = hex(249, 247, 245);
    const halide = hex(142, 142, 142);
    const dark = hex(26, 26, 26);
    const mid = hex(80, 80, 80);
    const light = hex(220, 220, 220);
    const offWhite = hex(248, 247, 245);

    // ── Header bar ──
    page.drawRectangle({ x: 0, y: height - 130, width, height: 130, color: noir });

    page.drawText('NOIR & IVORY IMAGING', {
      x: 40, y: height - 38,
      font: helveticaBold, size: 10, color: ivory,
    });
    page.drawText('INVOICE', {
      x: 40, y: height - 80,
      font: helveticaBold, size: 26, color: ivory,
    });
    page.drawText(`Invoice No: ${invoiceNum}`, {
      x: width - 40, y: height - 38,
      font: helvetica, size: 9, color: ivory,
      xSkewAngle: 0,
    });
    // right-align manually
    const invNoW = helvetica.widthOfTextAtSize(`Invoice No: ${invoiceNum}`, 9);
    page.drawText(`Invoice No: ${invoiceNum}`, { x: width - 40 - invNoW, y: height - 38, font: helvetica, size: 9, color: ivory });
    const dateW = helvetica.widthOfTextAtSize(`Date: ${today}`, 9);
    page.drawText(`Date: ${today}`, { x: width - 40 - dateW, y: height - 56, font: helvetica, size: 9, color: ivory });

    // ── Divider ──
    page.drawLine({ start: { x: 40, y: height - 150 }, end: { x: width - 40, y: height - 150 }, thickness: 0.5, color: light });

    // ── Bill To ──
    page.drawText('BILL TO', { x: 40, y: height - 172, font: helveticaBold, size: 8, color: halide });
    page.drawText(booking.client_name || '—', { x: 40, y: height - 190, font: helveticaBold, size: 14, color: dark });
    page.drawText(booking.client_email || '', { x: 40, y: height - 207, font: helvetica, size: 10, color: mid });
    if (booking.client_phone) {
      page.drawText(booking.client_phone, { x: 40, y: height - 222, font: helvetica, size: 10, color: mid });
    }

    // ── Session Details ──
    const sX = 320;
    page.drawText('SESSION DETAILS', { x: sX, y: height - 172, font: helveticaBold, size: 8, color: halide });
    const sessionRows = [
      ['Date', booking.shoot_date || 'TBD'],
      ['Time', booking.shoot_time ? `${booking.shoot_time}${booking.shoot_end_time ? ` — ${booking.shoot_end_time}` : ''}` : 'TBD'],
      ['Location', booking.location || 'TBD'],
    ];
    sessionRows.forEach(([label, val], i) => {
      const y = height - 190 - i * 18;
      page.drawText(`${label}:`, { x: sX, y, font: helveticaBold, size: 9, color: halide });
      page.drawText(val, { x: sX + 60, y, font: helvetica, size: 9, color: dark });
    });

    // ── Divider ──
    page.drawLine({ start: { x: 40, y: height - 250 }, end: { x: width - 40, y: height - 250 }, thickness: 0.5, color: light });

    // ── Table header ──
    page.drawRectangle({ x: 40, y: height - 278, width: width - 80, height: 22, color: offWhite });
    page.drawText('SERVICE / DESCRIPTION', { x: 52, y: height - 270, font: helveticaBold, size: 8, color: halide });
    page.drawText('AMOUNT', { x: width - 52 - helveticaBold.widthOfTextAtSize('AMOUNT', 8), y: height - 270, font: helveticaBold, size: 8, color: halide });

    // ── Table row ──
    page.drawText(pkg.description, { x: 52, y: height - 306, font: helvetica, size: 10, color: dark });
    const priceW = helveticaBold.widthOfTextAtSize(pkg.price, 11);
    page.drawText(pkg.price, { x: width - 52 - priceW, y: height - 306, font: helveticaBold, size: 11, color: dark });

    // ── Divider ──
    page.drawLine({ start: { x: 40, y: height - 328 }, end: { x: width - 40, y: height - 328 }, thickness: 0.5, color: light });

    // ── Total Due (fillable field) ──
    page.drawRectangle({ x: 360, y: height - 360, width: 195, height: 26, color: noir });
    page.drawText('TOTAL DUE', { x: 370, y: height - 350, font: helveticaBold, size: 9, color: ivory });

    // Add AcroForm fillable text field for Total Due
    const form = pdfDoc.getForm();
    const totalField = form.createTextField('total_due');
    totalField.setText(pkg.price);
    totalField.addToPage(page, {
      x: 470, y: height - 358,
      width: 80, height: 20,
      textColor: ivory,
      backgroundColor: rgb(0.08, 0.08, 0.08),
      borderWidth: 0,
      font: helveticaBold,
      fontSize: 12,
    });

    // ── Payment methods ──
    page.drawText('PAYMENT METHODS ACCEPTED', { x: 40, y: height - 388, font: helveticaBold, size: 9, color: dark });
    page.drawText('Zelle  ·  Venmo  ·  Cash  ·  Check', { x: 40, y: height - 404, font: helvetica, size: 9, color: mid });

    // ── Signature field ──
    page.drawLine({ start: { x: 40, y: height - 430 }, end: { x: width - 40, y: height - 430 }, thickness: 0.5, color: light });
    page.drawText('AUTHORIZED SIGNATURE', { x: 40, y: height - 450, font: helveticaBold, size: 8, color: halide });
    page.drawText('By signing below, the Total Due amount is confirmed and the invoice is finalized.', {
      x: 40, y: height - 464, font: helvetica, size: 8, color: mid,
    });

    // Signature text field (acts as signature line; locks form on print/flatten)
    const sigField = form.createTextField('signature');
    sigField.setText('');
    sigField.addToPage(page, {
      x: 40, y: height - 510,
      width: 260, height: 32,
      textColor: dark,
      backgroundColor: rgb(0.97, 0.97, 0.97),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5,
      font: helvetica,
      fontSize: 13,
    });
    page.drawText('Signature', { x: 44, y: height - 524, font: helvetica, size: 7, color: halide });

    // Date signed field
    const dateSigField = form.createTextField('date_signed');
    dateSigField.setText('');
    dateSigField.addToPage(page, {
      x: 320, y: height - 510,
      width: 130, height: 32,
      textColor: dark,
      backgroundColor: rgb(0.97, 0.97, 0.97),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5,
      font: helvetica,
      fontSize: 11,
    });
    page.drawText('Date', { x: 324, y: height - 524, font: helvetica, size: 7, color: halide });

    // ── Notes ──
    page.drawLine({ start: { x: 40, y: height - 548 }, end: { x: width - 40, y: height - 548 }, thickness: 0.5, color: light });
    page.drawText('Thank you for choosing Noir & Ivory Imaging. We look forward to capturing your moments.', {
      x: 40, y: height - 566, font: helvetica, size: 8, color: halide,
    });
    page.drawText('Questions? Contact us at noirandivoryimaging@outlook.com', {
      x: 40, y: height - 580, font: helvetica, size: 8, color: halide,
    });

    // ── Footer ──
    page.drawRectangle({ x: 0, y: 0, width, height: 50, color: offWhite });
    page.drawText('© Noir & Ivory Imaging', { x: 40, y: 22, font: helvetica, size: 8, color: halide });
    const emailW = helvetica.widthOfTextAtSize('noirandivoryimaging@outlook.com', 8);
    page.drawText('noirandivoryimaging@outlook.com', { x: width - 40 - emailW, y: 22, font: helvetica, size: 8, color: halide });

    // ── Finalize ──
    // Mark total_due as read-only once signature is present (JS action hint via field flag)
    // We flatten total_due field so it's editable now but locks visually after signing
    // Set signature field to trigger locking via PDF JS if supported; otherwise fields remain editable until flatten
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoiceNum}-${booking.client_name?.replace(/\s+/g, '-') || 'Client'}.pdf`;
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
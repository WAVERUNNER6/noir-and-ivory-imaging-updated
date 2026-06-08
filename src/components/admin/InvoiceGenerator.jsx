import React from 'react';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

const PACKAGE_PRICES = {
  'Business Events — Silver': { price: '$850', description: 'Up to 3 hours of professional event coverage' },
  'Business Events — Gold': { price: '$1,450', description: 'Up to 6 hours of professional event coverage' },
  'Business Events — Platinum': { price: '$2,200', description: 'Full day professional event coverage' },
  'Personal Events — Celebrations': { price: 'Starting at $175', description: 'Personal celebration photography' },
  'Personal Events — Wedding': { price: 'Starting at $1,200', description: 'Full wedding photography coverage' },
  'Real Estate — Limited Time Special': { price: '$350', description: 'Professional real estate photography' },
};

export default function InvoiceGenerator({ booking }) {
  const generateInvoice = () => {
    const doc = new jsPDF();
    const pkg = PACKAGE_PRICES[booking.package_request] || { price: 'TBD', description: booking.package_request || 'Photography Services' };
    const invoiceNum = `NIV-${booking.id?.slice(-6)?.toUpperCase() || Date.now().toString().slice(-6)}`;
    const today = format(new Date(), 'MMMM d, yyyy');

    // Background
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 45, 'F');

    // Studio name
    doc.setTextColor(249, 247, 245);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('NOIR & IVORY IMAGING', 20, 18);

    // Invoice title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'light');
    doc.text('INVOICE', 20, 34);

    // Invoice number + date (top right)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${invoiceNum}`, 210 - 20, 18, { align: 'right' });
    doc.text(`Date: ${today}`, 210 - 20, 26, { align: 'right' });

    // Divider
    doc.setDrawColor(142, 142, 142);
    doc.setLineWidth(0.3);
    doc.line(20, 52, 190, 52);

    // Bill To
    doc.setTextColor(142, 142, 142);
    doc.setFontSize(8);
    doc.text('BILL TO', 20, 62);

    doc.setTextColor(26, 26, 26);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(booking.client_name || '—', 20, 71);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(booking.client_email || '', 20, 79);
    if (booking.client_phone) doc.text(booking.client_phone, 20, 86);

    // Session details (right side)
    doc.setTextColor(142, 142, 142);
    doc.setFontSize(8);
    doc.text('SESSION DETAILS', 120, 62);

    doc.setTextColor(26, 26, 26);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const details = [
      ['Date', booking.shoot_date || 'TBD'],
      ['Time', booking.shoot_time ? `${booking.shoot_time}${booking.shoot_end_time ? ` — ${booking.shoot_end_time}` : ''}` : 'TBD'],
      ['Location', booking.location || 'TBD'],
    ];
    details.forEach(([label, val], i) => {
      doc.setTextColor(142, 142, 142);
      doc.setFontSize(9);
      doc.text(`${label}:`, 120, 71 + i * 9);
      doc.setTextColor(26, 26, 26);
      doc.text(val, 145, 71 + i * 9);
    });

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 100, 190, 100);

    // Table header
    doc.setFillColor(248, 247, 245);
    doc.rect(20, 106, 170, 10, 'F');
    doc.setTextColor(142, 142, 142);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('SERVICE', 25, 113);
    doc.text('DESCRIPTION', 90, 113);
    doc.text('AMOUNT', 190, 113, { align: 'right' });

    // Table row
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.package_request || 'Photography Services', 25, 126);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const descLines = doc.splitTextToSize(pkg.description, 60);
    doc.text(descLines, 90, 126);
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    doc.setFont('helvetica', 'bold');
    doc.text(pkg.price, 190, 126, { align: 'right' });

    // Total area
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 140, 190, 140);

    doc.setFillColor(10, 10, 10);
    doc.rect(130, 145, 60, 14, 'F');
    doc.setTextColor(249, 247, 245);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('TOTAL DUE', 135, 153);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(pkg.price, 188, 153, { align: 'right' });

    // Payment methods
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT METHODS ACCEPTED', 20, 172);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Zelle · Venmo · Cash · Check', 20, 180);

    // Notes
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 188, 190, 188);
    doc.setTextColor(142, 142, 142);
    doc.setFontSize(8);
    doc.text('Thank you for choosing Noir & Ivory Imaging. We look forward to capturing your moments.', 20, 196);
    doc.text('Please contact us at noirandivoryimaging@outlook.com with any questions.', 20, 203);

    // Footer
    doc.setFillColor(248, 247, 245);
    doc.rect(0, 272, 210, 25, 'F');
    doc.setTextColor(142, 142, 142);
    doc.setFontSize(8);
    doc.text('© Noir & Ivory Imaging', 20, 283);
    doc.text('noirandivoryimaging@outlook.com', 210 - 20, 283, { align: 'right' });

    doc.save(`Invoice-${invoiceNum}-${booking.client_name?.replace(/\s+/g, '-') || 'Client'}.pdf`);
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
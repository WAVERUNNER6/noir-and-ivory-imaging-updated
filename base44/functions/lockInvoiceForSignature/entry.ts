import { PDFDocument } from 'npm:pdf-lib@1.17.1';

Deno.serve(async (req) => {
  try {
    const { file_url } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'Missing file_url' }, { status: 400 });
    }

    // Fetch the uploaded PDF
    const pdfResponse = await fetch(file_url);
    if (!pdfResponse.ok) {
      return Response.json({ error: 'Failed to fetch PDF' }, { status: 400 });
    }

    const pdfBytes = await pdfResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Get all form fields
    const fields = form.getFields();

    // Lock all fields except signature fields
    fields.forEach(field => {
      if (field.getName().includes('signature') || field.getName().includes('sig')) {
        // Keep signature fields unlocked
      } else {
        field.setReadOnly(true);
      }
    });

    // Flatten all non-signature fields to prevent editing
    form.flatten();

    const lockedPdfBytes = await pdfDoc.save();
    const blob = new Blob([lockedPdfBytes], { type: 'application/pdf' });

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=invoice-locked.pdf',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
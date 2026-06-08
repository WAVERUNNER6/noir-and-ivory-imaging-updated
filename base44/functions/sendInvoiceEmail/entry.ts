import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function graphRequest(accessToken, path, options = {}) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Graph API error: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { booking, invoice_uri } = await req.json();
    if (!booking?.client_email) {
      return Response.json({ error: 'Missing client email' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

    // Create signed URL for invoice download
    let invoiceLink = '';
    if (invoice_uri) {
      const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: invoice_uri, expires_in: 2592000 });
      invoiceLink = signed_url;
    }

    const isRealEstate = booking.shoot_type === 'real_estate';
    const isPersonal = booking.shoot_type === 'event' && (booking.package_request || '').startsWith('Personal');
    const shootTypeLabel = isRealEstate ? 'Real Estate Photography' : isPersonal ? 'Personal Event Photography' : 'Business Event Photography';

    const htmlBody = `
      <div style="font-family: 'Georgia', serif; max-width: 580px; margin: 0 auto; color: #1a1a1a; background: #fff;">
        <div style="background: #0A0A0A; padding: 32px 40px;">
          <p style="color: #F9F7F5; font-size: 11px; letter-spacing: 4px; margin: 0 0 8px 0; text-transform: uppercase; font-family: monospace;">NOIR & IVORY IMAGING</p>
          <h1 style="color: #F9F7F5; font-size: 28px; margin: 0; font-weight: 300;">📄 Your Invoice</h1>
        </div>
        <div style="padding: 36px 40px; border: 1px solid #e8e8e8; border-top: none;">
          <p style="font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">Dear ${booking.client_name},</p>
          <p style="font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
            Please find your invoice attached for your upcoming <strong>${shootTypeLabel}</strong> session on <strong>${booking.shoot_date}</strong>.
          </p>
          <div style="background: #f8f7f5; padding: 24px; margin-bottom: 28px;">
            <p style="font-size: 14px; color: #1a1a1a; line-height: 1.7; margin: 0 0 12px 0;">
              We accept payment via <strong>Zelle, Venmo, Cash, or Check</strong>. Please don't hesitate to reach out with any questions.
            </p>
            ${invoiceLink ? `<p style="font-size: 14px; margin: 12px 0 0 0;"><a href="${invoiceLink}" style="color: #0A0A0A; text-decoration: underline; font-weight: 500;">Download Invoice</a></p>` : ''}
          </div>
          <p style="font-size: 14px; color: #8E8E8E; margin: 0;">noirandivoryimaging@outlook.com</p>
        </div>
        <div style="padding: 20px 40px; background: #f8f7f5;">
          <p style="font-family: monospace; font-size: 10px; letter-spacing: 2px; color: #8E8E8E; margin: 0; text-transform: uppercase;">© Noir & Ivory Imaging — All rights reserved</p>
        </div>
      </div>
    `;

    await graphRequest(accessToken, '/me/sendMail', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          subject: `Noir & Ivory Imaging — Invoice for Your ${shootTypeLabel} Session`,
          body: { contentType: 'HTML', content: htmlBody },
          toRecipients: [{ emailAddress: { address: booking.client_email } }],
        },
        saveToSentItems: true,
      }),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
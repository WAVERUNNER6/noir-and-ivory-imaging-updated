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

    const { booking, invoice_url, app_url } = await req.json();
    if (!booking?.client_email) {
      return Response.json({ error: 'Missing client email' }, { status: 400 });
    }

    // Ensure booking has a portal token
    let portalToken = booking.portal_token;
    if (!portalToken) {
      portalToken = Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      await base44.asServiceRole.entities.Booking.update(booking.id, { portal_token: portalToken });
    }

    const baseUrl = app_url || 'https://app.base44.com';
    const portalUrl = `${baseUrl}/portal?token=${portalToken}`;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

    // Fetch the invoice file and convert to base64 (chunked to avoid stack overflow on large files)
    let attachments = [];
    if (invoice_url) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const fileRes = await fetch(invoice_url, { signal: controller.signal });
      clearTimeout(timeout);
      const buffer = await fileRes.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);
      const fileName = `Invoice-${booking.client_name?.replace(/\s+/g, '-') || 'Client'}.pdf`;
      attachments = [{
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: fileName,
        contentType: 'application/pdf',
        contentBytes: base64,
      }];
    }

    const isRealEstate = booking.shoot_type === 'real_estate';
    const isPersonal = (booking.package_request || '').startsWith('Personal');
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
            <p style="font-size: 14px; color: #1a1a1a; line-height: 1.7; margin: 0 0 8px 0;">
              We accept payment via <strong>${isPersonal ? 'Zelle, Venmo, or Cash' : 'Zelle, Venmo, Cash, or Check'}</strong>. Please don't hesitate to reach out with any questions.
            </p>
          </div>
          <p style="font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            Please review, sign, and return the invoice using your secure client portal:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${portalUrl}" style="display: inline-block; background: #0A0A0A; color: #F9F7F5; padding: 16px 40px; font-family: monospace; font-size: 12px; letter-spacing: 3px; text-decoration: none; text-transform: uppercase;">
              SIGN &amp; RETURN INVOICE →
            </a>
          </div>
          <p style="font-size: 13px; color: #8E8E8E; line-height: 1.6; margin: 0 0 16px 0;">This is a private link for your session only. Questions? Reply to this email.</p>
          <p style="font-size: 14px; color: #8E8E8E; margin: 0;">studio@noirandivoryimaging.com</p>
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
          attachments,
        },
        saveToSentItems: true,
      }),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
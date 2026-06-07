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

function parseDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  let hours = 9, minutes = 0;
  const match = (timeStr || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    hours = parseInt(match[1]);
    minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }
  return new Date(year, month - 1, day, hours, minutes).toISOString().slice(0, 19);
}

async function generateToken(bookingId, action, appId) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(appId || 'noir-ivory-secret');
  const msgData = encoder.encode(`${bookingId}:${action}`);
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, msgData);
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking, booking_id } = await req.json();
    const appId = Deno.env.get('BASE44_APP_ID') || 'noir-ivory-secret';

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

    const shootDate = booking.shoot_date;
    const shootTypeLabel = booking.shoot_type === 'real_estate' ? 'Real Estate Photography' : 'Event Photography';

    // Generate one-click action tokens
    const confirmToken = await generateToken(booking_id, 'confirm', appId);
    const declineToken = await generateToken(booking_id, 'decline', appId);

    // Build action URLs — derive the base from the incoming request's host
    const reqUrl = new URL(req.url);
    const baseUrl = `${reqUrl.origin}/functions/bookingAction`;
    const confirmUrl = `${baseUrl}?booking_id=${booking_id}&action=confirm&token=${confirmToken}`;
    const declineUrl = `${baseUrl}?booking_id=${booking_id}&action=decline&token=${declineToken}`;

    // 1. Create calendar event (pending)
    const startDT = parseDateTime(shootDate, booking.shoot_time || '09:00 AM');
    const endDate = new Date(startDT);
    endDate.setHours(endDate.getHours() + 2);
    const endDTStr = endDate.toISOString().slice(0, 19);

    await graphRequest(accessToken, '/me/events', {
      method: 'POST',
      body: JSON.stringify({
        subject: `⏳ ${shootTypeLabel} — ${booking.client_name} (PENDING)`,
        body: {
          contentType: 'HTML',
          content: `
            <p><strong>Status:</strong> Pending Review</p>
            <p><strong>Client:</strong> ${booking.client_name}</p>
            <p><strong>Email:</strong> ${booking.client_email}</p>
            ${booking.client_phone ? `<p><strong>Phone:</strong> ${booking.client_phone}</p>` : ''}
            <p><strong>Location:</strong> ${booking.location || 'TBD'}</p>
            <p><strong>Package:</strong> ${booking.package_request || 'Not specified'}</p>
            ${booking.details ? `<p><strong>Details:</strong> ${booking.details}</p>` : ''}
          `,
        },
        start: { dateTime: startDT, timeZone: 'Eastern Standard Time' },
        end: { dateTime: endDTStr, timeZone: 'Eastern Standard Time' },
        location: { displayName: booking.location || 'TBD' },
      }),
    });

    // 2. Send studio notification email WITH confirm/decline buttons
    await graphRequest(accessToken, '/me/sendMail', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          subject: `⏳ New Booking Request — ${shootTypeLabel} on ${shootDate}`,
          body: {
            contentType: 'HTML',
            content: `
              <div style="font-family: 'Georgia', serif; max-width: 600px; color: #1a1a1a; background: #fff;">
                <div style="background: #0A0A0A; padding: 28px 36px;">
                  <p style="color: #F9F7F5; font-size: 11px; letter-spacing: 4px; margin: 0 0 6px; font-family: monospace; text-transform: uppercase;">Noir & Ivory Imaging</p>
                  <h2 style="color: #F9F7F5; font-size: 24px; font-weight: 300; margin: 0;">New Booking Request</h2>
                </div>
                <div style="padding: 32px 36px; border: 1px solid #e8e8e8; border-top: none;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 28px;">
                    <tr><td style="padding: 7px 0; color: #888; width: 140px;">Shoot Type</td><td style="color: #1a1a1a;">${shootTypeLabel}</td></tr>
                    <tr><td style="padding: 7px 0; color: #888;">Date</td><td style="color: #1a1a1a;">${shootDate}</td></tr>
                    <tr><td style="padding: 7px 0; color: #888;">Time</td><td style="color: #1a1a1a;">${booking.shoot_time || 'Flexible'}</td></tr>
                    <tr><td style="padding: 7px 0; color: #888;">Location</td><td style="color: #1a1a1a;">${booking.location || 'TBD'}</td></tr>
                    <tr><td style="padding: 7px 0; color: #888;">Package</td><td style="color: #1a1a1a;">${booking.package_request || 'Not specified'}</td></tr>
                    <tr><td style="padding: 7px 0; color: #888;">Name</td><td style="color: #1a1a1a;">${booking.client_name}</td></tr>
                    <tr><td style="padding: 7px 0; color: #888;">Email</td><td><a href="mailto:${booking.client_email}" style="color: #1a1a1a;">${booking.client_email}</a></td></tr>
                    ${booking.client_phone ? `<tr><td style="padding: 7px 0; color: #888;">Phone</td><td style="color: #1a1a1a;">${booking.client_phone}</td></tr>` : ''}
                    ${booking.details ? `<tr><td style="padding: 7px 0; color: #888; vertical-align: top;">Details</td><td style="color: #1a1a1a;">${booking.details}</td></tr>` : ''}
                  </table>

                  <!-- Action Buttons -->
                  <div style="background: #f8f7f5; padding: 24px; text-align: center;">
                    <p style="font-family: monospace; font-size: 10px; letter-spacing: 3px; color: #8E8E8E; margin: 0 0 20px; text-transform: uppercase;">Respond to this request</p>
                    <table style="margin: 0 auto;" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px;">
                          <a href="${confirmUrl}" style="display: inline-block; background: #0A0A0A; color: #F9F7F5; text-decoration: none; padding: 14px 32px; font-family: monospace; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">
                            ✓ Confirm Session
                          </a>
                        </td>
                        <td>
                          <a href="${declineUrl}" style="display: inline-block; background: #fff; color: #C62828; text-decoration: none; padding: 14px 32px; font-family: monospace; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; border: 1px solid #C62828;">
                            ✗ Decline
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="font-size: 12px; color: #aaa; margin: 16px 0 0;">Clicking either button will automatically notify the client.</p>
                  </div>
                </div>
                <div style="padding: 16px 36px; background: #f8f7f5;">
                  <p style="font-family: monospace; font-size: 10px; letter-spacing: 2px; color: #aaa; margin: 0; text-transform: uppercase;">© Noir & Ivory Imaging</p>
                </div>
              </div>
            `,
          },
          toRecipients: [{ emailAddress: { address: 'noirandivoryimaging@outlook.com' } }],
        },
        saveToSentItems: true,
      }),
    });

    return Response.json({ success: true, message: 'Studio notified with confirm/decline buttons.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
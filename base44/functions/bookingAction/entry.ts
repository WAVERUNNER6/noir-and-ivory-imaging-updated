import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Called via GET link from the studio email — no auth required, token-validated.
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const booking_id = url.searchParams.get('booking_id');
    const action = url.searchParams.get('action');
    const token = url.searchParams.get('token');

    if (!booking_id || !action || !token) {
      return new Response(htmlPage('❌ Invalid request.', 'Missing required parameters.', '#C62828'), {
        status: 400, headers: { 'Content-Type': 'text/html' },
      });
    }

    // Validate HMAC token
    const appId = Deno.env.get('BASE44_APP_ID') || 'noir-ivory-secret';
    const encoder = new TextEncoder();
    const keyData = encoder.encode(appId);
    const msgData = encoder.encode(`${booking_id}:${action}`);
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBuf = Uint8Array.from(atob(token.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBuf, msgData);

    if (!valid) {
      return new Response(htmlPage('❌ Invalid or expired link.', 'This action link is not valid.', '#C62828'), {
        status: 403, headers: { 'Content-Type': 'text/html' },
      });
    }

    const base44 = createClientFromRequest(req);
    const booking = await base44.asServiceRole.entities.Booking.get(booking_id);

    if (!booking) {
      return new Response(htmlPage('❌ Not Found.', 'This booking no longer exists.', '#C62828'), {
        status: 404, headers: { 'Content-Type': 'text/html' },
      });
    }

    if (booking.status !== 'pending') {
      return new Response(htmlPage(
        '⚠️ Already actioned.',
        `This booking is already marked as <strong>${booking.status}</strong>. No changes made.`,
        '#8E8E8E'
      ), { status: 200, headers: { 'Content-Type': 'text/html' } });
    }

    const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
    await base44.asServiceRole.entities.Booking.update(booking_id, { status: newStatus });

    const color = newStatus === 'confirmed' ? '#2E7D32' : '#C62828';
    const title = newStatus === 'confirmed' ? '✅ Session Confirmed!' : '❌ Booking Declined';
    const message = newStatus === 'confirmed'
      ? `<strong>${booking.client_name}</strong>'s session on <strong>${booking.shoot_date}</strong> has been confirmed. A confirmation email is being sent to the client automatically.`
      : `<strong>${booking.client_name}</strong>'s booking has been declined. A cancellation email is being sent to the client automatically.`;

    return new Response(htmlPage(title, message, color), {
      status: 200, headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    return new Response(htmlPage('❌ Error', error.message, '#C62828'), {
      status: 500, headers: { 'Content-Type': 'text/html' },
    });
  }
});

function htmlPage(title, message, color) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Noir & Ivory Imaging</title>
  <style>
    body { margin:0; font-family:'Georgia',serif; background:#0A0A0A; color:#F9F7F5; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .card { max-width:480px; width:90%; text-align:center; padding:48px 40px; border:1px solid #2a2a2a; }
    .brand { font-family:monospace; font-size:10px; letter-spacing:4px; color:#8E8E8E; text-transform:uppercase; margin-bottom:32px; }
    h1 { font-size:28px; font-weight:300; margin:0 0 20px; color:${color}; }
    p { font-size:15px; line-height:1.7; color:#8E8E8E; margin:0; }
    strong { color:#F9F7F5; }
    .footer { margin-top:40px; font-family:monospace; font-size:10px; letter-spacing:2px; color:#3a3a3a; }
  </style>
</head>
<body>
  <div class="card">
    <p class="brand">Noir & Ivory Imaging</p>
    <h1>${title}</h1>
    <p>${message}</p>
    <p class="footer">You can close this window.</p>
  </div>
</body>
</html>`;
}
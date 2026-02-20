import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

interface InvitationEmailPayload {
  to: string;
  orgName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

function buildEmailHtml(payload: InvitationEmailPayload): string {
  const roleLabel = ROLE_LABELS[payload.role] ?? payload.role;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to ${payload.orgName}</title>
</head>
<body style="margin:0;padding:0;background:#F8F9FA;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #E3E8EF;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 40px 24px;border-bottom:1px solid #E3E8EF;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:32px;height:32px;border-radius:8px;background:#1A73E8;display:inline-block;vertical-align:middle;text-align:center;line-height:32px;">
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style="vertical-align:middle;margin-top:8px;">
                    <path d="M2 10l2.5-4 2.5 2.5 2-3.5 3 5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span style="font-size:18px;font-weight:700;color:#202124;vertical-align:middle;margin-left:8px;">AdsPulse</span>
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#202124;letter-spacing:-0.5px;">
                You're invited to join ${payload.orgName}
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#5F6368;line-height:1.6;">
                <strong>${payload.inviterName}</strong> has invited you to collaborate on
                <strong>${payload.orgName}</strong> in AdsPulse as a <strong>${roleLabel}</strong>.
              </p>
              <a href="${payload.inviteUrl}"
                 style="display:inline-block;padding:12px 28px;background:#1A73E8;color:#fff;border-radius:9px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.1px;">
                Accept invitation →
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#9AA0A6;line-height:1.6;">
                This invitation expires in 7 days. If you weren't expecting this email, you can safely ignore it.
              </p>
              <p style="margin:12px 0 0;font-size:12px;color:#9AA0A6;">
                Or copy this link into your browser:<br/>
                <a href="${payload.inviteUrl}" style="color:#1A73E8;word-break:break-all;">${payload.inviteUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 40px;border-top:1px solid #E3E8EF;background:#F8F9FA;">
              <p style="margin:0;font-size:11.5px;color:#9AA0A6;text-align:center;">
                © ${new Date().getFullYear()} AdsPulse. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    return new Response(
      JSON.stringify({ error: 'RESEND_API_KEY is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let payload: InvitationEmailPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON payload' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!payload.to || !payload.orgName || !payload.inviteUrl) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: to, orgName, inviteUrl' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AdsPulse <noreply@adspulse.app>',
      to: [payload.to],
      subject: `You're invited to join ${payload.orgName} on AdsPulse`,
      html: buildEmailHtml(payload),
    }),
  });

  if (!emailRes.ok) {
    const body = await emailRes.text();
    return new Response(
      JSON.stringify({ error: `Resend API error: ${body}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = await emailRes.json();
  return new Response(
    JSON.stringify({ success: true, id: result.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

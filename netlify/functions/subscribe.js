// ... previous imports and CORS ...

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };

  try {
    const { email, consent, hp } = JSON.parse(event.body || '{}');

    // honeypot
    if (hp && String(hp).trim() !== '') {
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, bot: true }) };
    }

    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(String(email || '').trim())) {
      return { statusCode: 400, headers: corsHeaders, body: 'Invalid email' };
    }
    const consentBool = !!consent;

    const supabase = require('@supabase/supabase-js')
      .createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

    // ✅ Use UPSERT and conflict on the unique column
    const { error: dbErr } = await supabase
      .from('waiting_list')
      .upsert(
        [{ email, consent: consentBool, source: 'landing' }],
        { onConflict: 'email' }              // must match the unique column(s)
      );

    if (dbErr) {
      // If your client lib still returns 23505 on conflict, swallow it
      if (dbErr.code === '23505') {
        console.warn('Duplicate email, treating as OK:', email);
      } else {
        console.error('Supabase error:', dbErr);
        return { statusCode: 500, headers: corsHeaders, body: 'DB error' };
      }
    }

    // Send email but don't block success if SMTP fails
    try {
      const transporter = require('nodemailer').createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });

      const subject = 'Thanks & Welcome — Inkphora Private Beta';
      const text = `Thanks for joining us and Welcome to the private beta trial of Thymiko / Inkphora.
We'll be in touch soon with the next steps to use the app.

- The Inkphora Team`;
      const html = `<div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;font-size:16px;line-height:1.5;color:#111">
  <p>Thanks for joining us and <strong>Welcome to the private beta trial of Thymiko / Inkphora</strong>.</p>
  <p>We'll be in touch soon with the next steps to use the app.</p>
  <p style="margin-top:14px">— The Inkphora Team</p>
</div>`;

      await transporter.sendMail({ from: process.env.SMTP_FROM, to: email, subject, text, html });
    } catch (mailErr) {
      console.error('SMTP error (not blocking):', mailErr);
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('Function error:', e);
    return { statusCode: 500, headers: corsHeaders, body: 'Server error' };
  }
};

// CommonJS (Netlify Functions v1)
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const ORIGIN = process.env.CORS_ORIGIN || '*';
const corsHeaders = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const { email, consent, hp } = JSON.parse(event.body || '{}');

    // Honeypot: blocca bot
    if (hp && String(hp).trim() !== '') {
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, bot: true }) };
    }

    // Validazione email
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(String(email || '').trim())) {
      return { statusCode: 400, headers: corsHeaders, body: 'Invalid email' };
    }

    const consentBool = !!consent;

    // --- ✅ INSERIMENTO IN SUPABASE ---
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

    const { error: dbErr } = await supabase
      .from('waiting_list')
      .insert([{ email, consent: consentBool, source: 'landing' }]);

    if (dbErr) {
      console.error('Supabase error:', dbErr);
      return { statusCode: 500, headers: corsHeaders, body: 'DB error' };
    }

    // --- ✉️ EMAIL DI RINGRAZIAMENTO ---
    const transporter = nodemailer.createTransport({
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

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject,
      text,
      html
    });

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('Function error:', e);
    return { statusCode: 500, headers: corsHeaders, body: 'Server error' };
  }
};

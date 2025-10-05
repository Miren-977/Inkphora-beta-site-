import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'https://inkphora.ai',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler = async (event, context) => {
  try {
    // Preflight
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: corsHeaders };
    }

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body || '{}');
    const { email, consent, hp } = body;

    // Honeypot
    if (hp && String(hp).trim() !== '') {
      return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
    }

    // Validate
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRe.test(email)) {
      return { statusCode: 400, headers: corsHeaders, body: 'Invalid email' };
    }
    if (consent !== true) {
      return { statusCode: 400, headers: corsHeaders, body: 'Consent required (GDPR)' };
    }

    // Supabase
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    const user_agent = event.headers?.['user-agent'] || null;

    const { error } = await supabase.from('mail').insert([{
      email,
      consent: true,
      source: 'netlify',
      user_agent,
    }]);

    if (error && !String(error.message || '').toLowerCase().includes('duplicate')) {
      console.error('Supabase insert error:', error);
      return { statusCode: 500, headers: corsHeaders, body: 'DB insert failed' };
    }

    console.log('New signup:', email);

    // SMTP (plain text)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: String(process.env.SMTP_SECURE) === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const text = `Thanks for joining us, and welcome to the private beta trial of Thymiko / Inkphora.
We’ll be in touch soon with the next steps to access and use the app.

— The Inkphora Team`;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Welcome to the Thymiko / Inkphora Beta 🌿',
        text,
      });
    } catch (e) {
      console.error('SMTP send error:', e?.message || e);
      // Non blocchiamo l’utente se l’email fallisce
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (e) {
    console.error('Unhandled error:', e);
    return { statusCode: 500, headers: corsHeaders, body: 'Internal error' };
  }
};

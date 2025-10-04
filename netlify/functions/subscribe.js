import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const textTemplate = fs.readFileSync(
  path.join(process.cwd(), 'netlify/functions/email_template_en.txt'),
  'utf8'
);

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, consent, hp } = req.body || {};

  if (hp && String(hp).trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (consent !== true) {
    return res.status(400).json({ error: 'Consent required (GDPR)' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  );

  const user_agent = req.headers['user-agent'] || null;

  const { error } = await supabase.from('mail').insert([
    { email, consent: true, source: 'netlify', user_agent },
  ]);

  if (error && !String(error.message).toLowerCase().includes('duplicate')) {
    console.error('Supabase insert error:', error.message);
    return res.status(500).json({ error: 'DB insert failed' });
  }

  console.log('New signup:', email);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Welcome to the Thymiko / Inkphora Beta 🌿',
      text: textTemplate,
    });
  } catch (e) {
    console.error('SMTP send error:', e.message);
  }

  return res.status(200).json({ ok: true });
};

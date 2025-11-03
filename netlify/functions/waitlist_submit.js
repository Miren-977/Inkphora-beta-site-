// Netlify Function (ESM) – one file, all in.
// Requisiti: package.json con { "type": "module" } e @supabase/supabase-js ^2
// ENV (Netlify): SUPABASE_URL, SUPABASE_SERVICE_ROLE

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { email: rawEmail } = JSON.parse(event.body || '{}');
    const email = (rawEmail || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid email' }) };
    }

    // 1) Leggi cutoff
    const { data: cfg, error: cfgErr } = await supabase
      .from('app_config')
      .select('cutoff_at')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cfgErr) throw cfgErr;
    const cutoffAt = cfg?.cutoff_at ? new Date(cfg.cutoff_at) : null;
    const closed = cutoffAt ? new Date() >= cutoffAt : false;

    // 2) Se open → waiting_list (no duplicati)
    if (!closed) {
      // già iscritto nel gruppo 1?
      const { data: existsMain, error: exErr } = await supabase
        .from('waiting_list')
        .select('id')
        .eq('email', email)
        .limit(1);

      if (exErr) throw exErr;

      if (existsMain && existsMain.length > 0) {
        return {
          statusCode: 200,
          headers: cors,
          body: JSON.stringify({ ok: true, state: 'open', routed_to: 'waiting_list', duplicate: true }),
        };
      }

      const { error: insErr } = await supabase.from('waiting_list').insert({ email });
      if (insErr) throw insErr;

      return {
        statusCode: 200,
        headers: cors,
        body: JSON.stringify({ ok: true, state: 'open', routed_to: 'waiting_list', duplicate: false }),
      };
    }

    // 3) Se closed → waiting_list_late, duplicati in waiting_list_duplicates_late
    const { data: existsLate, error: exLateErr } = await supabase
      .from('waiting_list_late')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (exLateErr) throw exLateErr;

    if (existsLate && existsLate.length > 0) {
      // Logga duplicato
      await supabase.from('waiting_list_duplicates_late').insert({ email }).catch(() => {});
      return {
        statusCode: 200,
        headers: cors,
        body: JSON.stringify({ ok: true, state: 'closed', routed_to: 'waiting_list_duplicates_late', duplicate: true }),
      };
    }

    const { error: insLateErr } = await supabase.from('waiting_list_late').insert({ email });
    if (insLateErr) throw insLateErr;

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ ok: true, state: 'closed', routed_to: 'waiting_list_late', duplicate: false }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: 'Server error', detail: String(err?.message || err) }),
    };
  }
};

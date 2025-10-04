Inkphora Mail Connector – Netlify Function
-----------------------------------------

1. Ensure all environment variables are set in Netlify:
   SUPABASE_URL, SUPABASE_SERVICE_ROLE, CORS_ORIGIN,
   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM.

2. Deploy this package on Netlify (Upload deploy or via Git).

3. Your endpoint will be:
   /.netlify/functions/subscribe

4. The function inserts the email + consent + user_agent into Supabase
   table 'mail' and sends a plain text thank-you email via Strato SMTP.

5. Debug:
   Check Netlify → Functions → Logs for "New signup: email@example.com".

Note: The HTML email template is included only as a visual backup.

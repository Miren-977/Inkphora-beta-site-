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

Inkphora / Thymiko – Updated Index
-----------------------------------------

This package updates your landing page to use the Netlify→Supabase connector.

Changes included:
- Removed redirect to thank-you.html
- Added honeypot anti-spam field
- Added GDPR consent checkbox (name="consent")
- Added inline bilingual message after submission
- Calls /.netlify/functions/subscribe via fetch()

To deploy:
1. Go to Netlify → Deploys → Upload deploy
2. Upload this zip
3. Test by submitting your email on the site

You should see:
"Thanks for joining the private beta! Please check your inbox for our welcome email.
Bitte überprüfe dein Postfach."

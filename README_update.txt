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

Inkphora / Thymiko – Complete Technical README
This document describes the full technical setup of the Inkphora / Thymiko landing system, including the Netlify Mail Connector, Supabase integration, and the LangChain RAG chatbot.

1. Architecture Overview
Frontend: Static HTML/CSS/JS landing page deployed on Netlify.
Backend: Netlify Functions (Node.js, CommonJS).
Database: Supabase (PostgreSQL).
Email: Strato SMTP via Nodemailer.
AI Chat: LangChain Retrieval (MemoryVectorStore) + OpenAI (gpt-4o-mini).

2. Environment Variables (Netlify)
Required environment variables:
•	SUPABASE_URL
•	SUPABASE_SERVICE_ROLE
•	CORS_ORIGIN
•	SMTP_HOST
•	SMTP_PORT
•	SMTP_SECURE
•	SMTP_USER
•	SMTP_PASS
•	SMTP_FROM
•	OPENAI_API_KEY

3. Mail Connector – Netlify Function
Endpoint:
•	/.netlify/functions/subscribe
Function responsibilities:
•	Insert email + consent + user_agent into Supabase table 'mail'.
•	Send plain text thank-you email via Strato SMTP.
Debug:
•	Netlify → Functions → Logs → Look for 'New signup: email@example.com'
Note: HTML email template is included as visual backup only.

4. Landing Page Integration
Changes implemented:
•	Removed redirect to thank-you.html
•	Added honeypot anti-spam field
•	Added GDPR consent checkbox (name='consent')
•	Added inline bilingual success message after submission
•	Uses fetch() to call /.netlify/functions/subscribe
Deployment steps:
•	Netlify → Deploys → Upload deploy OR Git-based deploy
Expected success message:
"Thanks for joining the private beta! Please check your inbox for our welcome email. Bitte überprüfe dein Postfach."

5. LangChain RAG Chatbot – Netlify Function
Endpoint:
•	/.netlify/functions/rag
Core components:
•	Loads .md/.txt documents from /netlify/functions/docs
•	Splits text via RecursiveCharacterTextSplitter
•	Creates embeddings via OpenAIEmbeddings
•	Stores vectors in MemoryVectorStore (runtime memory)
•	Performs similaritySearch(question, 4)
•	Calls OpenAI chat.completions (model: gpt-4o-mini)
Multilingual Logic:
•	Detects user language automatically.
•	Responds in the same language (EN, IT, FR, DE, ES, PT).
•	Uses ONLY retrieved context to answer.
•	If information is missing, returns a language-matched fallback message.
Important:
The 'docs' folder is located inside netlify/functions/docs due to Netlify deployment constraints.

6. Package Dependencies
•	@supabase/supabase-js
•	nodemailer
•	langchain
•	@langchain/openai
•	@langchain/core
•	openai
•	hnswlib-node
Node type: CommonJS

7. Chat UI Behavior
Mobile: Chat loads minimized by default with visible toggle button.
Desktop: Chat loads expanded.
Includes minimize option (does not clear chat history).

8. Notes for Grants / Portfolio
This implementation demonstrates a full-stack AI-enabled landing system with:
•	Secure email capture & GDPR compliance
•	Supabase backend integration
•	Serverless architecture via Netlify Functions
•	LangChain-based Retrieval-Augmented Generation (RAG)
•	Multilingual AI assistant logic
The RAG implementation uses runtime in-memory vector storage suitable for portfolio/demo use. For production scale, a persistent vector database (e.g., Supabase + pgvector) is recommended.

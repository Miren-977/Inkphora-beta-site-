const fs = require("fs");
const path = require("path");

const { OpenAIEmbeddings } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAI } = require("openai");

exports.handler = async (event) => {
  try {
    const { question } = JSON.parse(event.body);

    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No question provided" }),
      };
    }

    // 1️⃣ Load docs
    const docsPath = path.join(process.cwd(), "docs");
    const files = fs.readdirSync(docsPath);

    let rawText = "";

    files.forEach((file) => {
      const filePath = path.join(docsPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      rawText += content + "\n";
    });

    // 2️⃣ Split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
    });

    const documents = await splitter.createDocuments([rawText]);

    // 3️⃣ Embeddings
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      embeddings
    );

    // 4️⃣ Similarity search
    const results = await vectorStore.similaritySearch(question, 4);

    const context = results.map((r) => r.pageContent).join("\n");

    // 5️⃣ LLM call
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are the official Inkphora assistant. Answer only using the provided context. If the answer is not in the context, say you don’t know.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion:\n${question}`,
        },
      ],
      temperature: 0.3,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        answer: completion.choices[0].message.content,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

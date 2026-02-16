const fs = require("fs");
const path = require("path");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAI } = require("openai");

exports.handler = async (event) => {
  console.log("=== RAG Function Started ===");
  
  try {
    const { question } = JSON.parse(event.body);
    console.log("Question:", question);
    
    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No question provided" }),
      };
    }

    // 1️⃣ Load docs
    const docsPath = path.join(__dirname, "../../docs");
    console.log("Looking for docs at:", docsPath);
    console.log("Directory exists:", fs.existsSync(docsPath));
    
    if (!fs.existsSync(docsPath)) {
      throw new Error(`Docs folder not found at ${docsPath}`);
    }
    
    const files = fs.readdirSync(docsPath);
    console.log("Files found:", files);
    
    let rawText = "";
    files.forEach((file) => {
      if (file.endsWith(".md") || file.endsWith(".txt")) {
        const filePath = path.join(docsPath, file);
        const content = fs.readFileSync(filePath, "utf-8");
        rawText += content + "\n";
        console.log(`Loaded: ${file} (${content.length} chars)`);
      }
    });
    
    console.log("Total text loaded:", rawText.length, "chars");

    if (!rawText.trim()) {
      throw new Error("No content found in documents");
    }

    // 2️⃣ Split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
    });
    const documents = await splitter.createDocuments([rawText]);
    console.log("Created chunks:", documents.length);

    // 3️⃣ Embeddings
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      embeddings
    );
    console.log("Vector store created");

    // 4️⃣ Similarity search
    const results = await vectorStore.similaritySearch(question, 4);
    const context = results.map((r) => r.pageContent).join("\n");
    console.log("Context retrieved:", context.substring(0, 200) + "...");

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
            "You are the official Inkphora assistant. Answer only using the provided context. If the answer is not in the context, say you don't know.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion:\n${question}`,
        },
      ],
      temperature: 0.3,
    });
    
    const answer = completion.choices[0].message.content;
    console.log("Answer generated:", answer);

    return {
      statusCode: 200,
      body: JSON.stringify({ answer }),
    };
    
  } catch (error) {
    console.error("=== ERROR ===");
    console.error(error.message);
    console.error(error.stack);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        answer: "Sorry, I'm having trouble right now. Please try again later."
      }),
    };
  }
};

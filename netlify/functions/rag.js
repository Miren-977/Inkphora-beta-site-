const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  try {
    const { question } = JSON.parse(event.body);

    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No question provided" })
      };
    }

    // 🔹 Legge tutti i file dentro /documents
    const docsPath = path.join(__dirname, "../../documents");
    const files = fs.readdirSync(docsPath);

    let context = "";

    files.forEach((file) => {
      if (file.endsWith(".md") || file.endsWith(".txt")) {
        const content = fs.readFileSync(
          path.join(docsPath, file),
          "utf8"
        );
        context += "\n\n" + content;
      }
    });

    // 🔹 Chiamata OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Answer only using the provided context. If the answer is not in the context, say you don't know."
          },
          {
            role: "user",
            content: `Question:\n${question}\n\nContext:\n${context}`
          }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();

    const answer = data.choices?.[0]?.message?.content || "No answer.";

    return {
      statusCode: 200,
      body: JSON.stringify({ answer })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" })
    };
  }
};


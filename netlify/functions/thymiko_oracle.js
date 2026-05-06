exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
      };
    }

    const body = JSON.parse(event.body || "{}");

    const valence = Number(body.valence ?? 0);
    const arousal = Number(body.arousal ?? 0);
    const musicFamily = body.musicFamily || "unknown";
    const musicCondition = body.musicCondition || "unknown";

    const prompt = `
Write one very short poetic reflection for the Thymiko app.

Input:
- valence: ${valence}
- arousal: ${arousal}
- music family: ${musicFamily}
- music condition: ${musicCondition}

Rules:
- max 10 words
- one sentence only
- soft and poetic
- non-clinical
- no advice
- no explanation
- no quotes
- no emojis
- output only the phrase
`;

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You write minimal poetic reflections for an emotional drawing app.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 30,
        }),
      }
    );

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return {
        statusCode: openaiResponse.status,
        headers,
        body: JSON.stringify({
          error: "OpenAI request failed",
          details: data,
        }),
      };
    }

    const phrase =
      data?.choices?.[0]?.message?.content?.trim() ||
      "A quiet echo follows your gesture.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ phrase }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Thymiko oracle function failed",
        details: error.message,
      }),
    };
  }
};

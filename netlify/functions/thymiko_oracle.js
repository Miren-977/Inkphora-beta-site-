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
Write one micro-poetic reflection for the Thymiko app.

Input signal:
- valence: ${valence}
- arousal: ${arousal}
- music family: ${musicFamily}
- music condition: ${musicCondition}

Creative direction:
- speak to the user through their gesture
- use "your gesture", "your line", or "your trace"
- make it feel personal but safely ambiguous
- refer to movement, trace, rhythm, silence, light, breath, or space
- do not name emotions
- do not infer personality
- do not explain the signal

Hard rules:
- max 12 words
- one sentence only
- poetic but simple
- non-clinical
- no diagnosis
- no therapy language
- no advice
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
                "You write short, safe, poetic reflections for a gesture-based drawing app. Never diagnose or name emotions.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.75,
          max_tokens: 35,
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
      "Your gesture leaves a quiet trace.";

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

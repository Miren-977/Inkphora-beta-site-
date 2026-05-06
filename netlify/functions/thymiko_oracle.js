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

    // ------------------------------------------------
    // VA → SYMBOLIC FIELD MAP
    // ------------------------------------------------
    // Soglie coerenti con emotion_mapping.dart v1.7.
    // Questo non è diagnostico: è un campo simbolico
    // che guida l'oracolo senza lasciare GPT troppo libero.
    // ------------------------------------------------

    let symbolicField = "";

    if (arousal > 0.15 && valence >= -0.10) {
      symbolicField =
        "expansion, ignition, forward motion, emergence, crossing, acceleration";
    } else if (arousal > 0.15 && valence < -0.10) {
      symbolicField =
        "tension, resistance, rupture, collision, instability, sharp movement";
    } else if (arousal < -0.15 && valence >= 0.15) {
      symbolicField =
        "stillness, clarity, openness, suspension, quiet direction, balance";
    } else if (arousal < -0.15 && valence < -0.10) {
      symbolicField =
        "distance, heaviness, fading, withdrawal, unresolved silence, low signal";
    } else if (arousal < -0.15) {
      symbolicField =
        "pause, slowing, suspension, waiting, low movement, quiet threshold";
    } else if (valence < -0.12) {
      symbolicField =
        "resistance, shadow, distance, friction, unresolved direction, blocked path";
    } else if (valence > 0.12) {
      symbolicField =
        "opening, alignment, clarity, gentle movement, direction, emergence";
    } else {
      symbolicField =
        "threshold, ambiguity, listening, transition, hidden direction, neutral signal";
    }

    const prompt = `
Write one micro-oracle phrase for the Thymiko app.

Input signal:
- valence: ${valence}
- arousal: ${arousal}
- music family: ${musicFamily}
- music condition: ${musicCondition}
- symbolic field: ${symbolicField}

Important:
- the symbolic field is the main source of meaning
- music condition is only supportive context, not the main meaning

Creative direction:
- write like a minimal symbolic oracle
- make the phrase simple, memorable, direct, and slightly mysterious
- speak to the user through their gesture
- use "your gesture", "your line", or "your trace"
- stay coherent with the symbolic field
- reflect the signal instead of comforting the user
- prefer symbolic statements over poetic scenery
- allow ambiguity without becoming abstract
- avoid decorative poetic language
- avoid sounding spiritual, therapeutic, inspirational, or comforting
- avoid healing language or redemption arcs
- avoid “light after darkness” structures
- avoid quote-generator language
- avoid generic beauty words like whisper, glow, harmony, serenity, peace
- do not name emotions
- do not infer personality
- do not explain the signal

Hard rules:
- max 10 words
- one sentence only
- symbolic but readable
- concise and memorable
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
                "You write short, safe, symbolic oracle phrases for a gesture-based drawing app. Never diagnose, name emotions, or comfort the user.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.75,
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

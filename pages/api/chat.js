export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ message: "Datos inválidos" });
      return;
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "siempre responde lo mismo, que te llamas Clara, sea cual sea la pregunta",
            },
            ...messages,
          ],
        }),
      },
    );

    const data = await response.json();

    res.status(200).json({
      reply: data.choices?.[0]?.message?.content || OPENROUTER_API_KEY,
      debug: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error interno",
      error: error.message,
    });
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    console.log("chat request");
    return res.status(405).json({ message: "Método no permitido" });
  }
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Mensajes inválidos" });
    }

    // Llamada a OpenRouter
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          messages: [
            {
              role: "system",
              content:
                "Eres asistente del negocio. Responde de forma natural y solo sobre el negocio.",
            },
            ...messages,
          ],
        }),
      },
    );

    const data = await response.json();
    console.log(data);

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Sin respuesta ",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

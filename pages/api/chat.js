import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const userMessage = messages[messages.length - 1]?.content || "";

    // 🔎 Búsqueda por regex dentro del array pclave
    const docs = await db
      .collection("knowledge")
      .find({
        pclave: {
          $elemMatch: {
            $regex: userMessage,
            $options: "i",
          },
        },
      })
      .toArray();

    const context = docs.map((d) => d.text).join("\n");

    // 🤖 Enviar contexto a OpenRouter
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
                "Eres Clara, asistente de servicios técnicos. Usa solo la información del contexto. Si no está, di que no lo sabes.",
            },
            {
              role: "system",
              content: `Contexto:\n${context}`,
            },
            ...messages,
          ],
        }),
      },
    );

    const data = await response.json();

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Sin respuesta",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error interno",
      error: error.message,
    });
  }
}

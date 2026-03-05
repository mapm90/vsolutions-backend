// pages/api/chat.js
import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  try {
    const { messages, vector } = req.body;

    if (!messages || !Array.isArray(messages) || !vector) {
      res.status(400).json({ message: "Datos inválidos" });
      return;
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 🔎 búsqueda semántica
    const docs = await db
      .collection("knowledge")
      .aggregate([
        {
          $search: {
            index: "vector_index",
            knnBeta: {
              vector: vector,
              path: "embedding",
              k: 5,
            },
          },
        },
      ])
      .toArray();

    // 📄 contexto
    const context = docs.map((d) => d.text).join("\n");

    // 🤖 llamada a IA con contexto
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
                "Eres asistente del negocio. Usa este contexto para responder: " +
                context,
            },
            ...messages,
          ],
        }),
      },
    );

    const data = await response.json();

    res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Sin respuesta",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error interno",
      error: error.message,
    });
  }
}

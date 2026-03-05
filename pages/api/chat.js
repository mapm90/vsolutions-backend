// pages/api/chat.js
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { messages, vector } = req.body;

    if (!messages || !Array.isArray(messages) || !vector) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 🔎 búsqueda semántica en colección de conocimiento
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

    // 📄 construir contexto
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

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Sin respuesta",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error interno",
      error: error.message,
    });
  }
}

import clientPromise from "../../lib/mongodb";
import { pipeline } from "@xenova/transformers";

let extractor = null;

// 🔥 Inicializa modelo una sola vez
async function getEmbedding(text) {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}

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

    // 🧠 1️⃣ Generar embedding LOCAL
    const queryVector = await getEmbedding(userMessage);

    // 🔎 2️⃣ Buscar por similaridad en Mongo
    const docs = await db
      .collection("knowledge")
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            queryVector: queryVector,
            path: "embedding",
            numCandidates: 100,
            limit: 5,
          },
        },
      ])
      .toArray();

    const context = docs.map((d) => d.text).join("\n");

    // 🤖 3️⃣ Enviar contexto al modelo
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
                "Eres Clara, asistente de servicios técnicos. Responde solo usando el contexto proporcionado. Si no está en el contexto, di que no tienes esa información.",
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
    return res.status(500).json({
      message: "Error interno",
      error: error.message,
    });
  }
}

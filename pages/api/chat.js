import clientPromise from "../../lib/mongodb";
import { procesarTexto } from "../../lib/nlp";

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
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ message: "Datos inválidos" });
      return;
    }

    const userMessage = messages[messages.length - 1]?.content || "";

    // ===== NLP =====
    const raicesMensaje = procesarTexto(userMessage);

    // ===== Mongo =====
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection("knowledge");

    const docs = await collection.find({}).toArray();

    let contexto = "";

    docs.forEach((doc) => {
      if (!doc.pclave || !Array.isArray(doc.pclave)) return;

      // NLP también en palabras clave
      const raicesClave = doc.pclave.map((p) =>
        natural.PorterStemmer.stem(p.toLowerCase()),
      );

      // coincidencia: alguna raíz en mensaje
      const match = raicesClave.some((r) => raicesMensaje.includes(r));

      if (match) {
        contexto += doc.text + "\n\n";
      }
    });

    // ===== IA =====
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
                "Responde usando esta información si es relevante:\n\n" +
                contexto,
            },
            ...messages,
          ],
        }),
      },
    );

    const data = await response.json();

    res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Sin respuesta",
      contextoUsado: contexto,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error interno",
      error: error.message,
    });
  }
}

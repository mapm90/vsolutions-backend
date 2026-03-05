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

    // 🔧 1️⃣ CORREGIR ORTOGRAFÍA CON OPENROUTER
    let corrected = userMessage;

    try {
      const correction = await fetch(
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
                  "Corrige ortografía y devuelve solo el texto corregido, sin explicaciones.",
              },
              {
                role: "user",
                content: userMessage,
              },
            ],
          }),
        },
      );

      const data = await correction.json();
      corrected = data.choices?.[0]?.message?.content?.trim() || userMessage;
    } catch (e) {
      console.error("error corrigiendo:", e);
    }

    // 🔎 2️⃣ BUSCAR EN pclave (con texto corregido)
    const term = corrected
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const docs = await db
      .collection("knowledge")
      .find({
        pclave: { $in: [term] },
      })
      .toArray();

    console.log("término original:", userMessage);
    console.log("término corregido:", term);
    console.log("docs:", docs);

    const context = docs.map((d) => d.text).join("\n");

    // 🤖 3️⃣ RESPONDER CON CONTEXTO
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

    const data2 = await response.json();

    return res.status(200).json({
      reply: data2.choices?.[0]?.message?.content || "Sin respuesta",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error interno",
      error: error.message,
    });
  }
}
